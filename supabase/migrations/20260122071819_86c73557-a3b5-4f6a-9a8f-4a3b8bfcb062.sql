-- Drop and recreate save_session_progress to NOT update duration_seconds (it's a generated column)
CREATE OR REPLACE FUNCTION public.save_session_progress(
  _session_id UUID,
  _duration_seconds INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session radio_listening_sessions%ROWTYPE;
  v_user_id UUID;
  v_current_reward INTEGER := 0;
  v_previous_reward INTEGER := 0;
  v_new_reward INTEGER := 0;
  v_tier radio_listening_tiers%ROWTYPE;
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
  
  -- Update session with total reward so far (NOT duration_seconds - it's generated!)
  UPDATE radio_listening_sessions
  SET taler_awarded = v_current_reward
  WHERE id = _session_id;
  
  -- If there's new reward to give, add it
  IF v_new_reward > 0 THEN
    -- Add Taler to batch using date properly
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
    
    -- Record transaction
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (v_user_id, v_new_reward, 'earn', 'radio', 'Radio hören (Zwischenspeicherung)', _session_id::text);
    
    RETURN jsonb_build_object(
      'success', true,
      'duration', _duration_seconds,
      'total_reward', v_current_reward,
      'new_reward', v_new_reward,
      'tier', v_tier.name
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'duration', _duration_seconds,
    'total_reward', v_current_reward,
    'new_reward', 0
  );
END;
$$;