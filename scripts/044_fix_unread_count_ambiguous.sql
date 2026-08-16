-- Fix "column reference \"unread_count\" is ambiguous" (breaks every chat
-- message send that needs to create a fresh unread_messages row — i.e. the
-- first message to any room member who doesn't already have one). The
-- INSERT ... SELECT ... ON CONFLICT DO UPDATE SET unread_count = unread_count + 1
-- form leaves the RHS reference ambiguous; qualifying it against the
-- target table resolves it (confirmed by direct reproduction).

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_unread_for_room_members()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update unread count for all members except the sender
  UPDATE public.unread_messages
  SET unread_count = unread_count + 1,
      updated_at = now()
  WHERE room_id = NEW.room_id
  AND user_id != NEW.sender_id
  AND user_id IN (
    SELECT user_id FROM public.group_members
    WHERE group_id = NEW.room_id
  );

  -- If no row exists for a member, insert one
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
