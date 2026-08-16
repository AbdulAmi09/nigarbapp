-- Production hotfix: arbiters could not create Paystack/bank-transfer payments.
--
-- Root cause: the shared `payments` table is used by more than one NCAA app.
-- The existing SELECT policies ("Users can view own payments", "payments_select_own")
-- only check `account_id = auth.uid()`. This arbiters app writes `arbiter_id`
-- (leaving `account_id` NULL), so a freshly inserted row was invisible to its
-- own author under RLS. INSERT succeeded, but the `.select().single()` used to
-- read the row back (Supabase JS `insert().select()`) was denied, surfacing as
-- a 403 in the payment dialog and aborting the Paystack flow before checkout.
--
-- Fix is additive only: add a second SELECT policy keyed on `arbiter_id`.
-- Postgres OR's multiple permissive policies for the same command, so this
-- does not change visibility for the other app's account_id-based rows.

BEGIN;

CREATE POLICY payments_select_own_arbiter ON public.payments
  FOR SELECT
  USING (auth.uid() = arbiter_id);

COMMIT;
