-- Function to increment unread message count
CREATE OR REPLACE FUNCTION increment_unread_count(p_room_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.unread_messages (room_id, user_id, unread_count, last_read_at)
  VALUES (p_room_id, p_user_id, 1, now())
  ON CONFLICT (room_id, user_id) 
  DO UPDATE SET unread_count = unread_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_room_as_read(p_room_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.unread_messages
  SET unread_count = 0, last_read_at = now()
  WHERE room_id = p_room_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.unread_messages (room_id, user_id, unread_count, last_read_at)
    VALUES (p_room_id, p_user_id, 0, now());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get group member count
CREATE OR REPLACE FUNCTION get_group_member_count(p_group_id uuid)
RETURNS integer AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*) INTO count FROM public.group_members WHERE group_id = p_group_id;
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update group member's last_active_at
CREATE OR REPLACE FUNCTION update_member_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.group_members
  SET last_active_at = now()
  WHERE group_id = NEW.group_id AND user_id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_last_active ON public.chat_messages;
CREATE TRIGGER trigger_update_member_last_active
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_active();
