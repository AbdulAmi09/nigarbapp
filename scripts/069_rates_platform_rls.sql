-- Consistency: allowance_rates already correctly RLS-protected
-- (is_main_admin()-gated manage). Add platform_has_permission('rates.manage')
-- alongside it for consistency with the rest of the command center.

BEGIN;

CREATE POLICY "platform admins manage rates" ON public.allowance_rates
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'rates.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'rates.manage'));

COMMIT;
