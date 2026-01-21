-- ============================================================================
-- CUSTOM RADIO STATIONS FEATURE
-- ============================================================================

-- 1. Create table for user's favorite radio stations
CREATE TABLE public.user_radio_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_uuid TEXT NOT NULL, -- radio-browser.info station UUID
  station_name TEXT NOT NULL,
  station_url TEXT NOT NULL,
  station_favicon TEXT,
  station_country TEXT,
  station_tags TEXT[],
  station_homepage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, station_uuid)
);

-- Enable RLS
ALTER TABLE public.user_radio_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own favorites" 
ON public.user_radio_favorites FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" 
ON public.user_radio_favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_radio_favorites FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Add stream tracking to radio_listening_sessions
ALTER TABLE public.radio_listening_sessions 
ADD COLUMN IF NOT EXISTS stream_type TEXT NOT NULL DEFAULT 'radio2go',
ADD COLUMN IF NOT EXISTS external_station_name TEXT,
ADD COLUMN IF NOT EXISTS external_station_uuid TEXT;

-- 3. Add taler_multiplier to radio_listening_tiers (default 1.0 for Radio 2Go, 0.5 for external)
-- This is used for display purposes, actual calculation will be in code
COMMENT ON TABLE public.radio_listening_sessions IS 'Tracks user radio listening sessions. stream_type: radio2go (full rewards) or external (50% rewards)';

-- 4. Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_sessions_stream_type ON public.radio_listening_sessions(stream_type);
CREATE INDEX IF NOT EXISTS idx_sessions_external_station ON public.radio_listening_sessions(external_station_name) WHERE external_station_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.user_radio_favorites(user_id);

-- 5. Update the start_listening_session function to accept stream info
CREATE OR REPLACE FUNCTION public.start_listening_session(
  _user_id UUID,
  _stream_type TEXT DEFAULT 'radio2go',
  _station_name TEXT DEFAULT NULL,
  _station_uuid TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session_id UUID;
BEGIN
  INSERT INTO radio_listening_sessions (user_id, started_at, stream_type, external_station_name, external_station_uuid)
  VALUES (_user_id, NOW(), COALESCE(_stream_type, 'radio2go'), _station_name, _station_uuid)
  RETURNING id INTO _session_id;
  
  RETURN _session_id;
END;
$$;

-- 6. Update end_listening_session to apply 50% reward for external streams
CREATE OR REPLACE FUNCTION public.end_listening_session(_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session RECORD;
  _duration INTEGER;
  _reward INTEGER := 0;
  _tier_name TEXT;
  _multiplier NUMERIC := 1.0;
BEGIN
  -- Get session details
  SELECT * INTO _session FROM radio_listening_sessions WHERE id = _session_id;
  
  IF _session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Session not found');
  END IF;
  
  IF _session.ended_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Session already ended');
  END IF;
  
  -- Calculate duration
  _duration := EXTRACT(EPOCH FROM (NOW() - _session.started_at))::INTEGER;
  
  -- Apply 50% multiplier for external streams
  IF _session.stream_type != 'radio2go' THEN
    _multiplier := 0.5;
  END IF;
  
  -- Find the highest tier reached
  SELECT name, taler_reward INTO _tier_name, _reward
  FROM radio_listening_tiers
  WHERE is_active = true 
    AND min_duration_seconds <= _duration
  ORDER BY min_duration_seconds DESC
  LIMIT 1;
  
  -- Apply multiplier and round down
  _reward := FLOOR(_reward * _multiplier);
  
  -- Update session
  UPDATE radio_listening_sessions
  SET ended_at = NOW(),
      duration_seconds = _duration,
      rewarded = (_reward > 0),
      taler_awarded = _reward
  WHERE id = _session_id;
  
  -- Award Taler if earned
  IF _reward > 0 THEN
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (
      _session.user_id, 
      _reward, 
      'earn', 
      'radio',
      CASE WHEN _session.stream_type = 'radio2go' 
        THEN 'Radio 2Go gehört' 
        ELSE 'Radio gehört: ' || COALESCE(_session.external_station_name, 'Externer Sender')
      END,
      _session_id
    );
    
    -- Update or create monthly batch
    INSERT INTO taler_monthly_batches (user_id, earn_month, expires_at, amount_earned)
    VALUES (
      _session.user_id,
      to_char(NOW(), 'YYYY-MM'),
      NOW() + INTERVAL '6 months',
      _reward
    )
    ON CONFLICT (user_id, earn_month) 
    DO UPDATE SET amount_earned = taler_monthly_batches.amount_earned + _reward,
                  updated_at = NOW();
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'duration', _duration,
    'reward', _reward,
    'tier', _tier_name,
    'multiplier', _multiplier,
    'stream_type', _session.stream_type,
    'message', CASE 
      WHEN _reward > 0 THEN 'Session completed with reward'
      ELSE 'Session completed, no reward earned'
    END
  );
END;
$$;