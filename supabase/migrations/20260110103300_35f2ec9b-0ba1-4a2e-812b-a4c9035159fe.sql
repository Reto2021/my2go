-- Create table for radio listening sessions
CREATE TABLE public.radio_listening_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER 
    ELSE NULL END
  ) STORED,
  rewarded BOOLEAN NOT NULL DEFAULT false,
  taler_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for radio listening tiers
CREATE TABLE public.radio_listening_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_duration_seconds INTEGER NOT NULL,
  taler_reward INTEGER NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user listening stats (aggregated)
CREATE TABLE public.user_listening_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_taler_earned INTEGER NOT NULL DEFAULT 0,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  last_session_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.radio_listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_listening_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_listening_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for radio_listening_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.radio_listening_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.radio_listening_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.radio_listening_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for radio_listening_tiers (everyone can read)
CREATE POLICY "Anyone can view active tiers" 
ON public.radio_listening_tiers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage tiers" 
ON public.radio_listening_tiers 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_listening_stats
CREATE POLICY "Users can view their own stats" 
ON public.user_listening_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" 
ON public.user_listening_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" 
ON public.user_listening_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert default tiers
INSERT INTO public.radio_listening_tiers (name, min_duration_seconds, taler_reward, description, sort_order) VALUES
('Kurzhörer', 60, 1, 'Mindestens 1 Minute Radio hören', 1),
('Casual Listener', 300, 3, 'Mindestens 5 Minuten Radio hören', 2),
('Musikfan', 900, 5, 'Mindestens 15 Minuten Radio hören', 3),
('Radiokenner', 1800, 10, 'Mindestens 30 Minuten Radio hören', 4),
('Dauerhörer', 3600, 20, 'Mindestens 1 Stunde Radio hören', 5),
('Super Fan', 7200, 35, 'Mindestens 2 Stunden Radio hören', 6);

-- Function to end a listening session and award Taler
CREATE OR REPLACE FUNCTION public.end_listening_session(_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _session RECORD;
  _duration INTEGER;
  _tier RECORD;
  _reward INTEGER := 0;
  _user_id UUID;
BEGIN
  -- Get session
  SELECT * INTO _session FROM public.radio_listening_sessions WHERE id = _session_id;
  
  IF _session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  IF _session.ended_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session already ended');
  END IF;
  
  _user_id := _session.user_id;
  
  -- Update session with end time
  UPDATE public.radio_listening_sessions 
  SET ended_at = now()
  WHERE id = _session_id;
  
  -- Calculate duration
  _duration := EXTRACT(EPOCH FROM (now() - _session.started_at))::INTEGER;
  
  -- Check minimum duration (60 seconds)
  IF _duration < 60 THEN
    RETURN jsonb_build_object(
      'success', true, 
      'duration', _duration,
      'reward', 0,
      'message', 'Mindestens 60 Sekunden für Belohnung nötig'
    );
  END IF;
  
  -- Find highest applicable tier
  SELECT * INTO _tier 
  FROM public.radio_listening_tiers 
  WHERE is_active = true AND min_duration_seconds <= _duration
  ORDER BY min_duration_seconds DESC
  LIMIT 1;
  
  IF _tier IS NOT NULL THEN
    _reward := _tier.taler_reward;
    
    -- Mark session as rewarded
    UPDATE public.radio_listening_sessions 
    SET rewarded = true, taler_awarded = _reward
    WHERE id = _session_id;
    
    -- Award Taler
    INSERT INTO public.transactions (user_id, amount, type, source, description, reference_id)
    VALUES (_user_id, _reward, 'earn', 'bonus', 'Radio-Hörbonus: ' || _tier.name, _session_id);
    
    -- Update user listening stats
    INSERT INTO public.user_listening_stats (user_id, total_duration_seconds, total_sessions, total_taler_earned, last_session_date)
    VALUES (_user_id, _duration, 1, _reward, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
      total_duration_seconds = user_listening_stats.total_duration_seconds + _duration,
      total_sessions = user_listening_stats.total_sessions + 1,
      total_taler_earned = user_listening_stats.total_taler_earned + _reward,
      last_session_date = CURRENT_DATE,
      updated_at = now();
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'duration', _duration,
    'reward', _reward,
    'tier', _tier.name,
    'message', CASE WHEN _reward > 0 THEN 'Du hast ' || _reward || ' Taler verdient!' ELSE 'Session beendet' END
  );
END;
$$;

-- Function to start a listening session
CREATE OR REPLACE FUNCTION public.start_listening_session(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _session_id UUID;
BEGIN
  -- End any open sessions for this user
  UPDATE public.radio_listening_sessions 
  SET ended_at = now()
  WHERE user_id = _user_id AND ended_at IS NULL;
  
  -- Create new session
  INSERT INTO public.radio_listening_sessions (user_id)
  VALUES (_user_id)
  RETURNING id INTO _session_id;
  
  RETURN _session_id;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_listening_sessions_user ON public.radio_listening_sessions(user_id);
CREATE INDEX idx_listening_sessions_started ON public.radio_listening_sessions(started_at);
CREATE INDEX idx_listening_sessions_open ON public.radio_listening_sessions(user_id, ended_at) WHERE ended_at IS NULL;