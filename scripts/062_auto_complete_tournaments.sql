-- Nothing in this repo ever sets tournaments.status = 'completed' -- there's
-- no tournament-management UI here, so the evaluation flow (script 061) only
-- worked if something external (the separate, not-yet-built admin dashboard,
-- or a manual DB edit) flipped it by hand. This closes the loop without that
-- dependency: a daily job marks a tournament 'completed' once its end_date
-- has passed, which in turn fires the existing
-- trg_complete_assignments_on_tournament_completion trigger and cascades
-- 'Accepted' assignments to 'Completed' automatically.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.auto_complete_past_tournaments()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tournaments
  SET status = 'completed'
  WHERE end_date < CURRENT_DATE
    AND status IS DISTINCT FROM 'completed'
    AND status IS DISTINCT FROM 'cancelled';
$$;

SELECT cron.schedule(
  'auto-complete-past-tournaments',
  '0 1 * * *',
  $$SELECT public.auto_complete_past_tournaments();$$
);
