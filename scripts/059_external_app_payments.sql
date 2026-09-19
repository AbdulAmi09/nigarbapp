-- Make nigarbapp's already-hardened Paystack pipeline (payments table +
-- record_paystack_payment/mark_payment_processing RPCs, see 007/022/036/058)
-- the shared payment service for the rest of the NCAA ecosystem, instead of
-- ncaalearn (and future apps) each re-implementing Paystack integration and
-- amount-tampering defenses from scratch. ncaalearn's `markRegistrationPaid`
-- is currently a stub with no gateway verification at all -- anyone could
-- call it to self-mark a seminar paid -- and its compliance-fine override
-- has no fee concept whatsoever.
--
-- All apps share one Supabase project/database, so this is a same-database
-- integration: no cross-app webhooks needed, just SECURITY DEFINER
-- functions that read/write another app's tables directly.

BEGIN;

-- 1. Let a payment point back to the app/record that created it.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS source_app text,
  ADD COLUMN IF NOT EXISTS source_reference text;

CREATE INDEX IF NOT EXISTS idx_payments_source
  ON public.payments(source_app, source_reference)
  WHERE source_app IS NOT NULL;

-- 2. Compliance fine: fixed, admin-configurable amount (TODO.MD 17.3 --
-- "unblockable by the admin after paying fine"), stored like every other
-- academy-wide setting.
ALTER TABLE public.academy_settings
  ADD COLUMN IF NOT EXISTS compliance_fine_amount numeric(12,2) NOT NULL DEFAULT 0;

-- 3. Entry point external apps use to start a payment. The amount is always
-- looked up here, server-side, from the source app's own tables -- never
-- trusted from the caller, same principle as enforce_payment_due_amount()
-- already applies to annual_dues/checkoff/penalty.
CREATE OR REPLACE FUNCTION public.create_external_payment(
  p_source_app text,
  p_purpose text,
  p_reference_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount numeric;
  v_payment_type text;
  v_payment_id uuid;
  v_existing uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_source_app = 'ncaalearn' AND p_purpose = 'seminar_fee' THEN
    SELECT s.fee_amount INTO v_amount
    FROM public.academy_seminar_registrations r
    JOIN public.academy_seminars s ON s.id = r.seminar_id
    WHERE r.id = p_reference_id::uuid
      AND r.user_id = auth.uid();

    IF v_amount IS NULL OR v_amount <= 0 THEN
      RAISE EXCEPTION 'Seminar registration not found, not yours, or has no fee';
    END IF;
    v_payment_type := 'Seminar Fee';

  ELSIF p_source_app = 'ncaalearn' AND p_purpose = 'compliance_fine' THEN
    SELECT compliance_fine_amount INTO v_amount
    FROM public.academy_settings
    WHERE id = true;

    IF v_amount IS NULL OR v_amount <= 0 THEN
      RAISE EXCEPTION 'No compliance fine amount configured';
    END IF;
    v_payment_type := 'Compliance Fine';
    p_reference_id := auth.uid()::text;

  ELSE
    RAISE EXCEPTION 'Unknown external payment purpose: % / %', p_source_app, p_purpose;
  END IF;

  -- Reuse an existing pending payment for the same purpose instead of
  -- creating duplicates if the user retries/re-opens the pay dialog.
  SELECT id INTO v_existing
  FROM public.payments
  WHERE arbiter_id = auth.uid()
    AND source_app = p_source_app
    AND source_reference = p_reference_id
    AND payment_status = 'pending';

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.payments (arbiter_id, amount, payment_type, payment_status, source_app, source_reference, description)
  VALUES (auth.uid(), v_amount, v_payment_type, 'pending', p_source_app, p_reference_id, p_purpose)
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_external_payment(text, text, text) TO authenticated;

-- 4. Settlement: extend record_paystack_payment (the only path that can ever
-- mark a payment 'paid') to also close out the source app's own record when
-- one exists, instead of requiring a separate cross-app webhook.
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
  v_source_app text;
  v_source_reference text;
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
    SELECT arbiter_id, amount, payment_type, source_app, source_reference
    INTO v_arbiter_id, v_owed_amount, v_payment_type, v_source_app, v_source_reference
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

    -- Settle the source app's own record, if this payment came from one.
    IF v_source_app = 'ncaalearn' AND v_payment_type = 'Seminar Fee' THEN
      UPDATE public.academy_seminar_registrations
      SET payment_status = 'paid',
          amount_paid = p_amount,
          payment_reference = p_reference
      WHERE id = v_source_reference::uuid;
    ELSIF v_source_app = 'ncaalearn' AND v_payment_type = 'Compliance Fine' THEN
      INSERT INTO public.academy_compliance_overrides (user_id, reason, granted_by)
      VALUES (v_arbiter_id, 'Compliance fine paid via Paystack (ref: ' || p_reference || ')', NULL);
    END IF;

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
