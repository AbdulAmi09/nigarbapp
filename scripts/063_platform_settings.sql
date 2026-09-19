-- Command Center Phase 1: real settings storage. Today's settings page has
-- "System Name"/"Organization" inputs and "Email Notifications"/"System
-- Alerts" checkboxes with defaultValue/defaultChecked and Save buttons with
-- no onClick handler at all -- entirely fake, nothing persists.

BEGIN;

CREATE TABLE public.platform_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  system_name text NOT NULL DEFAULT 'NCAA Command Center',
  organization_name text NOT NULL DEFAULT 'Nigeria Chess Arbiters Association',
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  system_alerts_enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id) VALUES (true);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings readable by authenticated" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings writable by super_admin" ON public.platform_settings
  FOR UPDATE TO authenticated
  USING (platform_is_super_admin(auth.uid()))
  WITH CHECK (platform_is_super_admin(auth.uid()));

GRANT SELECT, UPDATE ON public.platform_settings TO authenticated;

CREATE OR REPLACE FUNCTION public.platform_settings_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.platform_settings_set_updated_at();

COMMIT;
