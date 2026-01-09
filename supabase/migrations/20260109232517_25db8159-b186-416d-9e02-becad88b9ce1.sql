-- Add referral tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Create referrals table to track all referral events
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referrer_bonus INTEGER NOT NULL DEFAULT 25,
  referred_bonus INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view own referrals as referrer"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view own referral as referred"
ON public.referrals
FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "Admins can manage all referrals"
ON public.referrals
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Add referral bonus settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('referral_bonus_referrer', '25', 'Taler-Bonus für den Werber'),
  ('referral_bonus_referred', '25', 'Taler-Bonus für den Geworbenen'),
  ('referral_enabled', 'true', 'Empfehlungsprogramm aktiviert')
ON CONFLICT (key) DO NOTHING;

-- Function to process referral when user signs up with referral code
CREATE OR REPLACE FUNCTION public.process_referral(
  _referred_user_id UUID,
  _referral_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referrer_id UUID;
  _referrer_bonus INTEGER;
  _referred_bonus INTEGER;
  _is_enabled BOOLEAN;
BEGIN
  -- Check if referral program is enabled
  SELECT (value::TEXT)::BOOLEAN INTO _is_enabled
  FROM public.system_settings WHERE key = 'referral_enabled';
  
  IF NOT COALESCE(_is_enabled, true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral program is disabled');
  END IF;
  
  -- Find referrer by their permanent code
  SELECT uc.user_id INTO _referrer_id
  FROM public.user_codes uc
  WHERE uc.permanent_code = _referral_code
    AND uc.is_active = true;
  
  IF _referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  -- Prevent self-referral
  IF _referrer_id = _referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;
  
  -- Check if user was already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = _referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;
  
  -- Get bonus amounts from settings
  SELECT (value::TEXT)::INTEGER INTO _referrer_bonus
  FROM public.system_settings WHERE key = 'referral_bonus_referrer';
  _referrer_bonus := COALESCE(_referrer_bonus, 25);
  
  SELECT (value::TEXT)::INTEGER INTO _referred_bonus
  FROM public.system_settings WHERE key = 'referral_bonus_referred';
  _referred_bonus := COALESCE(_referred_bonus, 25);
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referrer_bonus, referred_bonus)
  VALUES (_referrer_id, _referred_user_id, _referrer_bonus, _referred_bonus);
  
  -- Update profiles
  UPDATE public.profiles SET referred_by = _referrer_id WHERE id = _referred_user_id;
  UPDATE public.profiles SET referral_count = referral_count + 1 WHERE id = _referrer_id;
  
  -- Award bonus to referrer
  INSERT INTO public.transactions (user_id, amount, type, source, description, reference_id)
  VALUES (_referrer_id, _referrer_bonus, 'earn', 'referral', 'Empfehlungsbonus', _referred_user_id);
  
  -- Award bonus to referred user
  INSERT INTO public.transactions (user_id, amount, type, source, description, reference_id)
  VALUES (_referred_user_id, _referred_bonus, 'earn', 'referral', 'Willkommensbonus durch Empfehlung', _referrer_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'referrer_bonus', _referrer_bonus,
    'referred_bonus', _referred_bonus
  );
END;
$$;