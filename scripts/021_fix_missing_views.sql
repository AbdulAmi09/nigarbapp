-- Create view for executives (profiles with specific roles)
CREATE OR REPLACE VIEW public.executives_view AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.phone,
  p.address,
  p.city,
  p.state,
  p.avatar_url,
  p.bio,
  p.arbiter_level,
  CASE 
    WHEN p.arbiter_level = 'International Arbiter' THEN 'President'
    WHEN p.arbiter_level = 'FIDE Master' THEN 'General Secretary'
    WHEN p.arbiter_level = 'National Arbiter' THEN 'Treasurer'
    ELSE 'Committee Member'
  END as position,
  ARRAY['Achievement 1', 'Achievement 2'] as achievements,
  CURRENT_DATE - (INTERVAL '2 years') as tenure_start,
  CURRENT_DATE as tenure_end,
  p.created_at
FROM public.profiles p
WHERE p.is_verified = true AND p.arbiter_level IN ('International Arbiter', 'FIDE Master', 'National Arbiter', 'International Master')
ORDER BY p.created_at DESC;

-- Create view for developers (all verified profiles)
CREATE OR REPLACE VIEW public.developers_view AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.phone,
  p.avatar_url,
  p.bio,
  p.arbiter_level as role,
  'Developer' as title,
  CASE 
    WHEN p.tournaments_officiated > 50 THEN 'Senior Developer'
    WHEN p.tournaments_officiated > 25 THEN 'Lead Developer'
    ELSE 'Developer'
  END as job_title,
  ARRAY['Chess', 'Arbitration', 'Technology'] as skills,
  p.tournaments_officiated as contributions,
  p.created_at,
  (CURRENT_DATE - DATE(p.created_at)) / 365 as years_of_service
FROM public.profiles p
WHERE p.is_active = true
ORDER BY p.tournaments_officiated DESC;

-- Create view for tournament evaluations with arbiter details
CREATE OR REPLACE VIEW public.evaluation_details AS
SELECT 
  te.*,
  t.name as tournament_name,
  t.start_date,
  t.end_date,
  t.venue,
  t.city,
  t.state,
  t.num_participants,
  ta.arbiter_id,
  p.first_name || ' ' || p.last_name as arbiter_name
FROM public.tournament_evaluations te
JOIN public.tournaments t ON te.tournament_id = t.id
LEFT JOIN public.tournament_assignments ta ON te.tournament_id = ta.tournament_id
LEFT JOIN public.profiles p ON ta.arbiter_id = p.id;

-- Ensure notification view exists
CREATE OR REPLACE VIEW public.notification_summary AS
SELECT 
  n.id,
  n.recipient_id,
  n.sender_id,
  n.title,
  n.message,
  n.notification_type,
  n.is_read,
  n.is_important,
  n.created_at,
  sender.first_name || ' ' || sender.last_name as sender_name,
  sender.avatar_url as sender_avatar
FROM public.notifications n
LEFT JOIN public.profiles sender ON n.sender_id = sender.id
ORDER BY n.created_at DESC;

-- Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_evaluations_arbiter ON public.tournament_evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_tournaments_officiated ON public.profiles(tournaments_officiated DESC);
