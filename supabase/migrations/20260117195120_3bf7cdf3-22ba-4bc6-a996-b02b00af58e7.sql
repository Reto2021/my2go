-- =============================================================
-- AUDIO CREDITS SYSTEM
-- Tracks audio credit balances and transactions for partners
-- =============================================================

-- Partner audio credits balance (added to partners table)
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS audio_credits_balance integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS audio_credits_monthly_quota integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'starter';

-- Audio credit transactions table
CREATE TABLE public.audio_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL, -- positive = credit, negative = debit
  transaction_type text NOT NULL CHECK (transaction_type IN ('monthly_grant', 'air_drop', 'radio_spot', 'rollover', 'adjustment', 'refund')),
  description text,
  reference_id text, -- e.g., campaign ID, spot ID
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.audio_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_credit_transactions
CREATE POLICY "Partners can view their own credit transactions"
  ON public.audio_credit_transactions
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all credit transactions"
  ON public.audio_credit_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to add credits and update balance
CREATE OR REPLACE FUNCTION public.add_audio_credits(
  _partner_id uuid,
  _amount integer,
  _transaction_type text,
  _description text DEFAULT NULL,
  _reference_id text DEFAULT NULL
)
RETURNS public.audio_credit_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_transaction public.audio_credit_transactions;
BEGIN
  -- Insert transaction
  INSERT INTO public.audio_credit_transactions (
    partner_id, amount, transaction_type, description, reference_id, created_by
  ) VALUES (
    _partner_id, _amount, _transaction_type, _description, _reference_id, auth.uid()
  )
  RETURNING * INTO new_transaction;
  
  -- Update partner balance
  UPDATE public.partners 
  SET audio_credits_balance = audio_credits_balance + _amount
  WHERE id = _partner_id;
  
  RETURN new_transaction;
END;
$$;

-- Function to use credits (debit)
CREATE OR REPLACE FUNCTION public.use_audio_credits(
  _partner_id uuid,
  _amount integer,
  _transaction_type text,
  _description text DEFAULT NULL,
  _reference_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
  new_transaction public.audio_credit_transactions;
BEGIN
  -- Get current balance
  SELECT audio_credits_balance INTO current_balance
  FROM public.partners WHERE id = _partner_id;
  
  IF current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Partner not found');
  END IF;
  
  IF current_balance < _amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits', 'balance', current_balance);
  END IF;
  
  -- Insert debit transaction (negative amount)
  INSERT INTO public.audio_credit_transactions (
    partner_id, amount, transaction_type, description, reference_id, created_by
  ) VALUES (
    _partner_id, -_amount, _transaction_type, _description, _reference_id, auth.uid()
  )
  RETURNING * INTO new_transaction;
  
  -- Update partner balance
  UPDATE public.partners 
  SET audio_credits_balance = audio_credits_balance - _amount
  WHERE id = _partner_id;
  
  RETURN json_build_object(
    'success', true, 
    'transaction_id', new_transaction.id,
    'new_balance', current_balance - _amount
  );
END;
$$;

-- Index for fast partner lookups
CREATE INDEX IF NOT EXISTS idx_audio_credit_transactions_partner 
  ON public.audio_credit_transactions(partner_id, created_at DESC);