
-- Add leaderboard badges
INSERT INTO public.badges (slug, name, description, icon, color, category, criteria_type, criteria_value, sort_order) VALUES
('leaderboard_bronze', 'Bronze Champion', 'Erreiche Platz 3 im Wochen-Leaderboard', 'medal', '#CD7F32', 'leaderboard', 'leaderboard_rank', 3, 30),
('leaderboard_silver', 'Silber Champion', 'Erreiche Platz 2 im Wochen-Leaderboard', 'medal', '#C0C0C0', 'leaderboard', 'leaderboard_rank', 2, 31),
('leaderboard_gold', 'Gold Champion', 'Erreiche Platz 1 im Wochen-Leaderboard', 'crown', '#FFD700', 'leaderboard', 'leaderboard_rank', 1, 32);

-- Function to award leaderboard badges at end of week
CREATE OR REPLACE FUNCTION public.award_leaderboard_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _gold_badge_id UUID;
  _silver_badge_id UUID;
  _bronze_badge_id UUID;
  _top_user RECORD;
BEGIN
  -- Get badge IDs
  SELECT id INTO _gold_badge_id FROM public.badges WHERE slug = 'leaderboard_gold';
  SELECT id INTO _silver_badge_id FROM public.badges WHERE slug = 'leaderboard_silver';
  SELECT id INTO _bronze_badge_id FROM public.badges WHERE slug = 'leaderboard_bronze';

  -- Get top 3 from current week
  FOR _top_user IN
    SELECT 
      p.id as user_id,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.amount), 0) DESC) as rank
    FROM public.profiles p
    LEFT JOIN public.transactions t ON t.user_id = p.id 
      AND t.type = 'earn'
      AND t.created_at >= date_trunc('week', CURRENT_TIMESTAMP)
    WHERE p.show_on_leaderboard = true
      AND p.leaderboard_nickname IS NOT NULL
      AND p.leaderboard_nickname != ''
    GROUP BY p.id
    HAVING COALESCE(SUM(t.amount), 0) > 0
    ORDER BY COALESCE(SUM(t.amount), 0) DESC
    LIMIT 3
  LOOP
    -- Award appropriate badge
    IF _top_user.rank = 1 AND _gold_badge_id IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (_top_user.user_id, _gold_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    ELSIF _top_user.rank = 2 AND _silver_badge_id IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (_top_user.user_id, _silver_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    ELSIF _top_user.rank = 3 AND _bronze_badge_id IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (_top_user.user_id, _bronze_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Function to check if current user qualifies for leaderboard badge (can be called on page view)
CREATE OR REPLACE FUNCTION public.check_leaderboard_badge_for_user(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_rank INTEGER;
  _badge_id UUID;
  _badge_slug TEXT;
BEGIN
  -- Check if user is participating
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
      AND show_on_leaderboard = true 
      AND leaderboard_nickname IS NOT NULL 
      AND leaderboard_nickname != ''
  ) THEN
    RETURN;
  END IF;

  -- Get user's current rank
  WITH ranked AS (
    SELECT 
      p.id,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.amount), 0) DESC) as rank
    FROM public.profiles p
    LEFT JOIN public.transactions t ON t.user_id = p.id 
      AND t.type = 'earn'
      AND t.created_at >= date_trunc('week', CURRENT_TIMESTAMP)
    WHERE p.show_on_leaderboard = true
      AND p.leaderboard_nickname IS NOT NULL
      AND p.leaderboard_nickname != ''
    GROUP BY p.id
    HAVING COALESCE(SUM(t.amount), 0) > 0
  )
  SELECT rank INTO _user_rank FROM ranked WHERE id = _user_id;

  -- Award badge based on rank
  IF _user_rank = 1 THEN
    _badge_slug := 'leaderboard_gold';
  ELSIF _user_rank = 2 THEN
    _badge_slug := 'leaderboard_silver';
  ELSIF _user_rank = 3 THEN
    _badge_slug := 'leaderboard_bronze';
  ELSE
    RETURN;
  END IF;

  -- Get badge ID and award
  SELECT id INTO _badge_id FROM public.badges WHERE slug = _badge_slug;
  
  IF _badge_id IS NOT NULL THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (_user_id, _badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
END;
$$;
