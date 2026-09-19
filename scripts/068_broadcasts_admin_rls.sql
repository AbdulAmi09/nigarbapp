-- Phase 5: broadcasts has RLS enabled with only a public SELECT policy --
-- no INSERT/UPDATE/DELETE policy exists at all, meaning broadcasts have
-- had to be inserted directly in Supabase (no admin UI anywhere could have
-- worked against the anon key). Public read stays as-is (broadcasts are
-- meant to be publicly viewable); add management access for the command
-- center.

BEGIN;

CREATE POLICY "platform admins manage broadcasts" ON public.broadcasts
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'broadcast.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'broadcast.manage'));

COMMIT;
