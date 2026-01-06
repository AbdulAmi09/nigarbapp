-- Add logo column to chat_rooms and direct_message_with column for DMs
ALTER TABLE public.chat_rooms
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS direct_message_with uuid,
ADD COLUMN IF NOT EXISTS is_direct_message boolean DEFAULT false;

-- Add foreign key for direct message linking
ALTER TABLE public.chat_rooms
ADD CONSTRAINT chat_rooms_direct_message_with_fkey 
FOREIGN KEY (direct_message_with) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Create index for direct message lookups
CREATE INDEX IF NOT EXISTS idx_chat_rooms_direct_message 
ON public.chat_rooms(direct_message_with, is_direct_message);

-- Update message_type enum to include voice messages
ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'voice';

-- Add voice-specific columns to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS duration integer,
ADD COLUMN IF NOT EXISTS voice_transcription text;

-- Add unread tracking column
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS read_by uuid[] DEFAULT '{}';
