-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arbiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.tournament_assignments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Tournament Fee', 'Travel Allowance', 'Accommodation', 'Bonus', 'Penalty', 'Membership Fee')),
  payment_status payment_status DEFAULT 'Pending',
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,
  transaction_reference TEXT,
  description TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "payments_select_own" ON public.payments 
  FOR SELECT USING (auth.uid() = arbiter_id OR auth.uid() = created_by);

CREATE POLICY "payments_insert_authenticated" ON public.payments 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "payments_update_own" ON public.payments 
  FOR UPDATE USING (auth.uid() = arbiter_id OR auth.uid() = created_by);

-- Create indexes
CREATE INDEX idx_payments_arbiter ON public.payments(arbiter_id);
CREATE INDEX idx_payments_tournament ON public.payments(tournament_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);
