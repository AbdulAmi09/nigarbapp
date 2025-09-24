-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_fee DECIMAL(10,2) DEFAULT 0.00,
  prize_fund DECIMAL(10,2) DEFAULT 0.00,
  time_control TEXT,
  rounds INTEGER,
  tournament_status tournament_status DEFAULT 'Scheduled',
  organizer_id UUID REFERENCES public.profiles(id),
  chief_arbiter_id UUID REFERENCES public.profiles(id),
  deputy_arbiters UUID[] DEFAULT '{}',
  requirements TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  poster_url TEXT,
  is_rated BOOLEAN DEFAULT true,
  is_fide_rated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "tournaments_select_all" ON public.tournaments 
  FOR SELECT USING (true);

CREATE POLICY "tournaments_insert_authenticated" ON public.tournaments 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tournaments_update_organizer" ON public.tournaments 
  FOR UPDATE USING (auth.uid() = organizer_id OR auth.uid() = chief_arbiter_id);

-- Create indexes
CREATE INDEX idx_tournaments_start_date ON public.tournaments(start_date);
CREATE INDEX idx_tournaments_status ON public.tournaments(tournament_status);
CREATE INDEX idx_tournaments_organizer ON public.tournaments(organizer_id);
CREATE INDEX idx_tournaments_chief_arbiter ON public.tournaments(chief_arbiter_id);
