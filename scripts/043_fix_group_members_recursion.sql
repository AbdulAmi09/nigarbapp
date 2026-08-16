-- Fix "infinite recursion detected in policy for relation group_members"
-- (Postgres error 42P17). The existing group_members_select_same_group
-- policy checks membership by querying group_members from within its own
-- USING clause:
--
--   EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id
--           AND gm.user_id = auth.uid())
--
-- Evaluating that subquery re-triggers RLS on group_members, which re-runs
-- the same policy, forever. This is a pre-existing bug in the shared
-- schema — not something introduced this session — that simply hadn't been
-- hit by a real authenticated request until group chat creation surfaced
-- it. It broke every query that touches group_members under RLS: the chat
-- room list, group creation, and even get_or_create_dm_room's insert.
--
-- Standard fix: move the membership check into a SECURITY DEFINER helper.
-- Functions owned by a role that bypasses RLS (the case here) don't have
-- RLS re-applied to their own internal queries, so the self-reference no
-- longer recurses.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

DROP POLICY IF EXISTS group_members_select_same_group ON public.group_members;

CREATE POLICY group_members_select_same_group ON public.group_members
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

COMMIT;

NOTIFY pgrst, 'reload schema';
