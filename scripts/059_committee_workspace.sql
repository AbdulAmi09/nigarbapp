-- Committee workspace build-out. The Committee page previously showed
-- entirely fake seed data (hand-typed member name strings with no linked
-- accounts, member_ids empty on every row, chairman_id/secretary_id null
-- everywhere) and had zero working actions. This gives it a real data model:
-- real membership (member_ids/chairman_id/secretary_id, already existed but
-- unused), a slug for routing, per-committee request types for the intake
-- form, a documents table, and a cases (intake submission) table -- plus a
-- private members-only workspace per committee.

BEGIN;

-- 1. Slug for /dashboard/committee/[slug] routing, and per-committee intake
--    request types for the "Contact Committee" form.
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS request_types text[] NOT NULL DEFAULT ARRAY[
  'General Inquiry', 'Request Support', 'Report an Issue'
];

CREATE OR REPLACE FUNCTION public.slugify_committee_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
$function$;

CREATE OR REPLACE FUNCTION public.set_committee_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.slugify_committee_name(NEW.name);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_committee_slug ON public.committees;
CREATE TRIGGER trg_set_committee_slug
  BEFORE INSERT OR UPDATE OF name ON public.committees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_committee_slug();

UPDATE public.committees SET slug = public.slugify_committee_name(name) WHERE slug IS NULL;
ALTER TABLE public.committees ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_committees_slug ON public.committees(slug);

UPDATE public.committees SET request_types = ARRAY['Rules Clarification', 'Tournament Technical Issue', 'Equipment/Software Support', 'General Inquiry'] WHERE name = 'Technical Committee';
UPDATE public.committees SET request_types = ARRAY['Grassroots Program Proposal', 'Partnership Inquiry', 'Funding Request', 'General Inquiry'] WHERE name = 'Development Committee';
UPDATE public.committees SET request_types = ARRAY['Program Inquiry', 'Mentorship Request', 'Event Proposal', 'General Inquiry'] WHERE name = 'Women in Chess Committee';
UPDATE public.committees SET request_types = ARRAY['Training Extension', 'Course Enrollment Issue', 'Certification Inquiry', 'General Inquiry'] WHERE name = 'Training Committee';
UPDATE public.committees SET request_types = ARRAY['Payment Dispute', 'Reimbursement Request', 'Financial Inquiry', 'General Inquiry'] WHERE name = 'Finance Committee';
UPDATE public.committees SET request_types = ARRAY['File a Grievance', 'Report a Violation', 'Appeal a Decision', 'General Inquiry'] WHERE name = 'Ethics Committee';

-- The fake hand-typed member name strings were never linked to real
-- accounts and were actively misleading (implying a populated roster that
-- doesn't exist). Real membership lives in member_ids/chairman_id/
-- secretary_id going forward.
UPDATE public.committees SET members = NULL;

-- 2. Reusable membership check, used by RLS below and safe to call from the
--    app too.
CREATE OR REPLACE FUNCTION public.is_committee_member(p_committee_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.committees c
    WHERE c.id = p_committee_id
      AND (c.chairman_id = p_uid OR c.secretary_id = p_uid OR p_uid = ANY(c.member_ids))
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_committee_officer(p_committee_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.committees c
    WHERE c.id = p_committee_id AND (c.chairman_id = p_uid OR c.secretary_id = p_uid)
  );
$function$;

-- 3. committees_update_members had no WITH CHECK -- dormant today only
--    because member_ids/chairman_id/secretary_id are all empty, but it
--    would have let any listed member rewrite the entire committee row
--    (reassign chairman, deactivate it, edit the description) the moment
--    real membership exists. Replaced with a narrow RPC.
DROP POLICY IF EXISTS committees_update_members ON public.committees;

CREATE OR REPLACE FUNCTION public.update_committee_meeting_info(
  p_committee_id uuid,
  p_next_meeting_date timestamptz,
  p_meeting_location text,
  p_meeting_schedule text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_committee_officer(p_committee_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the chairman or secretary can update meeting details';
  END IF;

  UPDATE public.committees
  SET next_meeting_date = p_next_meeting_date,
      meeting_location = p_meeting_location,
      meeting_schedule = p_meeting_schedule,
      updated_at = now()
  WHERE id = p_committee_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_committee_meeting_info(uuid, timestamptz, text, text) TO authenticated;

-- 4. Meeting documents / guidelines. is_public = true means it's shown in
--    the read-only public modal for non-members too; false means it's only
--    visible inside the members-only workspace.
CREATE TABLE IF NOT EXISTS public.committee_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('minutes', 'agenda', 'guideline', 'other')),
  file_path text NOT NULL,
  file_type text,
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_committee_documents_committee ON public.committee_documents(committee_id);

ALTER TABLE public.committee_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS committee_documents_select ON public.committee_documents;
CREATE POLICY committee_documents_select ON public.committee_documents
  FOR SELECT
  USING (is_public = true OR public.is_committee_member(committee_id, auth.uid()));

DROP POLICY IF EXISTS committee_documents_insert ON public.committee_documents;
CREATE POLICY committee_documents_insert ON public.committee_documents
  FOR INSERT
  WITH CHECK (public.is_committee_officer(committee_id, auth.uid()) AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS committee_documents_delete ON public.committee_documents;
CREATE POLICY committee_documents_delete ON public.committee_documents
  FOR DELETE
  USING (public.is_committee_officer(committee_id, auth.uid()));

-- 5. Intake submissions ("cases"). Any authenticated member can file one
--    against any active committee; only that committee's members can see
--    the queue, and only officers can resolve it.
CREATE TABLE IF NOT EXISTS public.committee_cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id),
  request_type text NOT NULL,
  message text NOT NULL CHECK (char_length(message) <= 1000),
  attachment_path text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  resolution_note text,
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_committee_cases_committee ON public.committee_cases(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_cases_submitter ON public.committee_cases(submitted_by);

ALTER TABLE public.committee_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS committee_cases_select ON public.committee_cases;
CREATE POLICY committee_cases_select ON public.committee_cases
  FOR SELECT
  USING (submitted_by = auth.uid() OR public.is_committee_member(committee_id, auth.uid()));

DROP POLICY IF EXISTS committee_cases_insert ON public.committee_cases;
CREATE POLICY committee_cases_insert ON public.committee_cases
  FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS committee_cases_update_officer ON public.committee_cases;
CREATE POLICY committee_cases_update_officer ON public.committee_cases
  FOR UPDATE
  USING (public.is_committee_officer(committee_id, auth.uid()))
  WITH CHECK (public.is_committee_officer(committee_id, auth.uid()));

DROP TRIGGER IF EXISTS update_committee_cases_updated_at ON public.committee_cases;
CREATE TRIGGER update_committee_cases_updated_at
  BEFORE UPDATE ON public.committee_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. New case -> notify the committee's officers so it shows up as a task,
--    same dispatch pipeline (email/push) every other notification uses.
CREATE OR REPLACE FUNCTION public.notify_committee_case_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_committee record;
  v_recipient uuid;
BEGIN
  SELECT name, chairman_id, secretary_id INTO v_committee FROM public.committees WHERE id = NEW.committee_id;

  FOREACH v_recipient IN ARRAY ARRAY[v_committee.chairman_id, v_committee.secretary_id]
  LOOP
    IF v_recipient IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_id, title, message, notification_type, related_id, action_url, is_read)
      VALUES (
        v_recipient, 'New Committee Case: ' || NEW.request_type,
        'A new "' || NEW.request_type || '" request was submitted to ' || COALESCE(v_committee.name, 'your committee') || '.',
        'committee', NEW.id, '/dashboard/committee/' || (SELECT slug FROM public.committees WHERE id = NEW.committee_id), false
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_committee_case_created ON public.committee_cases;
CREATE TRIGGER trg_notify_committee_case_created
  AFTER INSERT ON public.committee_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_committee_case_created();

-- 7. Storage: a single private bucket, path convention
--    docs/{committee_id}/{filename} for documents and
--    cases/{committee_id}/{case_id}/{filename} for intake attachments.
INSERT INTO storage.buckets (id, name, public)
VALUES ('committee-files', 'committee-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS committee_files_select ON storage.objects;
CREATE POLICY committee_files_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'committee-files' AND (
      (
        (storage.foldername(name))[1] = 'docs' AND (
          EXISTS (SELECT 1 FROM public.committee_documents d WHERE d.file_path = name AND d.is_public = true)
          OR public.is_committee_member((storage.foldername(name))[2]::uuid, auth.uid())
        )
      )
      OR
      (
        (storage.foldername(name))[1] = 'cases' AND (
          EXISTS (SELECT 1 FROM public.committee_cases cc WHERE cc.attachment_path = name AND cc.submitted_by = auth.uid())
          OR public.is_committee_member((storage.foldername(name))[2]::uuid, auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS committee_files_insert ON storage.objects;
CREATE POLICY committee_files_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'committee-files' AND auth.role() = 'authenticated' AND (
      ((storage.foldername(name))[1] = 'docs' AND public.is_committee_officer((storage.foldername(name))[2]::uuid, auth.uid()))
      OR ((storage.foldername(name))[1] = 'cases')
    )
  );

DROP POLICY IF EXISTS committee_files_delete ON storage.objects;
CREATE POLICY committee_files_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'committee-files'
    AND (storage.foldername(name))[1] = 'docs'
    AND public.is_committee_officer((storage.foldername(name))[2]::uuid, auth.uid())
  );

COMMIT;
