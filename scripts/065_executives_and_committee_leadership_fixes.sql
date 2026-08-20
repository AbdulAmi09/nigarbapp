-- The executives page audit surfaced two real problems:
--
-- 1. committees_insert_authenticated had the same over-permissive shape
--    already fixed on events/resources (scripts 063/064) -- any
--    authenticated member could insert a new committee directly.
--    Committees aren't user-owned the way events/resources are, so this
--    is admin-only, full stop.
--
-- 2. While investigating how to show real chairman/secretary names for
--    the executives page's Committees tab, found that the *already
--    shipped* committee workspace (app/dashboard/committee/page.tsx)
--    joins chairman:chairman_id(first_name,last_name,avatar_url) directly
--    against profiles -- but profiles RLS only allows reading your own
--    row (profiles_select_own: auth.uid() = id). Verified live: a member
--    querying another profile's first_name/last_name gets zero rows.
--    This join returns null today only because chairman_id/secretary_id
--    happen to be unset on every committee in production right now --
--    the moment one gets assigned, its name would silently fail to show
--    for every other member. Same shape as the profiles_public /
--    get_zone_directory bug found earlier this session.
--
-- get_committees_with_leadership() is a narrowly-scoped SECURITY DEFINER
-- RPC (same pattern as get_zone_directory / get_events_with_organizer)
-- that resolves chairman/secretary names and a real member_count server
-- side, visible under the same is_active=true rule committees_select_all
-- already enforces.

DROP POLICY IF EXISTS committees_insert_authenticated ON public.committees;
CREATE POLICY committees_insert_authenticated ON public.committees
  FOR INSERT
  WITH CHECK (public.is_main_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_committees_with_leadership()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  purpose text,
  meeting_schedule text,
  next_meeting_date timestamptz,
  meeting_location text,
  member_ids uuid[],
  chairman_id uuid,
  secretary_id uuid,
  request_types text[],
  chairman_name text,
  chairman_avatar_url text,
  secretary_name text,
  secretary_avatar_url text,
  member_count int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.id, c.name, c.slug, c.description, c.purpose,
    c.meeting_schedule, c.next_meeting_date, c.meeting_location,
    c.member_ids, c.chairman_id, c.secretary_id, c.request_types,
    NULLIF(TRIM(COALESCE(chairman.first_name, '') || ' ' || COALESCE(chairman.last_name, '')), '') AS chairman_name,
    chairman.avatar_url AS chairman_avatar_url,
    NULLIF(TRIM(COALESCE(secretary.first_name, '') || ' ' || COALESCE(secretary.last_name, '')), '') AS secretary_name,
    secretary.avatar_url AS secretary_avatar_url,
    (
      COALESCE(array_length(c.member_ids, 1), 0)
      + (CASE WHEN c.chairman_id IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN c.secretary_id IS NOT NULL THEN 1 ELSE 0 END)
    )::int AS member_count
  FROM public.committees c
  LEFT JOIN public.profiles chairman ON chairman.id = c.chairman_id
  LEFT JOIN public.profiles secretary ON secretary.id = c.secretary_id
  WHERE c.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_committees_with_leadership() TO authenticated;
