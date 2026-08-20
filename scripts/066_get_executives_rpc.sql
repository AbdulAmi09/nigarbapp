-- The executives page's original query (.from("profiles").select("*")
-- .in("arbiter_level", [...]).eq("is_verified", true)) only ever
-- "worked" by accident: profiles SELECT RLS is locked to your own row
-- (or admin), so it silently only ever returned the *visiting* member's
-- own profile when it happened to match the filter, and nothing for
-- anyone else. Combined with the fabricated title-cycling this replaces,
-- that's how an ordinary verified member ended up shown to themselves
-- as "President."
--
-- Now that the executives list is sourced from real admin/superadmin
-- accounts instead, the same RLS problem applies to reading their
-- profiles. get_executives() is a narrowly-scoped SECURITY DEFINER RPC
-- (same pattern as get_zone_directory / get_events_with_organizer /
-- get_committees_with_leadership) that exposes only non-sensitive
-- directory fields for admin/superadmin accounts.

CREATE OR REPLACE FUNCTION public.get_executives()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  email text,
  phone text,
  city text,
  bio text,
  arbiter_level arbiter_level,
  role text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, first_name, last_name, avatar_url, email, phone, city, bio, arbiter_level, role
  FROM public.profiles
  WHERE role IN ('admin', 'superadmin');
$$;

GRANT EXECUTE ON FUNCTION public.get_executives() TO authenticated;
