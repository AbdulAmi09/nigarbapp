-- Create function to get or create direct message room
CREATE OR REPLACE FUNCTION public.get_or_create_dm_room(p_user_id uuid, p_other_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_room_id uuid;
  v_room_name text;
BEGIN
  -- Check if DM room already exists (in either direction)
  SELECT id INTO v_room_id
  FROM public.chat_rooms
  WHERE is_direct_message = true
  AND (
    (created_by = p_user_id AND direct_message_with = p_other_user_id)
    OR (created_by = p_other_user_id AND direct_message_with = p_user_id)
  )
  LIMIT 1;
  
  -- If room exists, return it
  IF v_room_id IS NOT NULL THEN
    RETURN v_room_id;
  END IF;
  
  -- Create new DM room
  SELECT name INTO v_room_name FROM public.profiles WHERE id = p_other_user_id;
  
  INSERT INTO public.chat_rooms (
    name,
    room_type,
    is_private,
    is_direct_message,
    created_by,
    direct_message_with,
    members
  ) VALUES (
    v_room_name,
    'Private',
    true,
    true,
    p_user_id,
    p_other_user_id,
    ARRAY[p_user_id, p_other_user_id]
  )
  RETURNING id INTO v_room_id;
  
  -- Add both users as members
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_room_id, p_user_id, 'member'), (v_room_id, p_other_user_id, 'member');
  
  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to search users for DM
CREATE OR REPLACE FUNCTION public.search_users_for_dm(p_search_query text, p_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  avatar_url text,
  arbiter_category text
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.avatar_url, p.arbiter_category
  FROM public.profiles p
  WHERE (p.name ILIKE '%' || p_search_query || '%'
     OR p.email ILIKE '%' || p_search_query || '%')
  AND p.id != auth.uid()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
