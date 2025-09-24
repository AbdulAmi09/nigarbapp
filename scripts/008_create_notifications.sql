-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  related_id UUID, -- Can reference tournaments, assignments, payments, etc.
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  action_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "notifications_select_own" ON public.notifications 
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_insert_authenticated" ON public.notifications 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_own" ON public.notifications 
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Create indexes
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
