-- Consistency: newsletter_subscribers was already correctly RLS-protected
-- (is_main_admin()-gated SELECT), unlike complaints. Add the
-- platform_has_permission('website.manage') policy alongside it so the
-- command center's newsletter admin page uses the same permission model
-- as the rest of Phase 4, ahead of finance/general_secretary-style roles
-- potentially needing website access later.

BEGIN;

CREATE POLICY "platform admins select newsletter" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (platform_has_permission(auth.uid(), 'website.manage'));
CREATE POLICY "platform admins manage newsletter" ON public.newsletter_subscribers
  FOR UPDATE TO authenticated
  USING (platform_has_permission(auth.uid(), 'website.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'website.manage'));

COMMIT;
