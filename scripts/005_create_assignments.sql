-- Create tournament assignments table
CREATE TABLE IF NOT EXISTS public.tournament_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  arbiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Chief Arbiter', 'Deputy Arbiter', 'Assistant Arbiter')),
  assignment_status assignment_status DEFAULT 'Pending',
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  compensation DECIMAL(10,2) DEFAULT 0.00,
  travel_allowance DECIMAL(10,2) DEFAULT 0.00,
  accommodation_provided BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, arbiter_id)
);

-- Enable RLS
ALTER TABLE public.tournament_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "assignments_select_own" ON public.tournament_assignments 
  FOR SELECT USING (auth.uid() = arbiter_id OR auth.uid() = assigned_by);

CREATE POLICY "assignments_insert_authenticated" ON public.tournament_assignments 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "assignments_update_own" ON public.tournament_assignments 
  FOR UPDATE USING (auth.uid() = arbiter_id OR auth.uid() = assigned_by);

-- Create indexes
CREATE INDEX idx_assignments_tournament ON public.tournament_assignments(tournament_id);
CREATE INDEX idx_assignments_arbiter ON public.tournament_assignments(arbiter_id);
CREATE INDEX idx_assignments_status ON public.tournament_assignments(assignment_status);
