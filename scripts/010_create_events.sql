-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT,
  city TEXT,
  state TEXT,
  organizer_id UUID REFERENCES public.profiles(id),
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  registration_fee DECIMAL(10,2) DEFAULT 0.00,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  requirements TEXT[],
  agenda TEXT,
  materials_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_public BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "events_select_public" ON public.events 
  FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "events_insert_authenticated" ON public.events 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "events_update_organizer" ON public.events 
  FOR UPDATE USING (auth.uid() = organizer_id);

-- Create indexes
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
