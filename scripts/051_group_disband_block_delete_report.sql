-- Implements the remaining WhatsApp-parity gap items, per explicit product
-- answers from the app owner:
--   1. Groups can never be left by members -- only an admin can remove a
--      member or disband the whole group.
--   2. Blocking is one-directional/WhatsApp-style: a blocked user can still
--      send messages, the blocker just never sees them (in DMs only --
--      blocking does not affect shared groups, matching real WhatsApp).
--   3. "Delete conversation" = delete-for-me (hide it from my own chat
--      list; history is untouched and reappears if they message again).
--      Deleting a single MESSAGE for everyone already existed
--      (chat_messages.is_deleted) -- nothing to add there.
--   4. No retention limit -- admin deletes manually in Supabase when
--      needed. No schema change needed for that; the *loading* behavior
--      (last 50, load older on scroll-up, search hits the full table) is
--      implemented in the chat page, not here.
--   5. Report-then-optionally-block, WhatsApp style.

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Groups/DMs can't be self-left. Only group_members_admin_all
--    (is_main_admin) may remove a row now; disband_group() below is the
--    only way a whole group goes away.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS group_members_delete_self ON public.group_members;

ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.disband_group(p_room_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_main_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only an admin can disband a group';
  END IF;

  -- group_members_group_id_fkey has no ON DELETE action, so member rows
  -- must go first or the chat_rooms delete below fails on the FK.
  DELETE FROM public.group_members WHERE group_id = p_room_id;
  DELETE FROM public.chat_rooms WHERE id = p_room_id;
END;
$function$;

-- Delete-for-me: hide a conversation from the caller's own chat list
-- without touching it for anyone else. Narrow SECURITY DEFINER RPC rather
-- than a general self-UPDATE policy for the same reason set_group_mute
-- is one: group_members has no safe generic self-update path (it would
-- also let a member touch their own `role`).
CREATE OR REPLACE FUNCTION public.set_conversation_hidden(p_room_id uuid, p_hidden boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.group_members
  SET is_hidden = p_hidden
  WHERE group_id = p_room_id AND user_id = auth.uid();
END;
$function$;

-- ---------------------------------------------------------------------
-- 2. Blocking (DMs only, one-directional, WhatsApp style).
-- ---------------------------------------------------------------------
CREATE TABLE public.blocked_users (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY blocked_users_select_own ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY blocked_users_insert_own ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY blocked_users_delete_own ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- RESTRICTIVE policies AND with every existing permissive SELECT policy on
-- the table, so this hides blocked-sender rows no matter which permissive
-- policy would otherwise have allowed the read -- including a raw REST
-- call, not just the chat UI. Scoped to DMs only: WhatsApp does not hide a
-- blocked contact's messages in a group you both share.
CREATE POLICY chat_messages_hide_blocked_dm ON public.chat_messages
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      JOIN public.chat_rooms cr ON cr.id = chat_messages.room_id
      WHERE bu.blocker_id = auth.uid()
      AND bu.blocked_id = chat_messages.sender_id
      AND cr.is_direct_message
    )
  );

-- ---------------------------------------------------------------------
-- 3. Report a user or a specific message, optionally blocking at the
--    same time (handled client-side by calling both).
-- ---------------------------------------------------------------------
CREATE TABLE public.chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason = ANY (ARRAY['spam', 'harassment', 'inappropriate_content', 'other'])),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status = ANY (ARRAY['open', 'reviewed', 'dismissed'])),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_reports_insert_own ON public.chat_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY chat_reports_select_own ON public.chat_reports
  FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY chat_reports_admin_all ON public.chat_reports
  USING (public.is_main_admin(auth.uid()))
  WITH CHECK (public.is_main_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- Wire blocking + delete-for-me into the unread trigger: a blocked DM
-- sender's messages shouldn't bump the blocker's unread badge, and a
-- hidden conversation should reappear (un-hide) when a new message
-- arrives -- except for a blocked DM sender, since the blocker will never
-- see that message anyway.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_unread_for_room_members()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_dm boolean;
BEGIN
  SELECT is_direct_message INTO v_is_dm FROM public.chat_rooms WHERE id = NEW.room_id;

  UPDATE public.unread_messages um
  SET unread_count = um.unread_count + 1,
      updated_at = now()
  WHERE um.room_id = NEW.room_id
  AND um.user_id != NEW.sender_id
  AND um.user_id IN (SELECT user_id FROM public.group_members WHERE group_id = NEW.room_id)
  AND NOT (v_is_dm AND EXISTS (
    SELECT 1 FROM public.blocked_users bu WHERE bu.blocker_id = um.user_id AND bu.blocked_id = NEW.sender_id
  ));

  INSERT INTO public.unread_messages (user_id, room_id, unread_count)
  SELECT gm.user_id, NEW.room_id, 1
  FROM public.group_members gm
  WHERE gm.group_id = NEW.room_id
  AND gm.user_id != NEW.sender_id
  AND NOT (v_is_dm AND EXISTS (
    SELECT 1 FROM public.blocked_users bu WHERE bu.blocker_id = gm.user_id AND bu.blocked_id = NEW.sender_id
  ))
  AND NOT EXISTS (
    SELECT 1 FROM public.unread_messages um2
    WHERE um2.user_id = gm.user_id
    AND um2.room_id = NEW.room_id
  )
  ON CONFLICT (user_id, room_id) DO UPDATE
  SET unread_count = public.unread_messages.unread_count + 1,
      updated_at = now();

  UPDATE public.group_members gm
  SET is_hidden = false
  WHERE gm.group_id = NEW.room_id
  AND gm.user_id != NEW.sender_id
  AND gm.is_hidden = true
  AND NOT (v_is_dm AND EXISTS (
    SELECT 1 FROM public.blocked_users bu WHERE bu.blocker_id = gm.user_id AND bu.blocked_id = NEW.sender_id
  ));

  RETURN NEW;
END;
$function$;

-- Same blocked-in-DM exclusion for push: no point pinging someone with a
-- notification for a message they won't see in-app.
CREATE OR REPLACE FUNCTION public.get_push_recipients(p_room_id uuid, p_sender_id uuid)
 RETURNS TABLE (user_id uuid, endpoint text, p256dh text, auth_key text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_dm boolean;
BEGIN
  IF p_sender_id <> auth.uid() OR NOT public.is_group_member(p_room_id, auth.uid()) THEN
    RETURN;
  END IF;

  SELECT is_direct_message INTO v_is_dm FROM public.chat_rooms WHERE id = p_room_id;

  RETURN QUERY
  SELECT ps.user_id, ps.endpoint, ps.p256dh, ps.auth_key
  FROM public.push_subscriptions ps
  WHERE ps.user_id <> p_sender_id
  AND public.is_group_member(p_room_id, ps.user_id)
  AND NOT (v_is_dm AND EXISTS (
    SELECT 1 FROM public.blocked_users bu WHERE bu.blocker_id = ps.user_id AND bu.blocked_id = p_sender_id
  ));
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';
