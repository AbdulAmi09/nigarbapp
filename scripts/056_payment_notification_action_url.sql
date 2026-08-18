-- record_paystack_payment inserted the "Payment Successful" notification with
-- no related_id/action_url, so the email/push always linked to the generic
-- /dashboard instead of the specific payment. Set both.
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

    UPDATE public.event_registrations
    SET payment_status = 'paid'
    WHERE payment_id = p_payment_id;

    IF v_arbiter_id IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_id, title, message, notification_type, related_id, action_url, is_read)
      VALUES (
        v_arbiter_id, 'Payment Successful',
        'Your payment of ₦' || to_char(p_amount, 'FM999,999,999') || ' has been received successfully.',
        'payment', p_payment_id, '/dashboard/payments', false
      );
    END IF;
  ELSIF p_payment_id IS NOT NULL THEN
    UPDATE public.payments SET payment_status = 'cancelled' WHERE id = p_payment_id;
    UPDATE public.event_registrations SET status = 'cancelled', cancelled_at = now() WHERE payment_id = p_payment_id;
  END IF;
END;
$function$;
