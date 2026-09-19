-- Fixes a live, currently-silent bug in nigarbadminapp-main's Payments page.
--
-- payment_due has had exactly one RLS policy since migration 058 dropped
-- "Users can update their own payment dues": a SELECT policy scoped to the
-- owning arbiter. nigarbadminapp-main's admin UI uses the plain anon-key
-- client for both "assign a new due" (INSERT) and "Mark Paid" (UPDATE) --
-- neither has ever had a policy allowing it, so both silently affect 0 rows
-- under RLS (no error is thrown; Postgres just filters out every row),
-- while the UI shows a success toast regardless.
--
-- Fix: admin-only INSERT policy for assigning dues, and a SECURITY DEFINER
-- RPC (not a bare UPDATE policy) for marking one paid, since "an admin
-- reconciled an offline/bank-transfer payment" should also leave a real
-- payments record -- the 058 migration's own comment noted this sync never
-- existed in either direction.

BEGIN;

CREATE POLICY "admins can assign payment dues" ON public.payment_due
  FOR INSERT TO authenticated
  WITH CHECK (is_main_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_reconcile_payment_due(
  p_due_id uuid,
  p_method text DEFAULT 'offline'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due public.payment_due%ROWTYPE;
  v_payment_id uuid;
BEGIN
  IF NOT is_main_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin required';
  END IF;

  SELECT * INTO v_due FROM public.payment_due WHERE id = p_due_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment due not found';
  END IF;
  IF v_due.is_paid THEN
    RAISE EXCEPTION 'Already marked paid';
  END IF;

  INSERT INTO public.payments (arbiter_id, amount, payment_type, payment_status, payment_method, paid_date, created_by, description)
  VALUES (v_due.arbiter_id, v_due.amount, v_due.payment_type, 'paid', p_method, now(), auth.uid(), 'Manual reconciliation via admin console')
  RETURNING id INTO v_payment_id;

  UPDATE public.payment_due
  SET is_paid = true, paid_date = now(), payment_id = v_payment_id, updated_at = now()
  WHERE id = p_due_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reconcile_payment_due(uuid, text) TO authenticated;

COMMIT;
