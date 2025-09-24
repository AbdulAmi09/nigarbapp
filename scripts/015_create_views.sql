-- View for arbiter dashboard statistics
CREATE OR REPLACE VIEW public.arbiter_dashboard_stats AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.arbiter_level,
  p.tournaments_officiated,
  p.rating,
  COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Pending') as pending_assignments,
  COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Accepted') as accepted_assignments,
  COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Completed') as completed_assignments,
  COUNT(pay.id) FILTER (WHERE pay.payment_status = 'Pending') as pending_payments,
  SUM(pay.amount) FILTER (WHERE pay.payment_status = 'Paid') as total_earnings,
  public.get_unread_notification_count(p.id) as unread_notifications
FROM public.profiles p
LEFT JOIN public.tournament_assignments ta ON p.id = ta.arbiter_id
LEFT JOIN public.payments pay ON p.id = pay.arbiter_id
GROUP BY p.id, p.first_name, p.last_name, p.arbiter_level, p.tournaments_officiated, p.rating;

-- View for upcoming tournaments
CREATE OR REPLACE VIEW public.upcoming_tournaments AS
SELECT 
  t.*,
  p.first_name || ' ' || p.last_name as organizer_name,
  ca.first_name || ' ' || ca.last_name as chief_arbiter_name
FROM public.tournaments t
LEFT JOIN public.profiles p ON t.organizer_id = p.id
LEFT JOIN public.profiles ca ON t.chief_arbiter_id = ca.id
WHERE t.start_date >= CURRENT_DATE
ORDER BY t.start_date ASC;

-- View for tournament assignments with details
CREATE OR REPLACE VIEW public.assignment_details AS
SELECT 
  ta.*,
  t.name as tournament_name,
  t.start_date,
  t.end_date,
  t.venue,
  t.city,
  t.state,
  p.first_name || ' ' || p.last_name as arbiter_name,
  p.phone as arbiter_phone,
  p.email as arbiter_email,
  assigner.first_name || ' ' || assigner.last_name as assigned_by_name
FROM public.tournament_assignments ta
JOIN public.tournaments t ON ta.tournament_id = t.id
JOIN public.profiles p ON ta.arbiter_id = p.id
LEFT JOIN public.profiles assigner ON ta.assigned_by = assigner.id;

-- View for payment summary
CREATE OR REPLACE VIEW public.payment_summary AS
SELECT 
  pay.*,
  p.first_name || ' ' || p.last_name as arbiter_name,
  t.name as tournament_name,
  creator.first_name || ' ' || creator.last_name as created_by_name
FROM public.payments pay
JOIN public.profiles p ON pay.arbiter_id = p.id
LEFT JOIN public.tournaments t ON pay.tournament_id = t.id
LEFT JOIN public.profiles creator ON pay.created_by = creator.id;

-- View for committee details
CREATE OR REPLACE VIEW public.committee_details AS
SELECT 
  c.*,
  chairman.first_name || ' ' || chairman.last_name as chairman_name,
  secretary.first_name || ' ' || secretary.last_name as secretary_name,
  array_length(c.members, 1) as member_count
FROM public.committees c
LEFT JOIN public.profiles chairman ON c.chairman_id = chairman.id
LEFT JOIN public.profiles secretary ON c.secretary_id = secretary.id;
