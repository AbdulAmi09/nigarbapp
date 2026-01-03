-- Create helper functions for notification management

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read = true
  WHERE recipient_id = user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification summary for dashboard
CREATE OR REPLACE FUNCTION get_notification_summary(user_id uuid)
RETURNS TABLE (
  total_notifications bigint,
  unread_notifications bigint,
  action_required_notifications bigint,
  high_priority_notifications bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_notifications,
    COUNT(*) FILTER (WHERE is_read = false)::bigint as unread_notifications,
    COUNT(*) FILTER (WHERE action_required = true)::bigint as action_required_notifications,
    COUNT(*) FILTER (WHERE is_important = true)::bigint as high_priority_notifications
  FROM public.notifications
  WHERE recipient_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle assignment status updates and create notifications
CREATE OR REPLACE FUNCTION handle_assignment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignment_status != OLD.assignment_status THEN
    -- Create a notification for the status change
    INSERT INTO public.notifications (
      recipient_id,
      notification_type,
      action_type,
      title,
      message,
      related_id,
      action_required,
      is_read,
      created_at
    ) VALUES (
      NEW.arbiter_id::uuid,
      'assignment',
      'Status_Update',
      'Assignment Status Updated',
      'Your assignment status for ' || NEW.tournament_name || ' has been updated to ' || NEW.assignment_status,
      NEW.id,
      false,
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assignment status changes
DROP TRIGGER IF EXISTS trg_assignment_status_change ON public.tournament_assignments;
CREATE TRIGGER trg_assignment_status_change
  AFTER UPDATE ON public.tournament_assignments
  FOR EACH ROW
  EXECUTE FUNCTION handle_assignment_status_change();
