-- Ensure proper RLS policies for avatar storage bucket

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Enable public access for avatar uploads
CREATE POLICY "Avatar upload policy" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars')
  AS PERMISSIVE FOR ROLE authenticated;

-- Enable public read access
CREATE POLICY "Avatar read policy" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars')
  AS PERMISSIVE FOR ROLE anon;

-- Enable delete for owners
CREATE POLICY "Avatar delete policy" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1]))
  AS PERMISSIVE FOR ROLE authenticated;
