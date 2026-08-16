-- Real notification preferences, backing the Settings > Notifications tab,
-- which previously only held local component state (M3 from the pilot
-- audit) — switches looked functional but reset on every reload and were
-- never read anywhere.

BEGIN;

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  tournament_alerts boolean NOT NULL DEFAULT true,
  payment_reminders boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_select_own ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_insert_own ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notification_preferences_update_own ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

COMMIT;
