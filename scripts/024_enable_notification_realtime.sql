-- Enable realtime subscriptions for notifications table
-- This allows real-time updates in the dashboard when new notifications arrive

BEGIN;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

COMMIT;
