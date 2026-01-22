-- Drop and recreate save_session_progress with correct logic
-- FIXES:
-- 1. DO NOT update duration_seconds (it's a GENERATED column)
-- 2. Cast session_id to TEXT when comparing with reference_id

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
  v_already_awarded INTEGER := 0;
  v_new_reward INTEGER := 0;
  v_tier radio_listening_tiers%ROWTYPE;
BEGIN
  -- Get the session (without locking since we just need to read)
  SELECT * INTO v_session
  FROM radio_listening_sessions
  WHERE id = _session_id AND ended_at IS NULL;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Session not found or already ended');
  END IF;
  
  v_user_id := v_session.user_id;
  
  -- Calculate reward based on current duration parameter
  SELECT * INTO v_tier
  FROM radio_listening_tiers
  WHERE is_active = true AND min_duration_seconds <= _duration_seconds
  ORDER BY min_duration_seconds DESC
  LIMIT 1;
  
  IF v_tier IS NOT NULL THEN
    v_current_reward := v_tier.taler_reward;
  END IF;
  
  -- Get the ACTUAL amount already awarded via transactions for this session
  -- CRITICAL: Cast UUID to TEXT for comparison with reference_id
  SELECT COALESCE(SUM(amount), 0) INTO v_already_awarded
  FROM transactions
  WHERE reference_id = _session_id::TEXT
    AND source = 'radio'
    AND user_id = v_user_id
    AND type = 'earn';
  
  -- Calculate new reward to add (difference between target and already awarded)
  v_new_reward := v_current_reward - v_already_awarded;
  
  -- ONLY update taler_awarded on session - DO NOT touch duration_seconds as it's GENERATED
  UPDATE radio_listening_sessions
  SET taler_awarded = v_current_reward
  WHERE id = _session_id;
  
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
    
    -- Record transaction with session ID as TEXT
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (
      v_user_id, 
      v_new_reward, 
      'earn', 
      'radio', 
      'Radio hören (' || v_tier.name || ')', 
      _session_id::TEXT
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'duration', _duration_seconds,
      'total_reward', v_current_reward,
      'new_reward', v_new_reward,
      'already_awarded', v_already_awarded,
      'tier', v_tier.name,
      'transaction_created', true
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'duration', _duration_seconds,
    'total_reward', v_current_reward,
    'new_reward', 0,
    'already_awarded', v_already_awarded,
    'transaction_created', false
  );
END;
$function$;