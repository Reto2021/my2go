-- Create a function to recover/close all orphaned sessions for a user
-- This should be called when the user logs in or the app loads
CREATE OR REPLACE FUNCTION public.recover_orphaned_sessions(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      -- Check if transaction already exists
      IF NOT EXISTS (
        SELECT 1 FROM transactions 
        WHERE reference_id = _session.id 
          AND source = 'radio'
      ) THEN
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
$$;