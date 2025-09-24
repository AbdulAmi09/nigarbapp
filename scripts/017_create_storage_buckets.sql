-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('tournament-posters', 'tournament-posters', true),
  ('resources', 'resources', false),
  ('receipts', 'receipts', false),
  ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for tournament posters bucket
CREATE POLICY "Tournament posters are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'tournament-posters');

CREATE POLICY "Authenticated users can upload tournament posters" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tournament-posters' AND 
    auth.role() = 'authenticated'
  );

-- Create storage policies for resources bucket
CREATE POLICY "Authenticated users can view resources" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resources' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can upload resources" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resources' AND 
    auth.role() = 'authenticated'
  );

-- Create storage policies for receipts bucket
CREATE POLICY "Users can view their own receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for chat files bucket
CREATE POLICY "Chat room members can view files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' AND 
    auth.role() = 'authenticated'
  );
