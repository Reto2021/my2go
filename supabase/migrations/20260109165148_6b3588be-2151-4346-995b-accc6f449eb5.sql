-- ============================================================================
-- 2GO TALER HUB - COMPLETE DATABASE SCHEMA
-- ============================================================================

-- 1. ENUMS
-- ============================================================================

CREATE TYPE public.user_role AS ENUM ('user', 'partner_admin', 'admin');
CREATE TYPE public.transaction_type AS ENUM ('earn', 'spend', 'expire', 'adjust');
CREATE TYPE public.transaction_source AS ENUM (
  'signup_bonus', 
  'air_drop', 
  'partner_visit', 
  'partner_purchase', 
  'bonus', 
  'reward_redemption', 
  'system',
  'referral'
);
CREATE TYPE public.reward_type AS ENUM (
  'fixed_discount', 
  'percent_discount', 
  'free_item', 
  'topup_bonus', 
  'experience'
);
CREATE TYPE public.redemption_status AS ENUM ('pending', 'used', 'expired', 'cancelled');
CREATE TYPE public.partner_admin_role AS ENUM ('owner', 'manager', 'staff');

-- 2. PROFILES (extends auth.users)
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  birth_date DATE,
  postal_code TEXT,
  city TEXT,
  avatar_url TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  marketing_consent_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES (separate table for security)
-- ============================================================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. USER CODES (permanent QR code for each user)
-- ============================================================================

CREATE TABLE public.user_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  permanent_code TEXT NOT NULL UNIQUE,
  qr_payload TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_codes ENABLE ROW LEVEL SECURITY;

-- 5. TRANSACTIONS (ledger-based, immutable)
-- ============================================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID,
  amount INTEGER NOT NULL,
  type public.transaction_type NOT NULL,
  source public.transaction_source NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 6. REGIONS
-- ============================================================================

CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  radius_km INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- 7. PARTNERS
-- ============================================================================

CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  legal_name TEXT,
  description TEXT,
  short_description TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  address_street TEXT,
  address_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'CH',
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  logo_url TEXT,
  cover_image_url TEXT,
  brand_color TEXT,
  category TEXT,
  tags TEXT[],
  opening_hours JSONB,
  special_hours JSONB,
  contract_start DATE,
  contract_end DATE,
  commission_percent NUMERIC(5, 2),
  billing_email TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Add partner_id FK to transactions
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_partner_id_fkey 
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;

-- 8. PARTNER ADMINS
-- ============================================================================

CREATE TABLE public.partner_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.partner_admin_role NOT NULL DEFAULT 'staff',
  can_manage_rewards BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_confirm_redemptions BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(partner_id, user_id)
);

ALTER TABLE public.partner_admins ENABLE ROW LEVEL SECURITY;

-- 9. REWARDS
-- ============================================================================

CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  reward_type public.reward_type NOT NULL DEFAULT 'fixed_discount',
  taler_cost INTEGER NOT NULL,
  value_amount INTEGER,
  value_percent INTEGER,
  stock_total INTEGER,
  stock_remaining INTEGER,
  terms TEXT,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- 10. REDEMPTIONS
-- ============================================================================

CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  redemption_code TEXT NOT NULL UNIQUE,
  qr_payload TEXT,
  status public.redemption_status NOT NULL DEFAULT 'pending',
  taler_spent INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- 11. AIR DROP CODES
-- ============================================================================

CREATE TABLE public.air_drop_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  taler_value INTEGER NOT NULL,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  max_claims INTEGER DEFAULT 1,
  current_claims INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.air_drop_codes ENABLE ROW LEVEL SECURITY;

-- 12. CODE CLAIMS
-- ============================================================================

CREATE TABLE public.code_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.air_drop_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taler_awarded INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(code_id, user_id)
);

ALTER TABLE public.code_claims ENABLE ROW LEVEL SECURITY;

-- 13. WALLET PASSES
-- ============================================================================

CREATE TABLE public.wallet_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  apple_pass_serial TEXT UNIQUE,
  apple_pass_auth_token TEXT,
  google_pass_object_id TEXT UNIQUE,
  pass_url TEXT,
  last_synced_balance INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.wallet_passes ENABLE ROW LEVEL SECURITY;

-- 14. SYSTEM SETTINGS (for admin configuration)
-- ============================================================================

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('signup_bonus_amount', '50', 'Taler awarded on signup'),
  ('signup_bonus_enabled', 'true', 'Whether signup bonus is active'),
  ('redemption_expiry_hours', '24', 'Hours until redemption code expires');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is partner admin for a specific partner
CREATE OR REPLACE FUNCTION public.is_partner_admin(_user_id UUID, _partner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partner_admins
    WHERE user_id = _user_id
      AND partner_id = _partner_id
  )
$$;

-- Function to get user balance from transactions
CREATE OR REPLACE FUNCTION public.get_user_balance(_user_id UUID)
RETURNS TABLE(
  taler_balance INTEGER,
  lifetime_earned INTEGER,
  lifetime_spent INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN type IN ('earn', 'adjust') THEN amount ELSE -amount END), 0)::INTEGER AS taler_balance,
    COALESCE(SUM(CASE WHEN type = 'earn' THEN amount ELSE 0 END), 0)::INTEGER AS lifetime_earned,
    COALESCE(SUM(CASE WHEN type = 'spend' THEN amount ELSE 0 END), 0)::INTEGER AS lifetime_spent
  FROM public.transactions
  WHERE user_id = _user_id
$$;

-- Function to generate unique code
CREATE OR REPLACE FUNCTION public.generate_unique_code(prefix TEXT DEFAULT '2GO')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := prefix || '-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 5));
  RETURN new_code;
END;
$$;

-- Function to generate redemption code
CREATE OR REPLACE FUNCTION public.generate_redemption_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_passes_updated_at
  BEFORE UPDATE ON public.wallet_passes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  signup_bonus INTEGER;
  bonus_enabled BOOLEAN;
BEGIN
  -- Get signup bonus settings
  SELECT (value::TEXT)::INTEGER INTO signup_bonus
  FROM public.system_settings WHERE key = 'signup_bonus_amount';
  
  SELECT (value::TEXT)::BOOLEAN INTO bonus_enabled
  FROM public.system_settings WHERE key = 'signup_bonus_enabled';
  
  -- Default values if settings not found
  signup_bonus := COALESCE(signup_bonus, 50);
  bonus_enabled := COALESCE(bonus_enabled, true);

  -- 1. Create profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- 2. Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- 3. Generate permanent user code
  INSERT INTO public.user_codes (user_id, permanent_code, qr_payload)
  VALUES (
    NEW.id,
    public.generate_unique_code('2GO'),
    NEW.id::TEXT
  );
  
  -- 4. Award signup bonus if enabled
  IF bonus_enabled THEN
    INSERT INTO public.transactions (user_id, amount, type, source, description)
    VALUES (NEW.id, signup_bonus, 'earn', 'signup_bonus', 'Willkommens-Bonus');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Update last_activity on new transaction
CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_activity_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_transaction_update_activity
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- USER CODES
CREATE POLICY "Users can view own code"
  ON public.user_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Partner admins can view user codes for scanning"
  ON public.user_codes FOR SELECT
  USING (public.has_role(auth.uid(), 'partner_admin'));

-- TRANSACTIONS
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partner admins can view partner transactions"
  ON public.transactions FOR SELECT
  USING (public.is_partner_admin(auth.uid(), partner_id));

-- REGIONS (public read)
CREATE POLICY "Anyone can view regions"
  ON public.regions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage regions"
  ON public.regions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- PARTNERS (public read for active partners)
CREATE POLICY "Anyone can view active partners"
  ON public.partners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all partners"
  ON public.partners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partner admins can update own partner"
  ON public.partners FOR UPDATE
  USING (public.is_partner_admin(auth.uid(), id));

-- PARTNER ADMINS
CREATE POLICY "Partner admins can view own partner admins"
  ON public.partner_admins FOR SELECT
  USING (public.is_partner_admin(auth.uid(), partner_id) OR auth.uid() = user_id);

CREATE POLICY "Admins can manage all partner admins"
  ON public.partner_admins FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- REWARDS (public read for active rewards)
CREATE POLICY "Anyone can view active rewards"
  ON public.rewards FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until >= CURRENT_DATE));

CREATE POLICY "Admins can manage all rewards"
  ON public.rewards FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partner admins can manage own rewards"
  ON public.rewards FOR ALL
  USING (public.is_partner_admin(auth.uid(), partner_id));

-- REDEMPTIONS
CREATE POLICY "Users can view own redemptions"
  ON public.redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions"
  ON public.redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partner admins can view and update partner redemptions"
  ON public.redemptions FOR SELECT
  USING (public.is_partner_admin(auth.uid(), partner_id));

CREATE POLICY "Partner admins can update redemption status"
  ON public.redemptions FOR UPDATE
  USING (public.is_partner_admin(auth.uid(), partner_id));

CREATE POLICY "Admins can manage all redemptions"
  ON public.redemptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- AIR DROP CODES
CREATE POLICY "Admins can manage air drop codes"
  ON public.air_drop_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active codes for validation"
  ON public.air_drop_codes FOR SELECT
  USING (is_active = true AND valid_until > now());

-- CODE CLAIMS
CREATE POLICY "Users can view own claims"
  ON public.code_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own claims"
  ON public.code_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all claims"
  ON public.code_claims FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- WALLET PASSES
CREATE POLICY "Users can view own wallet pass"
  ON public.wallet_passes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wallet pass"
  ON public.wallet_passes FOR ALL
  USING (auth.uid() = user_id);

-- SYSTEM SETTINGS
CREATE POLICY "Admins can manage system settings"
  ON public.system_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read system settings"
  ON public.system_settings FOR SELECT
  USING (true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_partner_id ON public.transactions(partner_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON public.transactions(type);

CREATE INDEX idx_redemptions_user_id ON public.redemptions(user_id);
CREATE INDEX idx_redemptions_partner_id ON public.redemptions(partner_id);
CREATE INDEX idx_redemptions_status ON public.redemptions(status);
CREATE INDEX idx_redemptions_code ON public.redemptions(redemption_code);

CREATE INDEX idx_rewards_partner_id ON public.rewards(partner_id);
CREATE INDEX idx_rewards_active ON public.rewards(is_active) WHERE is_active = true;

CREATE INDEX idx_partners_active ON public.partners(is_active) WHERE is_active = true;
CREATE INDEX idx_partners_slug ON public.partners(slug);
CREATE INDEX idx_partners_city ON public.partners(city);

CREATE INDEX idx_air_drop_codes_code ON public.air_drop_codes(code);
CREATE INDEX idx_air_drop_codes_active ON public.air_drop_codes(is_active, valid_until);

CREATE INDEX idx_code_claims_user_code ON public.code_claims(user_id, code_id);

CREATE INDEX idx_user_codes_permanent ON public.user_codes(permanent_code);

CREATE INDEX idx_profiles_last_activity ON public.profiles(last_activity_at DESC);