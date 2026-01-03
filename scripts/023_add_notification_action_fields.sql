-- Add missing columns to notifications table for proper action handling
-- These columns support the client-side action buttons in notifications

-- Add action_required column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_required boolean DEFAULT false;

-- Add action_type column if it doesn't exist
-- Values: 'Tournament_assignment', 'URL', etc.
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_type text;

-- Add action_url column for URL-based notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_url text;

-- Add related_id column to link notifications to specific records (like tournament_assignments)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_id uuid;

-- Create index for faster queries on action_required
CREATE INDEX IF NOT EXISTS idx_notifications_action_required 
ON public.notifications(action_required) 
WHERE action_required = true;

-- Create index for faster filtering by action_type
CREATE INDEX IF NOT EXISTS idx_notifications_action_type 
ON public.notifications(action_type);

-- Update existing Tournament_assignment notifications to set action_required = true
UPDATE public.notifications 
SET action_required = true, action_type = 'Tournament_assignment'
WHERE notification_type = 'assignment' AND action_required IS NULL;
