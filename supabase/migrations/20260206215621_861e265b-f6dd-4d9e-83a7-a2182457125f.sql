
-- Add comeback_bonus_claimed_at to profiles for tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS comeback_bonus_claimed_at timestamptz;

-- Add free_streak_repair_used_at to track monthly free repair
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_streak_repair_used_at timestamptz;

-- Function: Award comeback bonus after 3+ days of inactivity
CREATE OR REPLACE FUNCTION public.claim_comeback_bonus(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_activity timestamptz;
  v_last_comeback timestamptz;
  v_days_inactive integer;
  v_bonus integer := 10;
BEGIN
  SELECT last_activity_at, comeback_bonus_claimed_at INTO v_last_activity, v_last_comeback
  FROM profiles WHERE id = _user_id;

  -- Check if already claimed comeback in last 7 days
  IF v_last_comeback IS NOT NULL AND v_last_comeback > now() - interval '7 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Willkommen-zurück-Bonus bereits erhalten');
  END IF;

  -- Check if inactive for 3+ days
  v_days_inactive := EXTRACT(DAY FROM now() - COALESCE(v_last_activity, now() - interval '30 days'));
  IF v_days_inactive < 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Noch nicht qualifiziert');
  END IF;

  -- Award bonus
  INSERT INTO transactions (user_id, amount, type, source, description)
  VALUES (_user_id, v_bonus, 'earn', 'bonus', 'Willkommen zurück! 🎉');

  -- Update profile
  UPDATE profiles SET comeback_bonus_claimed_at = now(), last_activity_at = now() WHERE id = _user_id;

  -- Add to batch
  PERFORM add_taler_to_batch(_user_id, v_bonus);

  RETURN jsonb_build_object('success', true, 'bonus', v_bonus, 'days_inactive', v_days_inactive);
END;
$$;

-- Function: Free streak repair (1x per month)
CREATE OR REPLACE FUNCTION public.use_free_streak_repair(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_repair timestamptz;
  v_current_streak integer;
BEGIN
  SELECT free_streak_repair_used_at, current_streak INTO v_last_repair, v_current_streak
  FROM profiles WHERE id = _user_id;

  -- Check if already used this month
  IF v_last_repair IS NOT NULL AND date_trunc('month', v_last_repair) = date_trunc('month', now()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gratis-Reparatur diesen Monat bereits verwendet');
  END IF;

  -- Must have a broken streak (current_streak = 0 but longest_streak > 0)
  IF v_current_streak > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deine Serie ist noch aktiv');
  END IF;

  -- Restore streak to 1
  UPDATE profiles 
  SET current_streak = 1, 
      last_streak_date = CURRENT_DATE,
      free_streak_repair_used_at = now()
  WHERE id = _user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Serie repariert! Du bist wieder bei Tag 1.');
END;
$$;
