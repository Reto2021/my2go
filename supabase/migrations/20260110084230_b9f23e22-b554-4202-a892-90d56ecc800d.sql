
-- Create badges definition table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  color TEXT NOT NULL DEFAULT '#FFD700',
  category TEXT NOT NULL DEFAULT 'general',
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  seen_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for badges
CREATE POLICY "Anyone can view active badges" 
ON public.badges 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage badges" 
ON public.badges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS policies for user_badges
CREATE POLICY "Users can view own badges" 
ON public.user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own badges (mark seen)" 
ON public.user_badges 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user badges" 
ON public.user_badges 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Insert default badges
INSERT INTO public.badges (slug, name, description, icon, color, category, criteria_type, criteria_value, sort_order) VALUES
-- Taler earning badges
('taler_starter', 'Taler Starter', 'Sammle deine ersten 50 Taler', 'coins', '#CD7F32', 'earning', 'lifetime_earned', 50, 1),
('taler_collector', 'Taler Sammler', 'Sammle 100 Taler', 'coins', '#C0C0C0', 'earning', 'lifetime_earned', 100, 2),
('taler_hunter', 'Taler Jäger', 'Sammle 250 Taler', 'coins', '#FFD700', 'earning', 'lifetime_earned', 250, 3),
('taler_master', 'Taler Meister', 'Sammle 500 Taler', 'trophy', '#E5E4E2', 'earning', 'lifetime_earned', 500, 4),
('taler_legend', 'Taler Legende', 'Sammle 1000 Taler', 'crown', '#FFD700', 'earning', 'lifetime_earned', 1000, 5),

-- Redemption badges
('first_redemption', 'Erste Einlösung', 'Löse deinen ersten Gutschein ein', 'gift', '#4CAF50', 'redemption', 'redemption_count', 1, 10),
('regular_shopper', 'Stammkunde', 'Löse 5 Gutscheine ein', 'shopping-bag', '#2196F3', 'redemption', 'redemption_count', 5, 11),
('power_shopper', 'Power Shopper', 'Löse 10 Gutscheine ein', 'shopping-cart', '#9C27B0', 'redemption', 'redemption_count', 10, 12),
('shopping_pro', 'Shopping Pro', 'Löse 25 Gutscheine ein', 'star', '#FF9800', 'redemption', 'redemption_count', 25, 13),

-- Referral badges
('first_friend', 'Erster Freund', 'Werbe deinen ersten Freund', 'user-plus', '#00BCD4', 'referral', 'referral_count', 1, 20),
('social_butterfly', 'Netzwerker', 'Werbe 5 Freunde', 'users', '#E91E63', 'referral', 'referral_count', 5, 21),
('influencer', 'Influencer', 'Werbe 10 Freunde', 'megaphone', '#673AB7', 'referral', 'referral_count', 10, 22);

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id UUID)
RETURNS SETOF public.user_badges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lifetime_earned INTEGER;
  _redemption_count INTEGER;
  _referral_count INTEGER;
  _badge RECORD;
  _new_badge public.user_badges%ROWTYPE;
BEGIN
  -- Get user stats
  SELECT COALESCE(lifetime_earned, 0) INTO _lifetime_earned
  FROM public.get_user_balance(_user_id);
  
  SELECT COUNT(*) INTO _redemption_count
  FROM public.redemptions
  WHERE user_id = _user_id AND status = 'used';
  
  SELECT COALESCE(referral_count, 0) INTO _referral_count
  FROM public.profiles
  WHERE id = _user_id;
  
  -- Check each badge
  FOR _badge IN 
    SELECT * FROM public.badges 
    WHERE is_active = true
    AND id NOT IN (SELECT badge_id FROM public.user_badges WHERE user_id = _user_id)
  LOOP
    -- Check if criteria is met
    IF (_badge.criteria_type = 'lifetime_earned' AND _lifetime_earned >= _badge.criteria_value)
       OR (_badge.criteria_type = 'redemption_count' AND _redemption_count >= _badge.criteria_value)
       OR (_badge.criteria_type = 'referral_count' AND _referral_count >= _badge.criteria_value)
    THEN
      -- Award the badge
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (_user_id, _badge.id)
      RETURNING * INTO _new_badge;
      
      RETURN NEXT _new_badge;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Trigger to check badges after transaction
CREATE OR REPLACE FUNCTION public.trigger_check_badges_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_badges_after_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_check_badges_on_transaction();

-- Trigger to check badges after redemption status change
CREATE OR REPLACE FUNCTION public.trigger_check_badges_on_redemption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'used' AND (OLD.status IS NULL OR OLD.status != 'used') THEN
    PERFORM public.check_and_award_badges(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_badges_after_redemption
AFTER INSERT OR UPDATE ON public.redemptions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_check_badges_on_redemption();
