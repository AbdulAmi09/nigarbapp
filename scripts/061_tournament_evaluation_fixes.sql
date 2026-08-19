-- The tournament-evaluation page (and the "Completed" tab on
-- tournament-assignment) reads tournament_assignments WHERE
-- assignment_status = 'Completed'. Nothing in this codebase ever wrote that
-- value: /api/assignments/update-status only allows the arbiter to set
-- 'Accepted'/'Declined', and no trigger or job ever advanced it further --
-- so both pages have been permanently empty for every user. This adds the
-- missing transition: when a tournament's own `status` (the plain text
-- column the app actually reads and displays -- NOT the unused legacy
-- `tournament_status` enum column from script 002/004, which nothing in
-- the app queries) becomes 'completed', cascade any of its still-'Accepted'
-- assignments to 'Completed'.

CREATE OR REPLACE FUNCTION public.complete_assignments_on_tournament_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.tournament_assignments
    SET assignment_status = 'Completed'
    WHERE tournament_id = NEW.id
      AND assignment_status = 'Accepted';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_complete_assignments_on_tournament_completion ON public.tournaments;
CREATE TRIGGER trg_complete_assignments_on_tournament_completion
  AFTER INSERT OR UPDATE OF status ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.complete_assignments_on_tournament_completion();

-- Backfill: the one real tournament in production is already status =
-- 'completed' with its assignment stuck at 'Accepted' from before this
-- trigger existed.
UPDATE public.tournament_assignments ta
SET assignment_status = 'Completed'
FROM public.tournaments t
WHERE ta.tournament_id = t.id
  AND t.status = 'completed'
  AND ta.assignment_status = 'Accepted';
