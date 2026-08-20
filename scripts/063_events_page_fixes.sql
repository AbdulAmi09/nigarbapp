-- The events page audit found two real problems below the UI layer:
--
-- 1. events_select_public's RLS policy was "is_public = true OR
--    auth.role() = 'authenticated'" -- the second clause is true for every
--    logged-in member, so is_public never actually restricted anything.
--    Verified live: a plain member could read an is_public=false internal
--    committee meeting. Tightens visibility to: public, your own event, or
--    an admin.
--
-- 2. events_insert_authenticated let any authenticated user insert a row
--    directly (bypassing the UI entirely), which would immediately be
--    live and public (is_public defaults true). The "Submit Event" button
--    is being removed from the UI because there's no moderation flow yet
--    -- this closes the same gap at the data layer so the feature can't be
--    reached by going around the UI either.
--
-- Also adds get_events_with_organizer(), a narrowly-scoped SECURITY
-- DEFINER RPC (same pattern as get_zone_directory() from script 060) that
-- joins the real organizer name from profiles -- the events page was
-- hardcoding every event's organizer to "NCAA" because profiles RLS
-- blocks a plain cross-user profile read. It replicates the same
-- visibility rule as the fixed SELECT policy so it can't be used to see
-- more than the policy already allows.

DROP POLICY IF EXISTS events_select_public ON public.events;
CREATE POLICY events_select_public ON public.events
  FOR SELECT
  USING (is_public = true OR auth.uid() = organizer_id OR public.is_main_admin(auth.uid()));

DROP POLICY IF EXISTS events_insert_authenticated ON public.events;
CREATE POLICY events_insert_authenticated ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id OR public.is_main_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_events_with_organizer()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  event_type event_type,
  start_date timestamptz,
  end_date timestamptz,
  venue text,
  city text,
  state text,
  organizer_id uuid,
  organizer_name text,
  max_attendees int,
  current_attendees int,
  registration_fee numeric,
  registration_deadline timestamptz,
  materials_url text,
  is_public boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    e.id, e.title, e.description, e.event_type, e.start_date, e.end_date,
    e.venue, e.city, e.state, e.organizer_id,
    NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), '') AS organizer_name,
    e.max_attendees, e.current_attendees, e.registration_fee, e.registration_deadline,
    e.materials_url, e.is_public
  FROM public.events e
  LEFT JOIN public.profiles p ON p.id = e.organizer_id
  WHERE e.is_public = true OR e.organizer_id = auth.uid() OR public.is_main_admin(auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.get_events_with_organizer() TO authenticated;
