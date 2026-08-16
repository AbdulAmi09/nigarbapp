-- Real event registration: a write path for the "Register"/"Register Now"
-- buttons on /dashboard/events, which previously had no handler and no
-- backing table at all (M5 from the pilot audit).
--
-- Free events register immediately. Fee events reserve a spot (status =
-- 'registered', payment_status = 'pending') and route through the existing
-- Paystack payment infrastructure (payments table + /api/payments/initialize)
-- exactly like dues payments; record_paystack_payment is extended to also
-- flip the matching event_registrations row to payment_status = 'paid' once
-- Paystack confirms, via the payment_id link — a no-op for regular dues
-- payments, which never have a matching event_registrations row.
--
-- Known simplification: a reserved-but-unpaid spot (payment abandoned) isn't
-- automatically released. Acceptable for pilot scale; revisit with an
-- expiry sweep if fee events start filling up from abandoned checkouts.

BEGIN;

CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  arbiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered',
  payment_status text NOT NULL DEFAULT 'not_required',
  payment_id uuid REFERENCES public.payments(id),
  registered_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  UNIQUE (event_id, arbiter_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_registrations_select_own ON public.event_registrations
  FOR SELECT
  USING (auth.uid() = arbiter_id OR public.is_main_admin(auth.uid()));

CREATE POLICY event_registrations_insert_own ON public.event_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = arbiter_id);

CREATE POLICY event_registrations_update_own ON public.event_registrations
  FOR UPDATE
  USING (auth.uid() = arbiter_id OR public.is_main_admin(auth.uid()));

-- Keep events.current_attendees in sync with active registrations.
CREATE OR REPLACE FUNCTION public.handle_event_registration_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'registered' THEN
    UPDATE public.events SET current_attendees = COALESCE(current_attendees, 0) + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'registered' AND NEW.status = 'cancelled' THEN
    UPDATE public.events SET current_attendees = GREATEST(COALESCE(current_attendees, 0) - 1, 0) WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'cancelled' AND NEW.status = 'registered' THEN
    UPDATE public.events SET current_attendees = COALESCE(current_attendees, 0) + 1 WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_event_registration_change
  AFTER INSERT OR UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_registration_change();

-- Reject new registrations once an event is full.
CREATE OR REPLACE FUNCTION public.check_event_capacity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max integer;
  v_current integer;
BEGIN
  SELECT max_attendees, current_attendees INTO v_max, v_current FROM public.events WHERE id = NEW.event_id;
  IF v_max IS NOT NULL AND COALESCE(v_current, 0) >= v_max THEN
    RAISE EXCEPTION 'This event is full';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_check_event_capacity
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_event_capacity();

-- Extend the existing Paystack RPC to also settle event registrations.
CREATE OR REPLACE FUNCTION public.record_paystack_payment(p_reference text, p_payment_id uuid, p_amount numeric, p_customer_email text, p_authorization_code text, p_last_four text, p_channel text, p_status text)
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

    UPDATE public.event_registrations
    SET payment_status = 'paid'
    WHERE payment_id = p_payment_id;

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
    UPDATE public.event_registrations SET status = 'cancelled', cancelled_at = now() WHERE payment_id = p_payment_id;
  END IF;
END;
$function$;

COMMIT;
