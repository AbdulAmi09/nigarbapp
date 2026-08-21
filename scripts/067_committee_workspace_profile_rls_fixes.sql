-- Same bug class as scripts 063/064/065/066 (profiles SELECT RLS only
-- allows reading your own row), found while checking whether the
-- already-shipped committee workspace (app/dashboard/committee/[slug]/page.tsx,
-- components/committee-workspace.tsx) has the same problem the directory
-- page (script 065) did. It has it in four places, and one of them is not
-- latent -- it's a shipped feature that silently fails on first real use:
--
-- 1. The workspace page's roster query (profiles .in(rosterIds)) -- would
--    return only the viewer's own row once a committee actually has other
--    members. Latent today (no committee has members yet).
-- 2. The workspace page's + client "load older cases" case list, both
--    embedding submitter:submitted_by(...) against profiles -- same
--    problem for any case not submitted by the viewer. Latent today (one
--    case exists in prod, but the queue isn't reachable by anyone since
--    nobody is an officer/member of any committee yet).
-- 3. CaseCard's internal notes thread (committee_case_notes author:author_id(...))
--    -- same problem for any note not authored by the viewer. Latent today.
-- 4. AddMemberDialog's "search arbiters to add" box queries profiles
--    directly with ilike filters -- this is NOT latent. The moment any
--    officer exists and opens "Add Member", the search returns zero
--    results for every arbiter except themselves, because RLS blocks it
--    before the ilike filter ever runs. This is a shipped, silently-broken
--    feature today.
--
-- Fixes: three narrowly-scoped SECURITY DEFINER RPCs replicating the exact
-- same visibility rules as the RLS policies they stand in for
-- (is_committee_member / is_committee_officer, already defined in script
-- 059), plus reusing the existing get_zone_directory() RPC (script 060)
-- for the member-search box instead of a raw profiles query.

CREATE OR REPLACE FUNCTION public.get_committee_roster(p_committee_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  arbiter_level arbiter_level
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.first_name, p.last_name, p.avatar_url, p.arbiter_level
  FROM public.profiles p
  WHERE public.is_committee_member(p_committee_id, auth.uid())
    AND p.id IN (
      SELECT unnest(ARRAY[c.chairman_id, c.secretary_id] || COALESCE(c.member_ids, ARRAY[]::uuid[]))
      FROM public.committees c
      WHERE c.id = p_committee_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_committee_roster(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_committee_cases_with_submitter(
  p_committee_id uuid,
  p_before timestamptz DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  request_type text,
  message text,
  status text,
  attachment_path text,
  resolution_note text,
  created_at timestamptz,
  resolved_at timestamptz,
  submitted_by uuid,
  submitter_first_name text,
  submitter_last_name text,
  submitter_avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cc.id, cc.request_type, cc.message, cc.status, cc.attachment_path,
    cc.resolution_note, cc.created_at, cc.resolved_at, cc.submitted_by,
    p.first_name, p.last_name, p.avatar_url
  FROM public.committee_cases cc
  JOIN public.profiles p ON p.id = cc.submitted_by
  WHERE cc.committee_id = p_committee_id
    AND (cc.submitted_by = auth.uid() OR public.is_committee_member(p_committee_id, auth.uid()))
    AND (p_before IS NULL OR cc.created_at < p_before)
  ORDER BY cc.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_committee_cases_with_submitter(uuid, timestamptz, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_committee_case_notes(p_case_id uuid)
RETURNS TABLE (
  id uuid,
  note text,
  created_at timestamptz,
  author_id uuid,
  author_first_name text,
  author_last_name text,
  author_avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT n.id, n.note, n.created_at, n.author_id, p.first_name, p.last_name, p.avatar_url
  FROM public.committee_case_notes n
  JOIN public.committee_cases cc ON cc.id = n.case_id
  JOIN public.profiles p ON p.id = n.author_id
  WHERE n.case_id = p_case_id
    AND public.is_committee_member(cc.committee_id, auth.uid())
  ORDER BY n.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_committee_case_notes(uuid) TO authenticated;
