-- Create promo_codes table for admin-managed discount codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'amount')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('plus_monthly', 'plus_yearly', 'all')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can read active codes (for validation)
CREATE POLICY "Anyone can read active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Create gift_codes table for gifted subscriptions
CREATE TABLE public.gift_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  gift_type TEXT NOT NULL CHECK (gift_type IN ('monthly', 'yearly')),
  purchaser_id UUID REFERENCES auth.users(id) NOT NULL,
  purchaser_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'redeemed', 'expired')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 days')
);

-- Enable RLS
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

-- Purchasers can view their own gifts
CREATE POLICY "Users can view their purchased gifts"
ON public.gift_codes
FOR SELECT
USING (purchaser_id = auth.uid());

-- Users can view gifts sent to their email
CREATE POLICY "Users can view gifts sent to them"
ON public.gift_codes
FOR SELECT
USING (
  recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'paid'
);

-- Admins can manage all gifts
CREATE POLICY "Admins can manage gift codes"
ON public.gift_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to validate and apply promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _promo promo_codes;
  _result JSON;
BEGIN
  SELECT * INTO _promo
  FROM promo_codes
  WHERE code = UPPER(_code)
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND valid_from <= now()
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF _promo IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Ungültiger oder abgelaufener Code');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'discount_type', _promo.discount_type,
    'discount_value', _promo.discount_value,
    'applies_to', _promo.applies_to
  );
END;
$$;

-- Function to use promo code (increment usage)
CREATE OR REPLACE FUNCTION public.use_promo_code(_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE code = UPPER(_code)
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  RETURN FOUND;
END;
$$;