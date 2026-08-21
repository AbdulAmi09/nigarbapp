-- Security finding from auditing the profile page: the avatars bucket has
-- two generations of storage.objects policies live at once. Script 017
-- correctly scopes INSERT/UPDATE/DELETE to
-- (storage.foldername(name))[1] = auth.uid(), but script 026 later added
-- a redundant "Avatar upload policy" with WITH CHECK (bucket_id =
-- 'avatars') and no ownership check at all. Postgres OR's multiple
-- permissive policies for the same command, so that unrestricted policy
-- silently lets ANY authenticated user upload/overwrite ANY object in the
-- bucket -- including overwriting another member's avatar at their
-- current avatar_url path, which is public data already returned by
-- several directory RPCs (get_zone_directory, get_executives, etc.), so
-- the exact target path is trivially discoverable. Confirmed live: the
-- unrestricted policy is active in production alongside the scoped one.
--
-- It's worse than "redundant, but the safe one also works": the app's
-- upload path has always been flat -- avatars/<userId>-avatar.<ext> (or
-- avatars/<userId>-<timestamp>.<ext> on the settings page) -- not
-- folder-per-user. storage.foldername(name) on that path returns just
-- ['avatars'], so (storage.foldername(name))[1] evaluates to the literal
-- string 'avatars', never the uploading user's UUID. The "scoped" 017
-- policy has never actually matched for anyone; every real upload in
-- production has only ever succeeded because of the unrestricted 026
-- policy. So today, in practice, avatar uploads have no ownership
-- enforcement at all.
--
-- Fix: move to a folder-per-user path (avatars/<userId>/<file>, updated
-- in the frontend in this same commit) and replace all the avatar
-- INSERT/UPDATE/DELETE policies with ones keyed off
-- (storage.foldername(name))[2] -- the actual user-id folder segment for
-- that path shape -- so the ownership check matches reality instead of
-- silently never matching.

DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar read policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "avatars_insert_own_folder" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY "avatars_update_own_folder" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY "avatars_delete_own_folder" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2]);
