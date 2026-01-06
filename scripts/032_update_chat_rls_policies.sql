-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can only see rooms they are members of" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can only see messages from rooms they're in" ON public.chat_messages;

-- Create new RLS policy for chat_rooms - only show rooms user is member of
CREATE POLICY "Users can only see rooms they are members of"
ON public.chat_rooms FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.group_members 
    WHERE group_id = chat_rooms.id
  )
  OR created_by = auth.uid()
);

-- Create RLS policy for chat_messages - only show from member rooms
CREATE POLICY "Users can only see messages from rooms they are members of"
ON public.chat_messages FOR SELECT
USING (
  room_id IN (
    SELECT id FROM public.chat_rooms
    WHERE auth.uid() IN (
      SELECT user_id FROM public.group_members 
      WHERE group_id = chat_rooms.id
    )
    OR created_by = auth.uid()
  )
);

-- Allow users to insert messages only in rooms they're members of
CREATE POLICY "Users can only send messages to rooms they are members of"
ON public.chat_messages FOR INSERT
WITH CHECK (
  room_id IN (
    SELECT id FROM public.chat_rooms
    WHERE auth.uid() IN (
      SELECT user_id FROM public.group_members 
      WHERE group_id = chat_rooms.id
    )
  )
  AND sender_id = auth.uid()
);

-- Enable RLS for unread_messages table
ALTER TABLE public.unread_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for unread_messages
CREATE POLICY "Users can only see their own unread messages"
ON public.unread_messages FOR SELECT
USING (user_id = auth.uid());

-- Allow users to update their own unread messages
CREATE POLICY "Users can only update their own unread messages"
ON public.unread_messages FOR UPDATE
USING (user_id = auth.uid());
