-- Same RLS pattern found broken on the events page (script 063): both
-- resources policies used "auth.role() = 'authenticated'" as an OR
-- branch, which is true for every logged-in member -- is_public and
-- author scoping never actually restricted anything at the database
-- layer, even though the page's own query happens to filter
-- is_public=true client-side. Tightens both to match script 063's fix.

DROP POLICY IF EXISTS resources_select_public ON public.resources;
CREATE POLICY resources_select_public ON public.resources
  FOR SELECT
  USING (is_public = true OR auth.uid() = author_id OR public.is_main_admin(auth.uid()));

DROP POLICY IF EXISTS resources_insert_authenticated ON public.resources;
CREATE POLICY resources_insert_authenticated ON public.resources
  FOR INSERT
  WITH CHECK (auth.uid() = author_id OR public.is_main_admin(auth.uid()));
