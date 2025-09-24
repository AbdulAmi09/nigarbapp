-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_assignments;

-- Create realtime policies
CREATE POLICY "Users can listen to their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can listen to chat messages in their rooms" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id 
      AND (NOT is_private OR auth.uid() = ANY(members) OR auth.uid() = created_by)
    )
  );

CREATE POLICY "Users can listen to their assignments" ON public.tournament_assignments
  FOR SELECT USING (auth.uid() = arbiter_id OR auth.uid() = assigned_by);
