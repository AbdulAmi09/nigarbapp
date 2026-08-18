-- 1. mark_all_notifications_read took an arbitrary user_id with no ownership
--    check (SECURITY DEFINER) -- any authenticated arbiter could mark another
--    arbiter's entire notification inbox as read. Scope it to the caller.
DROP FUNCTION IF EXISTS public.mark_all_notifications_read(uuid);

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read = true
  WHERE recipient_id = auth.uid() AND is_read = false;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- 2. No DELETE policy existed on notifications at all, so arbiters had no way
--    to clear their own notification history.
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE
  USING (auth.uid() = recipient_id);
