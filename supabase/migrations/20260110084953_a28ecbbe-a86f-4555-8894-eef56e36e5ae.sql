
-- Add leaderboard fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS leaderboard_nickname TEXT,
ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT false;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard ON public.profiles(show_on_leaderboard) WHERE show_on_leaderboard = true;

-- Function to get weekly leaderboard
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  rank BIGINT,
  nickname TEXT,
  weekly_earned INTEGER,
  avatar_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.amount), 0) DESC) as rank,
    p.leaderboard_nickname as nickname,
    COALESCE(SUM(t.amount), 0)::INTEGER as weekly_earned,
    p.avatar_url
  FROM public.profiles p
  LEFT JOIN public.transactions t ON t.user_id = p.id 
    AND t.type = 'earn'
    AND t.created_at >= date_trunc('week', CURRENT_TIMESTAMP)
  WHERE p.show_on_leaderboard = true
    AND p.leaderboard_nickname IS NOT NULL
    AND p.leaderboard_nickname != ''
  GROUP BY p.id, p.leaderboard_nickname, p.avatar_url
  HAVING COALESCE(SUM(t.amount), 0) > 0
  ORDER BY weekly_earned DESC
  LIMIT _limit
$$;

-- Function to get user's own rank
CREATE OR REPLACE FUNCTION public.get_user_weekly_rank(_user_id UUID)
RETURNS TABLE(
  rank BIGINT,
  weekly_earned INTEGER,
  is_participating BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH weekly_stats AS (
    SELECT 
      p.id,
      p.show_on_leaderboard,
      p.leaderboard_nickname,
      COALESCE(SUM(t.amount), 0)::INTEGER as weekly_earned
    FROM public.profiles p
    LEFT JOIN public.transactions t ON t.user_id = p.id 
      AND t.type = 'earn'
      AND t.created_at >= date_trunc('week', CURRENT_TIMESTAMP)
    WHERE p.show_on_leaderboard = true
      AND p.leaderboard_nickname IS NOT NULL
      AND p.leaderboard_nickname != ''
    GROUP BY p.id
  ),
  ranked AS (
    SELECT 
      id,
      weekly_earned,
      ROW_NUMBER() OVER (ORDER BY weekly_earned DESC) as rank
    FROM weekly_stats
    WHERE weekly_earned > 0
  ),
  user_participation AS (
    SELECT 
      show_on_leaderboard,
      leaderboard_nickname IS NOT NULL AND leaderboard_nickname != '' as has_nickname
    FROM public.profiles
    WHERE id = _user_id
  )
  SELECT 
    r.rank,
    COALESCE(r.weekly_earned, 0)::INTEGER,
    (up.show_on_leaderboard AND up.has_nickname)::BOOLEAN as is_participating
  FROM user_participation up
  LEFT JOIN ranked r ON r.id = _user_id
$$;
