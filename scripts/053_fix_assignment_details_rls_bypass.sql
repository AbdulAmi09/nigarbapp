-- Security finding from auditing the dashboard home page: the
-- assignment_details view (owned by `postgres`, which has BYPASSRLS) runs
-- with the owner's privileges by default, not the querying user's -- so it
-- silently bypasses tournament_assignments' RLS (assignments_select_own:
-- arbiter_id = auth.uid() OR assigned_by = auth.uid()) for EVERY caller.
-- Confirmed live: a regular arbiter querying assignment_details with a
-- DIFFERENT arbiter_id filter (or none) got back other arbiters' full
-- tournament assignment rows including phone/email -- while the same
-- query against the base tournament_assignments table correctly returned
-- nothing. Every actual usage in the app (dashboard home, tournament-
-- assignment page, /api/assignments) already filters .eq("arbiter_id",
-- <own user id>) -- nothing relies on the bypass to show cross-arbiter
-- data -- so making the view honor the caller's RLS is a pure fix with no
-- feature loss.
--
-- Postgres 15+ view option: security_invoker makes the view run with the
-- querying role's permissions (including RLS) instead of the owner's.

ALTER VIEW public.assignment_details SET (security_invoker = true);
