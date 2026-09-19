-- Phase 2: nigarbapp's own known gaps, expanded with what building the
-- command center's search/settings surfaced.
--
-- Several RLS policies gate admin visibility on either the `admins` table
-- (2 rows, neither of which is either of the two real profiles.role
-- admin/superadmin accounts -- confirmed live) or `profiles.role = 'admin'`
-- literally (excluding the 'superadmin' string, the same bug just fixed in
-- nigarbadminapp-main's own layout gate). Net effect: the real admin
-- accounts have been silently unable to see other arbiters' payment_due
-- rows, all payments, or the "admin view all notifications" policy at all,
-- with no error surfaced -- RLS just filters rows out.
--
-- Fix: add explicit admin-bypass policies using platform_has_permission()
-- (062_platform_permissions_and_audit.sql), which correctly resolves both
-- real admin accounts via their backfilled super_admin role. Leaves every
-- existing policy in place (additive, permissive policies OR together).

BEGIN;

-- arbiters: SELECT/UPDATE/DELETE for anyone with arbiters.view/arbiters.manage.
CREATE POLICY "platform admins select arbiters" ON public.arbiters
  FOR SELECT TO authenticated
  USING (platform_has_permission(auth.uid(), 'arbiters.view') OR platform_has_permission(auth.uid(), 'arbiters.view.zone'));
CREATE POLICY "platform admins manage arbiters" ON public.arbiters
  FOR UPDATE TO authenticated
  USING (platform_has_permission(auth.uid(), 'arbiters.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'arbiters.manage'));
CREATE POLICY "platform admins delete arbiters" ON public.arbiters
  FOR DELETE TO authenticated
  USING (platform_has_permission(auth.uid(), 'arbiters.manage'));

-- payments: SELECT for payments.view (the admins-table policy stays, harmless).
CREATE POLICY "platform admins select payments" ON public.payments
  FOR SELECT TO authenticated
  USING (platform_has_permission(auth.uid(), 'payments.view'));

-- payment_due: SELECT for payments.view -- previously had NO admin-visible
-- SELECT path at all, only self-view + admin-insert.
CREATE POLICY "platform admins select payment_due" ON public.payment_due
  FOR SELECT TO authenticated
  USING (platform_has_permission(auth.uid(), 'payments.view'));

-- tournaments: UPDATE/DELETE were organizer-only -- an admin who didn't
-- personally create a tournament couldn't edit/delete it from the admin page.
CREATE POLICY "platform admins manage tournaments" ON public.tournaments
  FOR UPDATE TO authenticated
  USING (platform_has_permission(auth.uid(), 'tournaments.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'tournaments.manage'));
CREATE POLICY "platform admins delete tournaments" ON public.tournaments
  FOR DELETE TO authenticated
  USING (platform_has_permission(auth.uid(), 'tournaments.manage'));

-- disciplinary_cases: the existing "Policy with security definer functions"
-- (`auth.uid() = id`) compares the caller to the CASE's own id, not the
-- arbiter it's about -- almost certainly never matched anyone. Add correct
-- policies rather than touch the existing (harmless no-op) one.
CREATE POLICY "arbiters view own disciplinary cases" ON public.disciplinary_cases
  FOR SELECT TO authenticated
  USING (auth.uid() = arbiter_id);
CREATE POLICY "platform admins manage disciplinary cases" ON public.disciplinary_cases
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'incidents.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'incidents.manage'));

-- notifications: "Admins can view all notifications" checked
-- profiles.role = 'admin' literally, excluding 'superadmin'.
CREATE POLICY "platform admins select all notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (platform_has_permission(auth.uid(), 'notifications.send'));

COMMIT;
