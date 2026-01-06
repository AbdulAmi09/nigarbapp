-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Enable realtime for unread messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.unread_messages;

-- Enable realtime for chat_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
