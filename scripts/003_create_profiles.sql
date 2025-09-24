-- Create profiles table for arbiters
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',
  arbiter_level arbiter_level DEFAULT 'Candidate',
  license_number TEXT UNIQUE,
  license_expiry DATE,
  zone zone_type,
  bio TEXT,
  avatar_url TEXT,
  years_experience INTEGER DEFAULT 0,
  tournaments_officiated INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_select_all_authenticated" ON public.profiles 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_license_number ON public.profiles(license_number);
CREATE INDEX idx_profiles_zone ON public.profiles(zone);
CREATE INDEX idx_profiles_arbiter_level ON public.profiles(arbiter_level);
