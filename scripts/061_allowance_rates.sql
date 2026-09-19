-- Backs the public "Arbiter Allowances" page (rates-main), which today is a
-- fully static "under review" placeholder with no data model at all. Public,
-- read-only, no payment flow -- separate from and independent of the
-- payments work in 059/060.

BEGIN;

CREATE TABLE IF NOT EXISTS public.allowance_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  effective_from date NOT NULL DEFAULT current_date,
  notes text,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allowance_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published rates are public" ON public.allowance_rates
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "admins manage rates" ON public.allowance_rates
  FOR ALL TO authenticated
  USING (is_main_admin(auth.uid()))
  WITH CHECK (is_main_admin(auth.uid()));

GRANT SELECT ON public.allowance_rates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.allowance_rates TO authenticated;

CREATE OR REPLACE FUNCTION public.allowance_rates_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_allowance_rates_updated_at ON public.allowance_rates;
CREATE TRIGGER trg_allowance_rates_updated_at
  BEFORE UPDATE ON public.allowance_rates
  FOR EACH ROW EXECUTE FUNCTION public.allowance_rates_set_updated_at();

COMMIT;
