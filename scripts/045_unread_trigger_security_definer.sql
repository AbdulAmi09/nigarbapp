-- Deeper half of the unread_messages fix: increment_unread_for_room_members
-- writes to OTHER users' rows (the recipients' unread counters), never the
-- sender's own row. As a plain (non-definer) trigger it runs under the
-- sending user's RLS context, so:
--   - the migration-037 INSERT policy covers a brand-new conversation
--     (no existing row for the recipient yet), but
--   - the ON CONFLICT DO UPDATE path for a recipient who already HAS an
--     unread_messages row still hits the pre-existing UPDATE policies,
--     which only ever allowed `user_id = auth.uid()` — i.e. never the
--     sender writing the recipient's row.
-- Confirmed by direct reproduction: "new row violates row-level security
-- policy for table unread_messages" on the second+ message to someone.
--
-- Fix: mark the trigger SECURITY DEFINER, the same pattern already used
-- for every other cross-user write in this schema (send_notification,
-- record_paystack_payment, handle_assignment_status_change, etc).

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_unread_for_room_members()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.unread_messages
  SET unread_count = unread_count + 1,
      updated_at = now()
  WHERE room_id = NEW.room_id
  AND user_id != NEW.sender_id
  AND user_id IN (
    SELECT user_id FROM public.group_members
    WHERE group_id = NEW.room_id
  );

  INSERT INTO public.unread_messages (user_id, room_id, unread_count)
  SELECT user_id, NEW.room_id, 1
  FROM public.group_members
  WHERE group_id = NEW.room_id
  AND user_id != NEW.sender_id
  AND NOT EXISTS (
    SELECT 1 FROM public.unread_messages
    WHERE user_id = group_members.user_id
    AND room_id = NEW.room_id
  )
  ON CONFLICT (user_id, room_id) DO UPDATE
  SET unread_count = public.unread_messages.unread_count + 1,
      updated_at = now();

  RETURN NEW;
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';
