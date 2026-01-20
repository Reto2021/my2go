-- Backfill existing transactions into batches (one-time migration)
-- This groups all past 'earn' transactions by month
INSERT INTO public.taler_monthly_batches (user_id, earn_month, amount_earned, expires_at)
SELECT 
  user_id,
  date_trunc('month', created_at)::DATE as earn_month,
  SUM(amount) as amount_earned,
  (date_trunc('month', created_at)::DATE + INTERVAL '6 months')::DATE as expires_at
FROM public.transactions
WHERE type = 'earn' AND amount > 0
GROUP BY user_id, date_trunc('month', created_at)::DATE
ON CONFLICT (user_id, earn_month) 
DO UPDATE SET 
  amount_earned = EXCLUDED.amount_earned,
  updated_at = now();

-- Backfill redemptions (spend transactions) using approximate FIFO
DO $$
DECLARE
  v_user RECORD;
  v_total_spent NUMERIC;
  v_batch RECORD;
  v_remaining NUMERIC;
  v_batch_remaining NUMERIC;
  v_to_redeem NUMERIC;
BEGIN
  -- For each user with spend transactions
  FOR v_user IN 
    SELECT DISTINCT user_id FROM public.transactions WHERE type = 'spend' AND amount > 0
  LOOP
    -- Get total spent
    SELECT COALESCE(SUM(amount), 0) INTO v_total_spent
    FROM public.transactions 
    WHERE user_id = v_user.user_id AND type = 'spend' AND amount > 0;
    
    v_remaining := v_total_spent;
    
    -- Apply FIFO to existing batches (oldest first)
    FOR v_batch IN 
      SELECT * FROM public.taler_monthly_batches 
      WHERE user_id = v_user.user_id
      ORDER BY earn_month ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      
      v_batch_remaining := v_batch.amount_earned - v_batch.amount_redeemed - v_batch.amount_expired;
      v_to_redeem := LEAST(v_remaining, v_batch_remaining);
      
      IF v_to_redeem > 0 THEN
        UPDATE public.taler_monthly_batches 
        SET amount_redeemed = amount_redeemed + v_to_redeem, updated_at = now()
        WHERE id = v_batch.id;
        
        v_remaining := v_remaining - v_to_redeem;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Mark very old batches as expired (those that would have expired before today)
UPDATE public.taler_monthly_batches
SET 
  amount_expired = amount_earned - amount_redeemed,
  updated_at = now()
WHERE expires_at <= CURRENT_DATE
  AND amount_earned > amount_redeemed + amount_expired;