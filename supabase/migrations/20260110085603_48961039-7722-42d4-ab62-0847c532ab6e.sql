
-- Add streak fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_date DATE;

-- Add streak badges
INSERT INTO public.badges (slug, name, description, icon, color, category, criteria_type, criteria_value, sort_order) VALUES
('streak_3', 'Fleissig', '3 Tage in Folge eingeloggt', 'flame', '#FF6B35', 'streak', 'streak_days', 3, 40),
('streak_7', 'Wochenkrieger', '7 Tage in Folge eingeloggt', 'flame', '#FF4500', 'streak', 'streak_days', 7, 41),
('streak_14', 'Zweiwochenstar', '14 Tage in Folge eingeloggt', 'zap', '#FF8C00', 'streak', 'streak_days', 14, 42),
('streak_30', 'Monatsmeister', '30 Tage in Folge eingeloggt', 'zap', '#FFD700', 'streak', 'streak_days', 30, 43);

-- Function to claim daily streak bonus
CREATE OR REPLACE FUNCTION public.claim_daily_streak(_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last_date DATE;
  _current_streak INTEGER;
  _longest_streak INTEGER;
  _today DATE := CURRENT_DATE;
  _bonus INTEGER;
  _new_streak INTEGER;
  _is_new_claim BOOLEAN := false;
  _badge RECORD;
BEGIN
  -- Get current streak info
  SELECT last_streak_date, current_streak, longest_streak
  INTO _last_date, _current_streak, _longest_streak
  FROM public.profiles
  WHERE id = _user_id;

  -- Handle NULL values
  _current_streak := COALESCE(_current_streak, 0);
  _longest_streak := COALESCE(_longest_streak, 0);

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
    -- Continue streak
    _new_streak := _current_streak + 1;
  ELSE
    -- Reset streak (missed a day or first claim)
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
  VALUES (_user_id, _bonus, 'earn', 'bonus', 'Täglicher Streak-Bonus (Tag ' || _new_streak || ')');

  _is_new_claim := true;

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
    'message', 'Streak-Bonus erhalten!'
  );
END;
$$;

-- Function to get streak status without claiming
CREATE OR REPLACE FUNCTION public.get_streak_status(_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last_date DATE;
  _current_streak INTEGER;
  _longest_streak INTEGER;
  _today DATE := CURRENT_DATE;
  _can_claim BOOLEAN;
  _streak_active BOOLEAN;
  _next_bonus INTEGER;
BEGIN
  -- Get current streak info
  SELECT last_streak_date, current_streak, longest_streak
  INTO _last_date, _current_streak, _longest_streak
  FROM public.profiles
  WHERE id = _user_id;

  -- Handle NULL values
  _current_streak := COALESCE(_current_streak, 0);
  _longest_streak := COALESCE(_longest_streak, 0);

  -- Check if can claim today
  _can_claim := _last_date IS NULL OR _last_date < _today;
  
  -- Check if streak is still active (claimed yesterday or today)
  _streak_active := _last_date IS NOT NULL AND (_last_date >= _today - INTERVAL '1 day');

  -- Calculate what the next bonus would be
  IF _last_date = _today - INTERVAL '1 day' THEN
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
    'last_claim_date', _last_date
  );
END;
$$;
