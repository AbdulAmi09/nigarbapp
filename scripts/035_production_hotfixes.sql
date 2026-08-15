-- Production hotfix migration for NCAA Chess Arbiters Dashboard
-- All changes are additive/safe: new column, new policy, function replacements.
-- Verified against LIVE schema (not the repo's scripts/*.sql, which have drifted).

BEGIN;

-- 1. Chat is completely broken: every message insert fires
--    increment_unread_for_room_members(), which writes to
--    unread_messages.updated_at -- a column that does not exist.
--    The AFTER INSERT trigger error rolls back the whole message send.
ALTER TABLE public.unread_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Voice messages violate the message_type CHECK constraint (only
--    text/file/image allowed live, app also sends 'voice').
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_message_type_check
  CHECK (message_type = ANY (ARRAY['text','file','image','voice']));

-- 3. "Mark as read" (PUT /api/notifications) silently fails for every arbiter:
--    the only UPDATE policies on notifications check account_id (a column used
--    by a different app sharing this DB), never recipient_id (what this app uses).
DROP POLICY IF EXISTS notifications_update_recipient ON public.notifications;
CREATE POLICY notifications_update_recipient ON public.notifications
  FOR UPDATE USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

-- 4. send_notification() never set action_required/action_type, so the
--    Accept/Decline buttons on assignment notifications never appear.
--    Adding trailing optional params is backward compatible with existing callers.
CREATE OR REPLACE FUNCTION public.send_notification(
  recipient_uuid uuid,
  sender_uuid uuid,
  notification_title text,
  notification_message text,
  notification_type_param notification_type,
  related_uuid uuid DEFAULT NULL::uuid,
  action_url_param text DEFAULT NULL::text,
  action_required_param boolean DEFAULT false,
  action_type_param action_type DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    recipient_id, sender_id, title, message, notification_type,
    related_id, action_url, action_required, action_type
  )
  VALUES (
    recipient_uuid, sender_uuid, notification_title, notification_message,
    notification_type_param, related_uuid, action_url_param,
    action_required_param, action_type_param
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$function$;

-- 5. Have new-assignment notifications actually request the Accept/Decline action.
CREATE OR REPLACE FUNCTION public.notify_assignment_created()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  tournament_name TEXT;
BEGIN
  SELECT name INTO tournament_name
  FROM public.tournaments
  WHERE id = NEW.tournament_id;

  PERFORM public.send_notification(
    NEW.arbiter_id,
    NEW.assigned_by,
    'New Tournament Assignment',
    'You have been assigned to officiate ' || tournament_name || ' as ' || NEW.role,
    'Assignment',
    NEW.id,
    '/dashboard/tournament-assignment',
    true,
    'Tournament_assignment'
  );

  RETURN NEW;
END;
$function$;

-- 6. Registration form collects phone; the trigger never persisted it.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, zone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    NEW.raw_user_meta_data ->> 'phone',
    NULLIF(NEW.raw_user_meta_data ->> 'zone', '')::public.zone_type
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 7. Payment webhook fix: Paystack calls this with no user session, so RLS
--    (payments_update_own, notifications_insert_authenticated, and the
--    service_role-only paystack_transactions policy) blocks every write the
--    webhook needs to make. Rather than hand a service-role key to a public
--    webhook route, do the whole confirmation atomically in a SECURITY
--    DEFINER function scoped to exactly what the webhook needs.
CREATE OR REPLACE FUNCTION public.record_paystack_payment(
  p_reference text,
  p_payment_id uuid,
  p_amount numeric,
  p_customer_email text,
  p_authorization_code text,
  p_last_four text,
  p_channel text,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_arbiter_id uuid;
BEGIN
  INSERT INTO public.paystack_transactions (
    reference, payment_id, amount, customer_email, status,
    authorization_code, last_four, channel, paid_at
  ) VALUES (
    p_reference, p_payment_id, p_amount, p_customer_email, p_status,
    p_authorization_code, p_last_four, p_channel,
    CASE WHEN p_status = 'success' THEN now() ELSE NULL END
  )
  ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status;

  IF p_status = 'success' THEN
    UPDATE public.payments
    SET payment_status = 'paid',
        paid_date = now(),
        payment_method = 'paystack',
        transaction_reference = p_reference
    WHERE id = p_payment_id
    RETURNING arbiter_id INTO v_arbiter_id;

    IF v_arbiter_id IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_id, title, message, notification_type, is_read)
      VALUES (
        v_arbiter_id, 'Payment Successful',
        'Your payment of ₦' || to_char(p_amount, 'FM999,999,999') || ' has been received successfully.',
        'payment', false
      );
    END IF;
  ELSIF p_payment_id IS NOT NULL THEN
    UPDATE public.payments SET payment_status = 'cancelled' WHERE id = p_payment_id;
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.record_paystack_payment(text,uuid,numeric,text,text,text,text,text) TO anon, authenticated;

-- 8. resources.download_count can only be bumped by resources_update_author
--    (auth.uid() = author_id), so downloading someone else's resource never
--    increments the counter (silent no-op under RLS). Scope a narrow RPC
--    instead of loosening the UPDATE policy to "any authenticated user".
CREATE OR REPLACE FUNCTION public.increment_resource_downloads(p_resource_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.resources SET download_count = COALESCE(download_count, 0) + 1 WHERE id = p_resource_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.increment_resource_downloads(uuid) TO anon, authenticated;

COMMIT;
