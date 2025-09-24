-- Materialized view for tournament statistics
CREATE MATERIALIZED VIEW public.tournament_statistics AS
SELECT 
  DATE_TRUNC('month', start_date) as month,
  COUNT(*) as total_tournaments,
  COUNT(*) FILTER (WHERE tournament_status = 'Completed') as completed_tournaments,
  COUNT(*) FILTER (WHERE tournament_status = 'Ongoing') as ongoing_tournaments,
  COUNT(*) FILTER (WHERE tournament_status = 'Cancelled') as cancelled_tournaments,
  AVG(current_participants) as avg_participants,
  SUM(prize_fund) as total_prize_fund
FROM public.tournaments
WHERE start_date >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY DATE_TRUNC('month', start_date)
ORDER BY month DESC;

-- Create index on materialized view
CREATE INDEX idx_tournament_stats_month ON public.tournament_statistics(month);

-- Materialized view for arbiter performance metrics
CREATE MATERIALIZED VIEW public.arbiter_performance_metrics AS
SELECT 
  p.id,
  p.first_name || ' ' || p.last_name as full_name,
  p.arbiter_level,
  p.zone,
  COUNT(ta.id) as total_assignments,
  COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Completed') as completed_assignments,
  COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Declined') as declined_assignments,
  ROUND(
    COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Completed')::DECIMAL / 
    NULLIF(COUNT(ta.id), 0) * 100, 2
  ) as completion_rate,
  AVG(te.overall_rating) as average_rating,
  COUNT(te.id) as total_evaluations,
  SUM(pay.amount) FILTER (WHERE pay.payment_status = 'Paid') as total_earnings
FROM public.profiles p
LEFT JOIN public.tournament_assignments ta ON p.id = ta.arbiter_id
LEFT JOIN public.tournament_evaluations te ON ta.tournament_id = te.tournament_id AND p.id = te.evaluator_id
LEFT JOIN public.payments pay ON p.id = pay.arbiter_id
WHERE p.is_active = true
GROUP BY p.id, p.first_name, p.last_name, p.arbiter_level, p.zone;

-- Create index on materialized view
CREATE INDEX idx_arbiter_performance_id ON public.arbiter_performance_metrics(id);
CREATE INDEX idx_arbiter_performance_level ON public.arbiter_performance_metrics(arbiter_level);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.tournament_statistics;
  REFRESH MATERIALIZED VIEW public.arbiter_performance_metrics;
END;
$$;
