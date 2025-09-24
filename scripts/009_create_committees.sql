-- Create committees table
CREATE TABLE IF NOT EXISTS public.committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  chairman_id UUID REFERENCES public.profiles(id),
  secretary_id UUID REFERENCES public.profiles(id),
  members UUID[] DEFAULT '{}',
  meeting_schedule TEXT,
  next_meeting_date TIMESTAMP WITH TIME ZONE,
  meeting_location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "committees_select_all" ON public.committees 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "committees_insert_authenticated" ON public.committees 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "committees_update_members" ON public.committees 
  FOR UPDATE USING (auth.uid() = chairman_id OR auth.uid() = secretary_id OR auth.uid() = ANY(members));

-- Create indexes
CREATE INDEX idx_committees_chairman ON public.committees(chairman_id);
CREATE INDEX idx_committees_active ON public.committees(is_active);
