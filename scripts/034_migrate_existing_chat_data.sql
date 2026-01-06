-- Ensure all existing group members are added to unread_messages if not already
INSERT INTO public.unread_messages (user_id, room_id, unread_count)
SELECT gm.user_id, gm.group_id, 0
FROM public.group_members gm
LEFT JOIN public.unread_messages um ON gm.user_id = um.user_id AND gm.group_id = um.room_id
WHERE um.id IS NULL;
