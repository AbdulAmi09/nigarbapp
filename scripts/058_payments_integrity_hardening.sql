-- Payments page transformation: close the fabrication holes, wire payment_due
-- (what's actually owed) to payments (the transaction log) for the first time,
-- and make Paystack the only path that can ever mark something paid.
--
-- Confirmed live before this script (rolled back, no real data touched):
--   1. payments_insert_authenticated only checked auth.role() = 'authenticated'.
--      Any signed-in arbiter could insert a fully "paid" row for themselves,
--      for any amount, or for a *different* arbiter's arbiter_id (a plain
--      .insert() with no .select() bypasses even the RETURNING-triggered
--      SELECT-visibility check).
--   2. payments_update_own had no WITH CHECK, so an arbiter could flip their
--      own pending payment straight to 'paid' with a raw client UPDATE,
--      skipping Paystack entirely.
--   3. payments.payment_status DEFAULTs to 'paid' when omitted on insert.
--   4. payment_due (the real "what you owe" ledger) allowed the owning
--      arbiter to UPDATE it directly (auth.uid() = arbiter_id, no WITH
--      CHECK) -- they could self-mark is_paid = true or zero out amount,
--      independent of payments entirely. Nothing ever synced the two tables
--      in either direction -- the one live "paid" due row has payment_id
--      IS NULL, proving no real payment ever closed it programmatically.
--   5. /api/payments/initialize charges Paystack using a client-supplied
--      amount, never the amount on file.

BEGIN;

-- 1. Stop defaulting new rows to 'paid'.
ALTER TABLE public.payments ALTER COLUMN payment_status SET DEFAULT 'pending';

-- 2. INSERT: only your own arbiter_id, and never straight to 'paid' --
--    'paid'/'overdue' can only be reached via the SECURITY DEFINER payment
--    functions below, which run with elevated privilege and bypass this
--    check by nature of being SECURITY DEFINER.
DROP POLICY IF EXISTS payments_insert_authenticated ON public.payments;
CREATE POLICY payments_insert_own ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = arbiter_id AND payment_status IN ('pending', 'processing'));

-- 3. UPDATE: arbiters no longer get a direct client-side UPDATE path at all.
--    The only legitimate transitions (pending -> processing, and anything ->
--    paid/cancelled/overdue) now go through SECURITY DEFINER functions.
DROP POLICY IF EXISTS payments_update_own ON public.payments;

-- 4. Enforce that annual_dues/checkoff/penalty payments always use the real
--    amount owed (from payment_due), never a client-supplied figure, and
--    can't be fabricated for a due that doesn't exist. Donations and
--    certification stay user-entered by design.
CREATE OR REPLACE FUNCTION public.enforce_payment_due_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_due public.payment_due%ROWTYPE;
BEGIN
  IF NEW.payment_type IN ('annual_dues', 'checkoff', 'penalty') THEN
    SELECT * INTO v_due
    FROM public.payment_due
    WHERE arbiter_id = NEW.arbiter_id
      AND payment_type = NEW.payment_type
      AND is_paid = false
    ORDER BY due_date ASC
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No outstanding % due found for this account', NEW.payment_type;
    END IF;

    NEW.amount := v_due.amount;
    NEW.due_date := v_due.due_date;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_payment_due_amount ON public.payments;
CREATE TRIGGER trg_enforce_payment_due_amount
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payment_due_amount();

-- 5. When a due-backed payment lands on 'paid', close the matching due
--    automatically -- this is the sync that never existed.
CREATE OR REPLACE FUNCTION public.sync_payment_due_on_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid')
     AND NEW.payment_type IN ('annual_dues', 'checkoff', 'penalty') THEN
    UPDATE public.payment_due
    SET is_paid = true,
        paid_date = COALESCE(NEW.paid_date, now()),
        payment_id = NEW.id,
        updated_at = now()
    WHERE id = (
      SELECT id FROM public.payment_due
      WHERE arbiter_id = NEW.arbiter_id
        AND payment_type = NEW.payment_type
        AND is_paid = false
      ORDER BY due_date ASC
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_payment_due_on_paid ON public.payments;
CREATE TRIGGER trg_sync_payment_due_on_paid
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_payment_due_on_paid();

-- 6. payment_due can no longer be edited by the arbiter it belongs to --
--    it's only ever closed by the sync trigger above now.
DROP POLICY IF EXISTS "Users can update their own payment dues" ON public.payment_due;

-- 7. Narrow RPC replacing the direct client UPDATE that /api/payments/
--    initialize used to perform: an arbiter may only move their own pending
--    payment to 'processing' and attach the Paystack reference. Nothing else
--    is reachable from here.
CREATE OR REPLACE FUNCTION public.mark_payment_processing(p_payment_id uuid, p_reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.payments
  SET transaction_reference = p_reference,
      payment_status = 'processing'
  WHERE id = p_payment_id
    AND arbiter_id = auth.uid()
    AND payment_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found or not in a payable state';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.mark_payment_processing(uuid, text) TO authenticated;

-- 8. record_paystack_payment: now the only path that can mark a payment
--    'paid', and it verifies the amount actually charged against the amount
--    owed before doing so. Underpaying (amount tampering) no longer
--    silently completes the payment -- it's left in 'processing' with a
--    notification telling the arbiter to contact NCAA instead.
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
  v_owed_amount numeric;
  v_payment_type text;
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
    SELECT arbiter_id, amount, payment_type INTO v_arbiter_id, v_owed_amount, v_payment_type
    FROM public.payments
    WHERE id = p_payment_id;

    IF v_arbiter_id IS NULL THEN
      RETURN;
    END IF;

    IF p_amount < v_owed_amount THEN
      -- Real Paystack charge succeeded but for less than what's owed --
      -- leave the payment in 'processing' rather than closing it out, and
      -- tell the arbiter so it doesn't just look stuck.
      INSERT INTO public.notifications (recipient_id, title, message, notification_type, related_id, action_url, is_read)
      VALUES (
        v_arbiter_id, 'Payment Amount Mismatch',
        'We received ₦' || to_char(p_amount, 'FM999,999,999') || ' but ₦' || to_char(v_owed_amount, 'FM999,999,999') ||
        ' was due. Your payment has not been marked complete -- please contact NCAA.',
        'payment', p_payment_id, '/dashboard/payments', false
      );
      RETURN;
    END IF;

    UPDATE public.payments
    SET payment_status = 'paid',
        paid_date = now(),
        payment_method = 'paystack',
        transaction_reference = p_reference
    WHERE id = p_payment_id;

    UPDATE public.event_registrations
    SET payment_status = 'paid'
    WHERE payment_id = p_payment_id;

    INSERT INTO public.notifications (recipient_id, title, message, notification_type, related_id, action_url, is_read)
    VALUES (
      v_arbiter_id, 'Payment Successful',
      'Your payment of ₦' || to_char(p_amount, 'FM999,999,999') || ' has been received successfully.',
      'payment', p_payment_id, '/dashboard/payments', false
    );
  ELSIF p_payment_id IS NOT NULL THEN
    UPDATE public.payments SET payment_status = 'cancelled' WHERE id = p_payment_id;
    UPDATE public.event_registrations SET status = 'cancelled', cancelled_at = now() WHERE payment_id = p_payment_id;
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.record_paystack_payment(text,uuid,numeric,text,text,text,text,text) TO anon, authenticated;

COMMIT;
