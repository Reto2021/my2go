-- Add streak freeze columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_freezes INTEGER NOT NULL DEFAULT 0;

-- Add system settings for streak freeze cost
INSERT INTO public.system_settings (key, value, description)
VALUES ('streak_freeze_cost', '50', 'Kosten für einen Streak-Freeze in Talern')
ON CONFLICT (key) DO NOTHING;

-- Create function to purchase streak freeze
CREATE OR REPLACE FUNCTION public.purchase_streak_freeze(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _freeze_cost INTEGER;
  _user_balance INTEGER;
  _current_freezes INTEGER;
BEGIN
  -- Get freeze cost from settings
  SELECT (value::TEXT)::INTEGER INTO _freeze_cost
  FROM public.system_settings WHERE key = 'streak_freeze_cost';
  _freeze_cost := COALESCE(_freeze_cost, 50);
  
  -- Get user balance
  SELECT taler_balance INTO _user_balance
  FROM public.get_user_balance(_user_id);
  
  -- Check if user has enough balance
  IF _user_balance < _freeze_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nicht genügend Taler',
      'required', _freeze_cost,
      'balance', _user_balance
    );
  END IF;
  
  -- Get current freezes
  SELECT streak_freezes INTO _current_freezes
  FROM public.profiles WHERE id = _user_id;
  
  -- Deduct Taler
  INSERT INTO public.transactions (user_id, amount, type, source, description)
  VALUES (_user_id, _freeze_cost, 'spend', 'system', 'Streak-Freeze gekauft');
  
  -- Add freeze to user
  UPDATE public.profiles
  SET streak_freezes = COALESCE(streak_freezes, 0) + 1
  WHERE id = _user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'freezes', COALESCE(_current_freezes, 0) + 1,
    'cost', _freeze_cost,
    'message', 'Streak-Freeze erfolgreich gekauft!'
  );
END;
$$;

-- Update the get_streak_status function to include freeze info
CREATE OR REPLACE FUNCTION public.get_streak_status(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _last_date DATE;
  _current_streak INTEGER;
  _longest_streak INTEGER;
  _streak_freezes INTEGER;
  _today DATE := CURRENT_DATE;
  _can_claim BOOLEAN;
  _streak_active BOOLEAN;
  _next_bonus INTEGER;
  _freeze_cost INTEGER;
BEGIN
  -- Get current streak info
  SELECT last_streak_date, current_streak, longest_streak, streak_freezes
  INTO _last_date, _current_streak, _longest_streak, _streak_freezes
  FROM public.profiles
  WHERE id = _user_id;

  -- Handle NULL values
  _current_streak := COALESCE(_current_streak, 0);
  _longest_streak := COALESCE(_longest_streak, 0);
  _streak_freezes := COALESCE(_streak_freezes, 0);

  -- Get freeze cost
  SELECT (value::TEXT)::INTEGER INTO _freeze_cost
  FROM public.system_settings WHERE key = 'streak_freeze_cost';
  _freeze_cost := COALESCE(_freeze_cost, 50);

  -- Check if can claim today
  _can_claim := _last_date IS NULL OR _last_date < _today;
  
  -- Check if streak is still active (claimed yesterday, today, or 2 days ago with freeze available)
  _streak_active := _last_date IS NOT NULL AND (
    _last_date >= _today - INTERVAL '1 day' OR
    (_last_date = _today - INTERVAL '2 days' AND _streak_freezes > 0)
  );

  -- Calculate what the next bonus would be
  IF _last_date = _today - INTERVAL '1 day' THEN
    _next_bonus := LEAST(5 + _current_streak, 15);
  ELSIF _last_date = _today - INTERVAL '2 days' AND _streak_freezes > 0 THEN
    -- Would use a freeze, continue streak
    _next_bonus := LEAST(5 + _current_streak, 15);
  ELSE
    _next_bonus := 5; -- Reset to base
  END IF;

  RETURN jsonb_build_object(
    'current_streak', CASE WHEN _streak_active THEN _current_streak ELSE 0 END,
    'longest_streak', _longest_streak,
    'can_claim', _can_claim,
    'streak_active', _streak_active,
    'next_bonus', _next_bonus,
    'last_claim_date', _last_date,
    'streak_freezes', _streak_freezes,
    'freeze_cost', _freeze_cost
  );
END;
$$;

-- Update the claim_daily_streak function to use freezes
CREATE OR REPLACE FUNCTION public.claim_daily_streak(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _last_date DATE;
  _current_streak INTEGER;
  _longest_streak INTEGER;
  _streak_freezes INTEGER;
  _today DATE := CURRENT_DATE;
  _bonus INTEGER;
  _new_streak INTEGER;
  _used_freeze BOOLEAN := false;
  _badge RECORD;
BEGIN
  -- Get current streak info
  SELECT last_streak_date, current_streak, longest_streak, streak_freezes
  INTO _last_date, _current_streak, _longest_streak, _streak_freezes
  FROM public.profiles
  WHERE id = _user_id;

  -- Handle NULL values
  _current_streak := COALESCE(_current_streak, 0);
  _longest_streak := COALESCE(_longest_streak, 0);
  _streak_freezes := COALESCE(_streak_freezes, 0);

  -- Check if already claimed today
  IF _last_date = _today THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_claimed', true,
      'current_streak', _current_streak,
      'bonus', 0,
      'message', 'Bereits heute beansprucht'
    );
  END IF;

  -- Calculate new streak
  IF _last_date = _today - INTERVAL '1 day' THEN
    -- Continue streak (claimed yesterday)
    _new_streak := _current_streak + 1;
  ELSIF _last_date = _today - INTERVAL '2 days' AND _streak_freezes > 0 THEN
    -- Use a freeze to save the streak (missed yesterday but have freeze)
    _new_streak := _current_streak + 1;
    _used_freeze := true;
    -- Deduct freeze
    UPDATE public.profiles
    SET streak_freezes = streak_freezes - 1
    WHERE id = _user_id;
  ELSE
    -- Reset streak (missed more than one day or no freeze available)
    _new_streak := 1;
  END IF;

  -- Calculate bonus based on streak
  -- Base: 5 Taler, +1 for each day up to max 15
  _bonus := LEAST(5 + (_new_streak - 1), 15);

  -- Update longest streak if needed
  IF _new_streak > _longest_streak THEN
    _longest_streak := _new_streak;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET 
    current_streak = _new_streak,
    longest_streak = _longest_streak,
    last_streak_date = _today
  WHERE id = _user_id;

  -- Award bonus Taler
  INSERT INTO public.transactions (user_id, amount, type, source, description)
  VALUES (_user_id, _bonus, 'earn', 'bonus', 'Täglicher Streak-Bonus (Tag ' || _new_streak || ')' || 
    CASE WHEN _used_freeze THEN ' - Freeze verwendet' ELSE '' END);

  -- Check and award streak badges
  FOR _badge IN 
    SELECT * FROM public.badges 
    WHERE category = 'streak' 
      AND is_active = true
      AND criteria_value <= _new_streak
      AND id NOT IN (SELECT badge_id FROM public.user_badges WHERE user_id = _user_id)
  LOOP
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (_user_id, _badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'current_streak', _new_streak,
    'longest_streak', _longest_streak,
    'bonus', _bonus,
    'used_freeze', _used_freeze,
    'freezes_remaining', CASE WHEN _used_freeze THEN _streak_freezes - 1 ELSE _streak_freezes END,
    'message', CASE WHEN _used_freeze 
      THEN 'Streak gerettet mit Freeze! Bonus erhalten!' 
      ELSE 'Streak-Bonus erhalten!' 
    END
  );
END;
$$;