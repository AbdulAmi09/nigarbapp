-- Create group_members table to track chat room members and their details
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'moderator'::text, 'member'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  last_active_at timestamp with time zone DEFAULT now(),
  is_muted boolean DEFAULT false,
  CONSTRAINT group_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.arbiters(id) ON DELETE CASCADE,
  CONSTRAINT unique_group_member UNIQUE(group_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- Enable RLS on group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_members
CREATE POLICY "Users can view group members they are part of" 
  ON public.group_members FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM public.group_members WHERE group_id = group_members.group_id
    )
  );

CREATE POLICY "Admins can manage group members"
  ON public.group_members FOR ALL
  USING (
    (SELECT role FROM public.group_members WHERE group_id = group_members.group_id AND user_id = auth.uid()) IN ('admin', 'moderator')
  );

-- Add unread message tracking to chat_rooms
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS unread_count jsonb DEFAULT '{}'::jsonb;

-- Create unread_messages tracking table
CREATE TABLE IF NOT EXISTS public.unread_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  unread_count integer DEFAULT 0,
  last_read_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unread_messages_pkey PRIMARY KEY (id),
  CONSTRAINT unread_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  CONSTRAINT unread_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.arbiters(id) ON DELETE CASCADE,
  CONSTRAINT unique_room_user_unread UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_unread_messages_room_id ON public.unread_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_unread_messages_user_id ON public.unread_messages(user_id);

ALTER TABLE public.unread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unread messages"
  ON public.unread_messages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own unread messages"
  ON public.unread_messages FOR UPDATE
  USING (user_id = auth.uid());

-- Add new columns to chat_messages for enhanced features
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'file'::text, 'image'::text, 'voice'::text, 'video'::text]));
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_size integer;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;

-- Enable realtime for chat functionality
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE unread_messages;
