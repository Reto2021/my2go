-- Fix save_session_progress to properly track awarded taler
-- The issue: v_current_reward = 1, v_previous_reward = 1 from session → v_new_reward = 0
-- But the transaction was never created in the first place!
-- Solution: Check if transaction exists before skipping

CREATE OR REPLACE FUNCTION public.save_session_progress(_session_id uuid, _duration_seconds integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_session radio_listening_sessions%ROWTYPE;
  v_user_id UUID;
  v_current_reward INTEGER := 0;
  v_previous_reward INTEGER := 0;
  v_new_reward INTEGER := 0;
  v_tier radio_listening_tiers%ROWTYPE;
  v_transaction_exists BOOLEAN := false;
BEGIN
  -- Get the session
  SELECT * INTO v_session
  FROM radio_listening_sessions
  WHERE id = _session_id AND ended_at IS NULL;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Session not found or already ended');
  END IF;
  
  v_user_id := v_session.user_id;
  
  -- Calculate reward based on current duration
  SELECT * INTO v_tier
  FROM radio_listening_tiers
  WHERE is_active = true AND min_duration_seconds <= _duration_seconds
  ORDER BY min_duration_seconds DESC
  LIMIT 1;
  
  IF v_tier IS NOT NULL THEN
    v_current_reward := v_tier.taler_reward;
  END IF;
  
  -- Get previously awarded amount for this session
  v_previous_reward := COALESCE(v_session.taler_awarded, 0);
  
  -- Calculate new reward to add (difference)
  v_new_reward := v_current_reward - v_previous_reward;
  
  -- Update session with total reward so far
  UPDATE radio_listening_sessions
  SET taler_awarded = v_current_reward
  WHERE id = _session_id;
  
  -- Check if we already have a transaction for this session with the current total
  -- This prevents duplicate transactions
  SELECT EXISTS (
    SELECT 1 FROM transactions 
    WHERE reference_id = _session_id::text 
      AND source = 'radio'
      AND user_id = v_user_id
  ) INTO v_transaction_exists;
  
  -- If there's new reward to give, add it
  IF v_new_reward > 0 THEN
    -- Add Taler to batch
    INSERT INTO public.taler_monthly_batches (user_id, earn_month, amount_earned, expires_at)
    VALUES (
      v_user_id, 
      date_trunc('month', CURRENT_DATE)::DATE,
      v_new_reward, 
      (date_trunc('month', CURRENT_DATE) + INTERVAL '6 months')::DATE
    )
    ON CONFLICT (user_id, earn_month) 
    DO UPDATE SET 
      amount_earned = taler_monthly_batches.amount_earned + v_new_reward,
      updated_at = now();
    
    -- Record transaction (one per save with the incremental amount)
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (
      v_user_id, 
      v_new_reward, 
      'earn', 
      'radio', 
      'Radio hören (' || v_tier.name || ')', 
      _session_id::text
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'duration', _duration_seconds,
      'total_reward', v_current_reward,
      'new_reward', v_new_reward,
      'tier', v_tier.name,
      'transaction_created', true
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'duration', _duration_seconds,
    'total_reward', v_current_reward,
    'new_reward', 0,
    'transaction_created', false
  );
END;
$function$;