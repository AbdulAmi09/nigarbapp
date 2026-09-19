-- CRITICAL fix, found while starting the Phase 4 admin migration.
--
-- public.complaints had `relrowsecurity = false` -- row-level security was
-- never actually turned on for this table, despite policies being defined
-- for it. Combined with full anon-role grants (the Supabase default), this
-- meant the complaints table -- reporter name/email/phone/FIDE ID,
-- tournament details, incident description, even on complaints marked
-- is_anonymous -- was fully public: readable, writable, and deletable by
-- anyone with the public anon key, no login required. Only 2 rows exist
-- today, but this needed closing immediately regardless.
--
-- Also: complaint_updates' only policy was `FOR SELECT USING (true)` --
-- genuinely public, unfiltered, including `internal_note` (moderator-only
-- notes) -- exposing every complaint's full status history and internal
-- notes to anyone, with no reference number or auth required at all.
--
-- And: complaint_people has RLS enabled with zero policies (safe default,
-- but it also means the public complaint-submission flow's insert of
-- "involved people" has likely been silently failing).

BEGIN;

-- 1. Turn RLS on for complaints (the missing piece).
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Extend admin access to the new platform_* system alongside the existing
-- (disconnected) admin_users table, so the command center can manage this.
CREATE POLICY "platform admins manage complaints" ON public.complaints
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'website.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'website.manage'));

-- 2. complaint_updates: remove the fully-public read policy. Admin access
-- only from here on -- the public "track my complaint" feature is served
-- through track_complaint_by_reference() below instead, which returns a
-- curated, safe field list (no internal_note, no PII when anonymous).
DROP POLICY IF EXISTS "Anyone can read complaint updates with reference" ON public.complaint_updates;

CREATE POLICY "platform admins manage complaint updates" ON public.complaint_updates
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'website.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'website.manage'));

-- 3. complaint_people: unblock the public submission flow's insert of
-- involved people, and give the command center manage access.
CREATE POLICY "anyone can submit involved people" ON public.complaint_people
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "platform admins manage complaint people" ON public.complaint_people
  FOR ALL TO authenticated
  USING (platform_has_permission(auth.uid(), 'website.manage'))
  WITH CHECK (platform_has_permission(auth.uid(), 'website.manage'));

-- 4. Safe public lookup: replaces raw table selects in ncaaweb-main's
-- app/api/integrity/track/route.ts. Redacts reporter PII when the
-- complaint was filed anonymously, and never returns internal_note.
CREATE OR REPLACE FUNCTION public.track_complaint_by_reference(p_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_complaint record;
  v_result jsonb;
BEGIN
  SELECT * INTO v_complaint FROM public.complaints WHERE reference_number = p_reference;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_result := jsonb_build_object(
    'reference_number', v_complaint.reference_number,
    'status', v_complaint.status,
    'category', v_complaint.category,
    'priority', v_complaint.priority,
    'description', v_complaint.description,
    'tournament_name', v_complaint.tournament_name,
    'tournament_location', v_complaint.tournament_location,
    'incident_date', v_complaint.incident_date,
    'created_at', v_complaint.created_at,
    'updated_at', v_complaint.updated_at,
    'reporter_name', CASE WHEN v_complaint.is_anonymous THEN NULL ELSE v_complaint.reporter_name END,
    'reporter_email', CASE WHEN v_complaint.is_anonymous THEN NULL ELSE v_complaint.reporter_email END,
    'updates', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'status', u.new_status,
        'public_note', u.public_note,
        'created_at', u.created_at
      ) ORDER BY u.created_at DESC), '[]'::jsonb)
      FROM public.complaint_updates u
      WHERE u.complaint_id = v_complaint.id
    )
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_complaint_by_reference(text) TO anon, authenticated;

COMMIT;
