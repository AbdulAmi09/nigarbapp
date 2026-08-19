-- profiles' RLS only allows a user to read their own row (profiles_select_own:
-- auth.uid() = id), and profiles_public has security_invoker=on so it's fully
-- subject to that same RLS -- meaning the /dashboard/zones page's arbiter counts
-- and zone-arbiter listings were silently scoped to just the current user's own
-- row for any non-admin member. This RPC returns the same directory-safe column
-- set as profiles_public but as SECURITY DEFINER, so it actually works as a
-- cross-user directory for the Zones page.

CREATE OR REPLACE FUNCTION public.get_zone_directory()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  zone zone_type,
  arbiter_level arbiter_level
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, first_name, last_name, avatar_url, zone, arbiter_level
  FROM public.profiles
  WHERE is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_zone_directory() TO authenticated;
