-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to calculate arbiter rating
CREATE OR REPLACE FUNCTION public.calculate_arbiter_rating(arbiter_uuid UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT AVG(overall_rating)::DECIMAL(3,2)
  INTO avg_rating
  FROM public.tournament_evaluations te
  JOIN public.tournament_assignments ta ON te.tournament_id = ta.tournament_id
  WHERE ta.arbiter_id = arbiter_uuid;
  
  RETURN COALESCE(avg_rating, 0.00);
END;
$$;

-- Function to get tournament statistics
CREATE OR REPLACE FUNCTION public.get_tournament_stats(arbiter_uuid UUID)
RETURNS TABLE(
  total_tournaments BIGINT,
  completed_tournaments BIGINT,
  pending_assignments BIGINT,
  average_rating DECIMAL(3,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tournaments,
    COUNT(*) FILTER (WHERE ta.assignment_status = 'Completed') as completed_tournaments,
    COUNT(*) FILTER (WHERE ta.assignment_status = 'Pending') as pending_assignments,
    public.calculate_arbiter_rating(arbiter_uuid) as average_rating
  FROM public.tournament_assignments ta
  WHERE ta.arbiter_id = arbiter_uuid;
END;
$$;

-- Function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
  recipient_uuid UUID,
  sender_uuid UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type_param notification_type,
  related_uuid UUID DEFAULT NULL,
  action_url_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    recipient_id, sender_id, title, message, notification_type, 
    related_id, action_url
  )
  VALUES (
    recipient_uuid, sender_uuid, notification_title, notification_message,
    notification_type_param, related_uuid, action_url_param
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO unread_count
  FROM public.notifications
  WHERE recipient_id = user_uuid AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;
