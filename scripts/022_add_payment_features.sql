-- Add missing columns to payments table if not exists
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_upload_date TIMESTAMP WITH TIME ZONE;

-- Create payment_due table to track arbiter payment obligations
CREATE TABLE IF NOT EXISTS public.payment_due (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arbiter_id UUID NOT NULL REFERENCES public.arbiters(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('annual_dues', 'checkoff', 'penalty', 'donation', 'certification')),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_date TIMESTAMP WITH TIME ZONE,
  payment_id UUID REFERENCES public.payments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_due_arbiter_id ON public.payment_due(arbiter_id);
CREATE INDEX IF NOT EXISTS idx_payment_due_payment_type ON public.payment_due(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_due_is_paid ON public.payment_due(is_paid);

-- Create paystack_transactions table to track Paystack webhook data
CREATE TABLE IF NOT EXISTS public.paystack_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(255) NOT NULL UNIQUE,
  payment_id UUID REFERENCES public.payments(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'pending',
  customer_email VARCHAR(255),
  authorization_code VARCHAR(255),
  last_four VARCHAR(4),
  channel VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Paystack transactions
CREATE INDEX IF NOT EXISTS idx_paystack_transactions_reference ON public.paystack_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_paystack_transactions_payment_id ON public.paystack_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_paystack_transactions_status ON public.paystack_transactions(status);

-- Enable RLS for payment_due table
ALTER TABLE public.payment_due ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_due
CREATE POLICY IF NOT EXISTS "Users can view their own payment dues" 
ON public.payment_due FOR SELECT 
USING (auth.uid() = arbiter_id);

CREATE POLICY IF NOT EXISTS "Users can update their own payment dues" 
ON public.payment_due FOR UPDATE 
USING (auth.uid() = arbiter_id);

-- Enable RLS for paystack_transactions
ALTER TABLE public.paystack_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for paystack_transactions (service role only for webhooks)
CREATE POLICY IF NOT EXISTS "Service role can manage paystack transactions" 
ON public.paystack_transactions FOR ALL 
USING (true);
