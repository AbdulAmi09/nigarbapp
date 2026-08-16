-- Foundations for real presence and read receipts in chat.
--
-- 1. mark_messages_as_read updates OTHER people's messages (the reader
--    marking the SENDER's rows as read via read_by), same cross-user-write
--    pattern that already bit unread_messages twice this session. It's not
--    SECURITY DEFINER, so under RLS (chat_messages UPDATE policies only
--    allow sender_id = auth.uid()) the read_by update silently affects
--    zero rows — read receipts have never actually been recorded.
-- 2. profiles.last_seen_at backs "last seen" in the chat header once a
--    contact goes offline.

BEGIN;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_user_id uuid, p_room_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.chat_messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE room_id = p_room_id
  AND NOT (read_by @> ARRAY[p_user_id]);

  UPDATE public.unread_messages
  SET unread_count = 0,
      updated_at = now()
  WHERE user_id = p_user_id
  AND room_id = p_room_id;
END;
$function$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

COMMIT;

NOTIFY pgrst, 'reload schema';
