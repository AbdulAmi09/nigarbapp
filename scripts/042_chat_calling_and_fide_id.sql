-- Chat rebuild toward a WhatsApp-style experience:
-- 1. FIDE ID becomes the way arbiters find each other to start a DM
--    (replacing free-text name search).
-- 2. Only superadmins can create group chat rooms — DMs stay open to everyone.
-- 3. A `calls` table backs real voice/video calling: Postgres row = call
--    state/history (ringing/accepted/declined/ended), used both as the
--    signal that triggers an incoming-call notification (via Realtime
--    postgres_changes) and as call history. The actual WebRTC offer/answer/
--    ICE exchange happens over an ephemeral Supabase Realtime broadcast
--    channel keyed by call id, not stored in the database.

BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fide_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_fide_id_unique
  ON public.profiles (fide_id)
  WHERE fide_id IS NOT NULL;

-- FIDE ID lookup replaces name search for starting a new conversation.
DROP FUNCTION IF EXISTS public.search_users_for_dm(text, integer);

CREATE FUNCTION public.search_users_for_dm(p_search_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, email text, avatar_url text, arbiter_category text, fide_id text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, (p.first_name || ' ' || p.last_name) AS name, p.email, p.avatar_url, p.arbiter_level::text AS arbiter_category, p.fide_id
  FROM public.profiles p
  WHERE p.fide_id ILIKE p_search_query || '%'
  AND p.fide_id IS NOT NULL
  AND p.id != auth.uid()
  LIMIT p_limit;
END;
$function$;

-- Only superadmins can create a group room; anyone authenticated can still
-- create a DM (also covered by get_or_create_dm_room, which is
-- SECURITY DEFINER and bypasses this policy anyway).
DROP POLICY IF EXISTS chat_rooms_insert_authenticated ON public.chat_rooms;

CREATE POLICY chat_rooms_insert_dm_or_superadmin ON public.chat_rooms
  FOR INSERT
  WITH CHECK (
    (is_direct_message = true AND auth.role() = 'authenticated')
    OR (
      is_direct_message = false
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
    )
  );

CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
  caller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type text NOT NULL DEFAULT 'voice',
  status text NOT NULL DEFAULT 'ringing',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY calls_select_participant ON public.calls
  FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY calls_insert_caller ON public.calls
  FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY calls_update_participant ON public.calls
  FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;

COMMIT;
