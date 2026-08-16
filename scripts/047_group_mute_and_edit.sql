-- Supports: mute-a-conversation (group_members.is_muted already existed,
-- unused) and message editing (chat_messages.is_edited/edited_at already
-- existed, unused).
--
-- Muting needs its own narrow RPC rather than a general "update your own
-- group_members row" RLS policy: group_members has no self-UPDATE policy
-- today (only group_members_admin_all, is_main_admin-gated), and a naive
-- self-UPDATE policy would also let a regular member edit their own `role`
-- column and promote themselves to admin. This RPC only ever touches
-- is_muted for the caller's own row.
--
-- Message editing needs no new policy — chat_messages_update_own already
-- allows sender_id = auth.uid(), same policy delete-own-message already
-- relies on.

BEGIN;

CREATE OR REPLACE FUNCTION public.set_group_mute(p_group_id uuid, p_muted boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.group_members
  SET is_muted = p_muted
  WHERE group_id = p_group_id AND user_id = auth.uid();
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';
