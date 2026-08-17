-- Root cause of the live 406 on `profiles?select=last_seen_at&id=eq...`:
-- profiles RLS only ever allowed reading your OWN row or, if you're an
-- admin, ANY row (profiles_select_own / profiles_select_admin). Every
-- regular (non-admin) member has therefore been unable to see anyone
-- else's name, avatar, or last-seen in chat this whole time -- it only
-- looked like it worked because this session's testing account is a
-- superadmin, which bypasses the restriction via profiles_select_admin.
-- Same root cause silently broke search_users_for_dm (start-a-DM /
-- add-group-member by FIDE ID) for non-admins: it queries public.profiles
-- without SECURITY DEFINER, so it also only ever saw the caller's own row.
--
-- Fix: rather than widening profiles' table-level RLS (which would let
-- any chat partner pull the full row -- email, phone, DOB, address,
-- license_number -- via a raw REST call, not just the few fields the UI
-- actually shows), add a narrow SECURITY DEFINER RPC that returns only
-- the safe display fields, and only for the caller themself or someone
-- they share a chat room with. The chat page is updated to call this
-- RPC instead of embedding profiles:sender_id(...)/profiles:user_id(...)
-- or selecting profiles directly.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_profiles_for_chat(p_ids uuid[])
 RETURNS TABLE (
   id uuid,
   first_name text,
   last_name text,
   avatar_url text,
   arbiter_level text,
   role text,
   last_seen_at timestamptz
 )
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.first_name, p.last_name, p.avatar_url, p.arbiter_level::text, p.role, p.last_seen_at
  FROM public.profiles p
  WHERE p.id = ANY (p_ids)
  AND (
    p.id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm_self
      JOIN public.group_members gm_target ON gm_target.group_id = gm_self.group_id
      WHERE gm_self.user_id = auth.uid() AND gm_target.user_id = p.id
    )
  );
$function$;

-- Also stop returning real email addresses through the arbiter-directory
-- search -- the chat UI never displays it, so there's no reason to leak
-- every searched-up arbiter's email to whoever is starting a DM with them.
CREATE OR REPLACE FUNCTION public.search_users_for_dm(p_search_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, email text, avatar_url text, arbiter_category text, fide_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, (p.first_name || ' ' || p.last_name) AS name, NULL::text AS email, p.avatar_url, p.arbiter_level::text AS arbiter_category, p.fide_id
  FROM public.profiles p
  WHERE p.fide_id ILIKE p_search_query || '%'
  AND p.fide_id IS NOT NULL
  AND p.id != auth.uid()
  LIMIT p_limit;
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';
