-- Create analytics functions for dashboard insights

-- Function to get monthly tournament trends
CREATE OR REPLACE FUNCTION public.get_monthly_tournament_trends(months_back INTEGER DEFAULT 12)
RETURNS TABLE(
  month TEXT,
  total_tournaments BIGINT,
  completed_tournaments BIGINT,
  total_participants BIGINT,
  total_prize_fund DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', t.start_date), 'Mon YYYY') as month,
    COUNT(*) as total_tournaments,
    COUNT(*) FILTER (WHERE t.tournament_status = 'Completed') as completed_tournaments,
    SUM(t.current_participants) as total_participants,
    SUM(t.prize_fund) as total_prize_fund
  FROM public.tournaments t
  WHERE t.start_date >= CURRENT_DATE - INTERVAL '1 month' * months_back
  GROUP BY DATE_TRUNC('month', t.start_date)
  ORDER BY DATE_TRUNC('month', t.start_date) DESC;
END;
$$;

-- Function to get arbiter activity summary
CREATE OR REPLACE FUNCTION public.get_arbiter_activity_summary(arbiter_uuid UUID)
RETURNS TABLE(
  total_assignments BIGINT,
  completed_assignments BIGINT,
  pending_assignments BIGINT,
  total_earnings DECIMAL,
  pending_payments DECIMAL,
  average_rating DECIMAL,
  tournaments_this_month BIGINT,
  next_assignment_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(ta.id) as total_assignments,
    COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Completed') as completed_assignments,
    COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Pending') as pending_assignments,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'Paid'), 0) as total_earnings,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'Pending'), 0) as pending_payments,
    public.calculate_arbiter_rating(arbiter_uuid) as average_rating,
    COUNT(ta.id) FILTER (WHERE t.start_date >= DATE_TRUNC('month', CURRENT_DATE)) as tournaments_this_month,
    MIN(t.start_date) FILTER (WHERE t.start_date > CURRENT_DATE AND ta.assignment_status = 'Accepted') as next_assignment_date
  FROM public.tournament_assignments ta
  LEFT JOIN public.tournaments t ON ta.tournament_id = t.id
  LEFT JOIN public.payments p ON ta.arbiter_id = p.arbiter_id
  WHERE ta.arbiter_id = arbiter_uuid;
END;
$$;

-- Function to get zone statistics
CREATE OR REPLACE FUNCTION public.get_zone_statistics()
RETURNS TABLE(
  zone zone_type,
  total_arbiters BIGINT,
  active_arbiters BIGINT,
  total_tournaments BIGINT,
  avg_rating DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.zone,
    COUNT(*) as total_arbiters,
    COUNT(*) FILTER (WHERE p.is_active = true) as active_arbiters,
    COUNT(ta.id) as total_tournaments,
    AVG(p.rating) as avg_rating
  FROM public.profiles p
  LEFT JOIN public.tournament_assignments ta ON p.id = ta.arbiter_id
  WHERE p.zone IS NOT NULL
  GROUP BY p.zone
  ORDER BY p.zone;
END;
$$;
