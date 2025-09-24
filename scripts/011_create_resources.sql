-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Rules & Regulations', 'Training Materials', 'Forms & Documents', 'Guidelines', 'Software', 'Videos', 'Articles')),
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  thumbnail_url TEXT,
  tags TEXT[],
  author_id UUID REFERENCES public.profiles(id),
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "resources_select_public" ON public.resources 
  FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "resources_insert_authenticated" ON public.resources 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "resources_update_author" ON public.resources 
  FOR UPDATE USING (auth.uid() = author_id);

-- Create indexes
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX idx_resources_featured ON public.resources(is_featured);
