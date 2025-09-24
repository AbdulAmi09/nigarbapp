-- Create chat rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL CHECK (room_type IN ('General', 'Committee', 'Zone', 'Tournament', 'Private')),
  is_private BOOLEAN DEFAULT false,
  members UUID[] DEFAULT '{}',
  moderators UUID[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  reply_to UUID REFERENCES public.chat_messages(id),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat rooms
CREATE POLICY "chat_rooms_select_member" ON public.chat_rooms 
  FOR SELECT USING (NOT is_private OR auth.uid() = ANY(members) OR auth.uid() = created_by);

CREATE POLICY "chat_rooms_insert_authenticated" ON public.chat_rooms 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "chat_rooms_update_moderator" ON public.chat_rooms 
  FOR UPDATE USING (auth.uid() = ANY(moderators) OR auth.uid() = created_by);

-- Create RLS policies for chat messages
CREATE POLICY "chat_messages_select_room_member" ON public.chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id 
      AND (NOT is_private OR auth.uid() = ANY(members) OR auth.uid() = created_by)
    )
  );

CREATE POLICY "chat_messages_insert_room_member" ON public.chat_messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id 
      AND (NOT is_private OR auth.uid() = ANY(members) OR auth.uid() = created_by)
    )
  );

CREATE POLICY "chat_messages_update_own" ON public.chat_messages 
  FOR UPDATE USING (auth.uid() = sender_id);

-- Create indexes
CREATE INDEX idx_chat_rooms_type ON public.chat_rooms(room_type);
CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);
