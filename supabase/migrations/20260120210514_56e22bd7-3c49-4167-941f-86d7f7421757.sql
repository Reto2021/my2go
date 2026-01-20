-- Create table for monthly Taler batches with expiration tracking
CREATE TABLE public.taler_monthly_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  earn_month DATE NOT NULL, -- First day of the month (e.g., 2024-01-01)
  amount_earned INTEGER NOT NULL DEFAULT 0,
  amount_redeemed INTEGER NOT NULL DEFAULT 0,
  amount_expired INTEGER NOT NULL DEFAULT 0,
  expires_at DATE NOT NULL, -- First day of expiry month (e.g., 2024-07-01)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_month UNIQUE(user_id, earn_month),
  CONSTRAINT positive_amounts CHECK (amount_earned >= 0 AND amount_redeemed >= 0 AND amount_expired >= 0),
  CONSTRAINT valid_balance CHECK (amount_earned >= amount_redeemed + amount_expired)
);

-- Create index for efficient queries
CREATE INDEX idx_taler_batches_user_expires ON public.taler_monthly_batches(user_id, expires_at);
CREATE INDEX idx_taler_batches_expires_at ON public.taler_monthly_batches(expires_at) WHERE amount_earned > amount_redeemed + amount_expired;

-- Enable RLS
ALTER TABLE public.taler_monthly_batches ENABLE ROW LEVEL SECURITY;

-- Users can view their own batches
CREATE POLICY "Users can view own taler batches"
ON public.taler_monthly_batches
FOR SELECT
USING (auth.uid() = user_id);

-- Only system (service role) can insert/update batches
CREATE POLICY "Service role can manage taler batches"
ON public.taler_monthly_batches
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to get remaining balance per batch
CREATE OR REPLACE FUNCTION public.get_remaining_batch_balance(batch_row public.taler_monthly_batches)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(0, batch_row.amount_earned - batch_row.amount_redeemed - batch_row.amount_expired);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add talers to current month's batch (upsert)
CREATE OR REPLACE FUNCTION public.add_taler_to_batch(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS public.taler_monthly_batches AS $$
DECLARE
  v_earn_month DATE;
  v_expires_at DATE;
  v_result public.taler_monthly_batches;
BEGIN
  -- Calculate first day of current month
  v_earn_month := date_trunc('month', CURRENT_DATE)::DATE;
  -- Expires on first day of 7th month (6 full months of validity)
  v_expires_at := (v_earn_month + INTERVAL '6 months')::DATE;
  
  INSERT INTO public.taler_monthly_batches (user_id, earn_month, amount_earned, expires_at)
  VALUES (p_user_id, v_earn_month, p_amount, v_expires_at)
  ON CONFLICT (user_id, earn_month) 
  DO UPDATE SET 
    amount_earned = taler_monthly_batches.amount_earned + p_amount,
    updated_at = now()
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem talers using FIFO (oldest batch first)
CREATE OR REPLACE FUNCTION public.redeem_taler_fifo(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, message TEXT, redeemed_from JSONB) AS $$
DECLARE
  v_remaining INTEGER := p_amount;
  v_batch RECORD;
  v_batch_remaining INTEGER;
  v_to_redeem INTEGER;
  v_redeemed_batches JSONB := '[]'::JSONB;
BEGIN
  -- Check total available balance
  IF (SELECT COALESCE(SUM(amount_earned - amount_redeemed - amount_expired), 0) 
      FROM public.taler_monthly_batches 
      WHERE user_id = p_user_id AND expires_at > CURRENT_DATE) < p_amount THEN
    RETURN QUERY SELECT FALSE, 'Nicht genügend gültige Taler vorhanden'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Process batches in FIFO order (oldest first, only non-expired)
  FOR v_batch IN 
    SELECT * FROM public.taler_monthly_batches 
    WHERE user_id = p_user_id 
      AND expires_at > CURRENT_DATE
      AND amount_earned > amount_redeemed + amount_expired
    ORDER BY earn_month ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    v_batch_remaining := v_batch.amount_earned - v_batch.amount_redeemed - v_batch.amount_expired;
    v_to_redeem := LEAST(v_remaining, v_batch_remaining);
    
    UPDATE public.taler_monthly_batches 
    SET amount_redeemed = amount_redeemed + v_to_redeem, updated_at = now()
    WHERE id = v_batch.id;
    
    v_remaining := v_remaining - v_to_redeem;
    
    v_redeemed_batches := v_redeemed_batches || jsonb_build_object(
      'month', v_batch.earn_month,
      'amount', v_to_redeem
    );
  END LOOP;
  
  RETURN QUERY SELECT TRUE, 'Erfolgreich eingelöst'::TEXT, v_redeemed_batches;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old batches (called by cron)
CREATE OR REPLACE FUNCTION public.expire_old_taler_batches()
RETURNS TABLE(user_id UUID, expired_amount INTEGER, earn_month DATE) AS $$
BEGIN
  RETURN QUERY
  WITH expired AS (
    UPDATE public.taler_monthly_batches b
    SET 
      amount_expired = amount_earned - amount_redeemed,
      updated_at = now()
    WHERE b.expires_at <= CURRENT_DATE
      AND b.amount_earned > b.amount_redeemed + b.amount_expired
    RETURNING b.user_id, (b.amount_earned - b.amount_redeemed - b.amount_expired) as expired_amount, b.earn_month
  )
  SELECT e.user_id, e.expired_amount, e.earn_month FROM expired e WHERE e.expired_amount > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expiring talers for next month (for notifications)
CREATE OR REPLACE FUNCTION public.get_expiring_talers_next_month()
RETURNS TABLE(user_id UUID, amount_expiring INTEGER, expires_at DATE, earn_month DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.user_id,
    (b.amount_earned - b.amount_redeemed - b.amount_expired) as amount_expiring,
    b.expires_at,
    b.earn_month
  FROM public.taler_monthly_batches b
  WHERE b.expires_at = date_trunc('month', CURRENT_DATE + INTERVAL '1 month')::DATE
    AND b.amount_earned > b.amount_redeemed + b.amount_expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for users to see their batch breakdown
CREATE OR REPLACE VIEW public.user_taler_batch_summary AS
SELECT 
  user_id,
  earn_month,
  amount_earned,
  amount_redeemed,
  amount_expired,
  (amount_earned - amount_redeemed - amount_expired) as amount_remaining,
  expires_at,
  CASE 
    WHEN expires_at <= CURRENT_DATE THEN 'expired'
    WHEN expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END as status
FROM public.taler_monthly_batches
WHERE amount_earned > amount_redeemed + amount_expired
  OR expires_at > CURRENT_DATE - INTERVAL '3 months'
ORDER BY earn_month ASC;