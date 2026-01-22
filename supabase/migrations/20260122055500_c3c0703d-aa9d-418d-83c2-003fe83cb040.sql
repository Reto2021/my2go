-- Function to save session progress and calculate intermediate rewards
CREATE OR REPLACE FUNCTION public.save_session_progress(
  _session_id UUID,
  _duration_seconds INTEGER
)
RETURNS JSONB
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
  
  -- Update session with current duration and total reward so far
  UPDATE radio_listening_sessions
  SET duration_seconds = _duration_seconds,
      taler_awarded = v_current_reward
  WHERE id = _session_id;
  
  -- If there's new reward to give, add it
  IF v_new_reward > 0 THEN
    -- Add Taler to batch
    PERFORM add_taler_to_batch(v_user_id, v_new_reward);
    
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

-- Update end_listening_session to not double-count already awarded Taler
CREATE OR REPLACE FUNCTION public.end_listening_session(_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session radio_listening_sessions%ROWTYPE;
  v_user_id UUID;
  v_duration INTEGER;
  v_final_reward INTEGER := 0;
  v_already_awarded INTEGER := 0;
  v_additional_reward INTEGER := 0;
  v_tier radio_listening_tiers%ROWTYPE;
BEGIN
  -- Get and lock the session
  SELECT * INTO v_session
  FROM radio_listening_sessions
  WHERE id = _session_id
  FOR UPDATE;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Session not found');
  END IF;
  
  -- Check if already ended
  IF v_session.ended_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Session already ended',
      'duration', v_session.duration_seconds,
      'reward', COALESCE(v_session.taler_awarded, 0)
    );
  END IF;
  
  v_user_id := v_session.user_id;
  v_already_awarded := COALESCE(v_session.taler_awarded, 0);
  
  -- Calculate final duration
  v_duration := GREATEST(
    COALESCE(v_session.duration_seconds, 0),
    EXTRACT(EPOCH FROM (now() - v_session.started_at))::INTEGER
  );
  
  -- Get the highest tier reached
  SELECT * INTO v_tier
  FROM radio_listening_tiers
  WHERE is_active = true AND min_duration_seconds <= v_duration
  ORDER BY min_duration_seconds DESC
  LIMIT 1;
  
  IF v_tier IS NOT NULL THEN
    v_final_reward := v_tier.taler_reward;
  END IF;
  
  -- Calculate additional reward (final - already awarded)
  v_additional_reward := GREATEST(0, v_final_reward - v_already_awarded);
  
  -- Mark session as ended
  UPDATE radio_listening_sessions
  SET ended_at = now(),
      duration_seconds = v_duration,
      rewarded = true,
      taler_awarded = v_final_reward
  WHERE id = _session_id;
  
  -- Only add additional Taler if any
  IF v_additional_reward > 0 THEN
    PERFORM add_taler_to_batch(v_user_id, v_additional_reward);
    
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (v_user_id, v_additional_reward, 'earn', 'radio', 'Radio Session beendet', _session_id::text);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'duration', v_duration,
    'reward', v_final_reward,
    'tier', v_tier.name,
    'message', 'Session ended successfully'
  );
END;
$$;