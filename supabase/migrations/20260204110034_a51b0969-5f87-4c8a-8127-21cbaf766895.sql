
-- Fix save_session_progress function: reference_id is UUID, not TEXT
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
  -- FIXED: reference_id is UUID, not TEXT - compare UUID directly
  SELECT COALESCE(SUM(amount), 0) INTO v_already_awarded
  FROM transactions
  WHERE reference_id = _session_id
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
    
    -- FIXED: Store session ID as UUID directly (reference_id is UUID type)
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (
      v_user_id, 
      v_new_reward, 
      'earn', 
      'radio', 
      'Radio hören (' || v_tier.name || ')', 
      _session_id
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

-- Also fix end_listening_session function for consistency
CREATE OR REPLACE FUNCTION public.end_listening_session(_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- FIXED: Store session ID as UUID directly (reference_id is UUID type)
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (v_user_id, v_additional_reward, 'earn', 'radio', 'Radio Session beendet', _session_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'duration', v_duration,
    'reward', v_final_reward,
    'tier', v_tier.name,
    'message', 'Session ended successfully'
  );
END;
$function$;

-- Also fix recover_orphaned_sessions function
CREATE OR REPLACE FUNCTION public.recover_orphaned_sessions(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _recovered_count INTEGER := 0;
  _total_reward INTEGER := 0;
  _session RECORD;
  _duration INTEGER;
  _reward INTEGER;
  _multiplier NUMERIC;
BEGIN
  -- Find all open sessions for this user
  FOR _session IN 
    SELECT id, started_at, stream_type, external_station_name
    FROM radio_listening_sessions 
    WHERE user_id = _user_id 
      AND ended_at IS NULL
    ORDER BY started_at DESC
  LOOP
    -- Calculate duration
    _duration := EXTRACT(EPOCH FROM (NOW() - _session.started_at))::INTEGER;
    
    -- Apply 50% multiplier for external streams
    IF _session.stream_type != 'radio2go' THEN
      _multiplier := 0.5;
    ELSE
      _multiplier := 1.0;
    END IF;
    
    -- Find the highest tier reached
    SELECT FLOOR(taler_reward * _multiplier)::INTEGER INTO _reward
    FROM radio_listening_tiers
    WHERE is_active = true 
      AND min_duration_seconds <= _duration
    ORDER BY min_duration_seconds DESC
    LIMIT 1;
    
    -- Default to 0 if no tier reached
    _reward := COALESCE(_reward, 0);
    
    -- Update session
    UPDATE radio_listening_sessions
    SET ended_at = NOW(),
        rewarded = (_reward > 0),
        taler_awarded = _reward
    WHERE id = _session.id;
    
    -- Award Taler if earned and not already credited
    IF _reward > 0 THEN
      -- Check if transaction already exists (compare UUID to UUID)
      IF NOT EXISTS (
        SELECT 1 FROM transactions 
        WHERE reference_id = _session.id 
          AND source = 'radio'
      ) THEN
        -- FIXED: Store session ID as UUID directly (reference_id is UUID type)
        INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
        VALUES (
          _user_id, 
          _reward, 
          'earn', 
          'radio',
          CASE WHEN _session.stream_type = 'radio2go' 
            THEN 'Radio 2Go gehört (nachträglich)' 
            ELSE 'Radio gehört: ' || COALESCE(_session.external_station_name, 'Externer Sender') || ' (nachträglich)'
          END,
          _session.id
        );
        
        -- Update or create monthly batch
        INSERT INTO taler_monthly_batches (user_id, earn_month, expires_at, amount_earned)
        VALUES (
          _user_id,
          to_char(NOW(), 'YYYY-MM'),
          NOW() + INTERVAL '6 months',
          _reward
        )
        ON CONFLICT (user_id, earn_month) 
        DO UPDATE SET amount_earned = taler_monthly_batches.amount_earned + _reward,
                      updated_at = NOW();
        
        _total_reward := _total_reward + _reward;
      END IF;
    END IF;
    
    _recovered_count := _recovered_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'recovered_sessions', _recovered_count,
    'total_reward', _total_reward,
    'message', CASE 
      WHEN _recovered_count > 0 THEN 'Recovered ' || _recovered_count || ' orphaned sessions'
      ELSE 'No orphaned sessions found'
    END
  );
END;
$function$;
