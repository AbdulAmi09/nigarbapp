-- Committee workspace round 2: close the one-directional case loop
-- (submitters never learned their case was resolved, and had nowhere to
-- check on it), add an internal case-notes trail, let officers manage their
-- own committee's ordinary membership without needing the (not yet built)
-- admin dashboard, and let officers fix a stale description.

BEGIN;

-- 1. Notify the submitter (not just the officers) whenever their case's
--    status changes.
CREATE OR REPLACE FUNCTION public.notify_committee_case_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_committee_name text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT name INTO v_committee_name FROM public.committees WHERE id = NEW.committee_id;
    INSERT INTO public.notifications (recipient_id, title, message, notification_type, related_id, action_url, is_read)
    VALUES (
      NEW.submitted_by,
      'Committee Request Update',
      'Your "' || NEW.request_type || '" request to ' || COALESCE(v_committee_name, 'the committee') ||
      ' is now ' || replace(NEW.status, '_', ' ') || '.',
      'committee', NEW.id, '/dashboard/committee', false
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_committee_case_status_change ON public.committee_cases;
CREATE TRIGGER trg_notify_committee_case_status_change
  AFTER UPDATE ON public.committee_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_committee_case_status_change();

-- 2. Internal case notes -- a working trail while a case is open, visible
--    to the committee (not the submitter, who only sees status + the final
--    resolution_note).
CREATE TABLE IF NOT EXISTS public.committee_case_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL REFERENCES public.committee_cases(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  note text NOT NULL CHECK (char_length(note) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_committee_case_notes_case ON public.committee_case_notes(case_id);

ALTER TABLE public.committee_case_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS committee_case_notes_select ON public.committee_case_notes;
CREATE POLICY committee_case_notes_select ON public.committee_case_notes
  FOR SELECT
  USING (public.is_committee_member(committee_id, auth.uid()));

DROP POLICY IF EXISTS committee_case_notes_insert ON public.committee_case_notes;
CREATE POLICY committee_case_notes_insert ON public.committee_case_notes
  FOR INSERT
  WITH CHECK (public.is_committee_officer(committee_id, auth.uid()) AND author_id = auth.uid());

-- 3. Officers manage their own committee's ordinary membership. Chairman/
--    secretary reassignment stays out of reach here (admin-only, once that
--    exists) -- these only ever touch member_ids.
CREATE OR REPLACE FUNCTION public.add_committee_member(p_committee_id uuid, p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_committee_officer(p_committee_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the chairman or secretary can manage membership';
  END IF;

  UPDATE public.committees
  SET member_ids = CASE
        WHEN p_member_id = ANY(COALESCE(member_ids, ARRAY[]::uuid[])) THEN member_ids
        ELSE array_append(COALESCE(member_ids, ARRAY[]::uuid[]), p_member_id)
      END,
      updated_at = now()
  WHERE id = p_committee_id AND p_member_id != chairman_id AND (secretary_id IS NULL OR p_member_id != secretary_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_committee_member(p_committee_id uuid, p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_committee_officer(p_committee_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the chairman or secretary can manage membership';
  END IF;

  UPDATE public.committees
  SET member_ids = array_remove(member_ids, p_member_id), updated_at = now()
  WHERE id = p_committee_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.add_committee_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_committee_member(uuid, uuid) TO authenticated;

-- 4. Officers can fix a stale description.
CREATE OR REPLACE FUNCTION public.update_committee_description(p_committee_id uuid, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_committee_officer(p_committee_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the chairman or secretary can edit the description';
  END IF;

  UPDATE public.committees SET description = p_description, updated_at = now() WHERE id = p_committee_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_committee_description(uuid, text) TO authenticated;

COMMIT;
