-- Phase 3 prep: elections/positions RLS restrict UPDATE to the election's
-- own creator or a strictly 'superadmin'-role profile -- an 'admin'-role
-- account who didn't personally create a given election can't edit/close
-- it. Add permission-based bypass policies so the command center's voting
-- section works consistently regardless of who created what, matching the
-- same platform_has_permission() pattern used for every other table.

BEGIN;

CREATE POLICY "platform admins select elections" ON public.elections
  FOR SELECT TO authenticated USING (platform_has_permission(auth.uid(), 'voting.view'));
CREATE POLICY "platform admins manage elections" ON public.elections
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'voting.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'voting.manage'));

CREATE POLICY "platform admins select positions" ON public.positions
  FOR SELECT TO authenticated USING (platform_has_permission(auth.uid(), 'voting.view'));
CREATE POLICY "platform admins manage positions" ON public.positions
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'voting.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'voting.manage'));

CREATE POLICY "platform admins select candidates" ON public.candidates
  FOR SELECT TO authenticated USING (platform_has_permission(auth.uid(), 'voting.view'));
CREATE POLICY "platform admins manage candidates" ON public.candidates
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'voting.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'voting.manage'));

CREATE POLICY "platform admins select votes" ON public.votes
  FOR SELECT TO authenticated USING (platform_has_permission(auth.uid(), 'voting.view'));

CREATE POLICY "platform admins select audit log" ON public.vote_audit_log
  FOR SELECT TO authenticated USING (platform_has_permission(auth.uid(), 'voting.view'));

COMMIT;
