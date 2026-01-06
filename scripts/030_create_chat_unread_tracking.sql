-- Create unread_messages table to track unread counts per user per room
CREATE TABLE IF NOT EXISTS public.unread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  unread_count integer DEFAULT 0,
  last_read_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, room_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_unread_messages_user_room 
ON public.unread_messages(user_id, room_id);

-- Create function to increment unread count for all room members
CREATE OR REPLACE FUNCTION public.increment_unread_for_room_members()
RETURNS TRIGGER AS $$
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
  SET unread_count = unread_count + 1,
      updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call unread tracking function
DROP TRIGGER IF EXISTS tr_increment_unread_on_message ON public.chat_messages;
CREATE TRIGGER tr_increment_unread_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.increment_unread_for_room_members();

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_user_id uuid, p_room_id uuid)
RETURNS void AS $$
BEGIN
  -- Update read_by array for all unread messages in the room
  UPDATE public.chat_messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE room_id = p_room_id
  AND NOT (read_by @> ARRAY[p_user_id]);
  
  -- Reset unread count for user
  UPDATE public.unread_messages
  SET unread_count = 0,
      updated_at = now()
  WHERE user_id = p_user_id
  AND room_id = p_room_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get unread count for user in room
CREATE OR REPLACE FUNCTION public.get_unread_count(p_user_id uuid, p_room_id uuid)
RETURNS integer AS $$
DECLARE
  count integer;
BEGIN
  SELECT COALESCE(unread_count, 0) INTO count
  FROM public.unread_messages
  WHERE user_id = p_user_id AND room_id = p_room_id;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql;
