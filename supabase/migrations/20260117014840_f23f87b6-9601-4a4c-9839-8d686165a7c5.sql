-- Creator earnings tracking (records each payment received)
CREATE TABLE public.creator_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid_out')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Creator payout requests
CREATE TABLE public.creator_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payout_method TEXT NOT NULL CHECK (payout_method IN ('paypal', 'bank_transfer', 'stripe_connect')),
  payout_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payout preferences to creators
ALTER TABLE public.creators
ADD COLUMN IF NOT EXISTS payout_method TEXT CHECK (payout_method IN ('paypal', 'bank_transfer', 'stripe_connect')),
ADD COLUMN IF NOT EXISTS payout_details JSONB,
ADD COLUMN IF NOT EXISTS minimum_payout DECIMAL(10,2) DEFAULT 50.00;

-- Enable RLS
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

-- Creators can view their own earnings
CREATE POLICY "Creators can view their own earnings"
ON public.creator_earnings
FOR SELECT
USING (
  creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  )
);

-- Creators can view their own payouts
CREATE POLICY "Creators can view their own payouts"
ON public.creator_payouts
FOR SELECT
USING (
  creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  )
);

-- Creators can request payouts
CREATE POLICY "Creators can request payouts"
ON public.creator_payouts
FOR INSERT
WITH CHECK (
  creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_creator_earnings_creator_id ON public.creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON public.creator_earnings(status);
CREATE INDEX idx_creator_payouts_creator_id ON public.creator_payouts(creator_id);
CREATE INDEX idx_creator_payouts_status ON public.creator_payouts(status);