-- Create tournament evaluations table
CREATE TABLE IF NOT EXISTS public.tournament_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  equipment_rating INTEGER CHECK (equipment_rating >= 1 AND equipment_rating <= 5),
  time_management_rating INTEGER CHECK (time_management_rating >= 1 AND time_management_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  positive_feedback TEXT,
  areas_for_improvement TEXT,
  recommendations TEXT,
  would_officiate_again BOOLEAN,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, evaluator_id)
);

-- Enable RLS
ALTER TABLE public.tournament_evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "evaluations_select_own" ON public.tournament_evaluations 
  FOR SELECT USING (auth.uid() = evaluator_id);

CREATE POLICY "evaluations_insert_own" ON public.tournament_evaluations 
  FOR INSERT WITH CHECK (auth.uid() = evaluator_id);

CREATE POLICY "evaluations_update_own" ON public.tournament_evaluations 
  FOR UPDATE USING (auth.uid() = evaluator_id);

-- Create indexes
CREATE INDEX idx_evaluations_tournament ON public.tournament_evaluations(tournament_id);
CREATE INDEX idx_evaluations_evaluator ON public.tournament_evaluations(evaluator_id);
