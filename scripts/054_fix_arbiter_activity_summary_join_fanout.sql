-- get_arbiter_activity_summary() joined payments directly into the same
-- row set as tournament_assignments via `LEFT JOIN payments p ON
-- ta.arbiter_id = p.arbiter_id` -- joining on arbiter_id only (not a
-- per-assignment key) fans out one row per (assignment x payment) pair.
-- COUNT(ta.id) then counts every duplicated row, not distinct
-- assignments: confirmed live, a real arbiter with 1 tournament_assignment
-- and 12 payment rows got total_assignments = 12 back from this function
-- (1 x 12), and the same fan-out would silently multiply total_earnings
-- for anyone with more than one actual assignment. Moved the payments
-- aggregation to scalar subqueries so it can no longer multiply the
-- assignment-count rows.

CREATE OR REPLACE FUNCTION public.get_arbiter_activity_summary(arbiter_uuid uuid)
 RETURNS TABLE(total_assignments bigint, completed_assignments bigint, pending_assignments bigint, total_earnings numeric, pending_payments numeric, average_rating numeric, tournaments_this_month bigint, next_assignment_date date)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(ta.id) as total_assignments,
    COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Completed') as completed_assignments,
    COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Pending') as pending_assignments,
    COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.arbiter_id = arbiter_uuid AND p.payment_status = 'paid'), 0) as total_earnings,
    COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.arbiter_id = arbiter_uuid AND p.payment_status = 'pending'), 0) as pending_payments,
    public.calculate_arbiter_rating(arbiter_uuid) as average_rating,
    COUNT(ta.id) FILTER (WHERE t.start_date >= DATE_TRUNC('month', CURRENT_DATE)) as tournaments_this_month,
    MIN(t.start_date) FILTER (WHERE t.start_date > CURRENT_DATE AND ta.assignment_status = 'Accepted') as next_assignment_date
  FROM public.tournament_assignments ta
  LEFT JOIN public.tournaments t ON ta.tournament_id = t.id
  WHERE ta.arbiter_id = arbiter_uuid;
END;
$function$;
