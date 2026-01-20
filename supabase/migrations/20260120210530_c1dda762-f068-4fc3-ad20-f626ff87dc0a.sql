-- Fix search_path for all new functions to address security warnings
ALTER FUNCTION public.get_remaining_batch_balance(public.taler_monthly_batches) SET search_path = public;
ALTER FUNCTION public.add_taler_to_batch(UUID, INTEGER) SET search_path = public;
ALTER FUNCTION public.redeem_taler_fifo(UUID, INTEGER) SET search_path = public;
ALTER FUNCTION public.expire_old_taler_batches() SET search_path = public;
ALTER FUNCTION public.get_expiring_talers_next_month() SET search_path = public;

-- Drop and recreate view without SECURITY DEFINER (use SECURITY INVOKER which is default)
DROP VIEW IF EXISTS public.user_taler_batch_summary;

CREATE VIEW public.user_taler_batch_summary 
WITH (security_invoker = true) AS
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