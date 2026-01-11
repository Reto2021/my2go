-- =====================================================
-- SECURITY HARDENING MIGRATION
-- 1. Separate public from internal system settings
-- 2. Restrict push_subscriptions access
-- 3. Create secure view for public partner data
-- =====================================================

-- 1. Add category column to system_settings to distinguish public vs internal
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Mark public-facing settings
UPDATE public.system_settings 
SET is_public = true 
WHERE key IN ('signup_bonus', 'referral_bonus_referrer', 'referral_bonus_referred');

-- Mark sensitive/internal settings as private
UPDATE public.system_settings 
SET is_public = false 
WHERE key NOT IN ('signup_bonus', 'referral_bonus_referrer', 'referral_bonus_referred');

-- 2. Drop the overly permissive system_settings policy and create a more restrictive one
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;

CREATE POLICY "Anyone can read public system settings"
ON public.system_settings
FOR SELECT
USING (is_public = true OR has_role(auth.uid(), 'admin'::user_role));

-- 3. Fix push_subscriptions - the "service role" policy is too broad
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can read all subscriptions" ON public.push_subscriptions;

-- Service role already bypasses RLS, so we don't need an explicit policy for it
-- The existing user-specific policies are sufficient

-- 4. Create a secure function to get public partner data without sensitive fields
CREATE OR REPLACE FUNCTION public.get_public_partners_safe()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  short_description text,
  description text,
  category text,
  logo_url text,
  cover_image_url text,
  brand_color text,
  address_street text,
  address_number text,
  postal_code text,
  city text,
  country text,
  lat numeric,
  lng numeric,
  opening_hours jsonb,
  special_hours jsonb,
  website text,
  instagram text,
  facebook text,
  google_rating numeric,
  google_review_count integer,
  google_place_id text,
  is_featured boolean,
  tags text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.category,
    p.logo_url,
    p.cover_image_url,
    p.brand_color,
    p.address_street,
    p.address_number,
    p.postal_code,
    p.city,
    p.country,
    p.lat,
    p.lng,
    p.opening_hours,
    p.special_hours,
    p.website,
    p.instagram,
    p.facebook,
    p.google_rating,
    p.google_review_count,
    p.google_place_id,
    p.is_featured,
    p.tags
  FROM public.partners p
  WHERE p.is_active = true;
$$;

-- 5. Create secure function for single partner lookup
CREATE OR REPLACE FUNCTION public.get_public_partner_safe(partner_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  short_description text,
  description text,
  category text,
  logo_url text,
  cover_image_url text,
  brand_color text,
  address_street text,
  address_number text,
  postal_code text,
  city text,
  country text,
  lat numeric,
  lng numeric,
  opening_hours jsonb,
  special_hours jsonb,
  website text,
  instagram text,
  facebook text,
  google_rating numeric,
  google_review_count integer,
  google_place_id text,
  is_featured boolean,
  tags text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.category,
    p.logo_url,
    p.cover_image_url,
    p.brand_color,
    p.address_street,
    p.address_number,
    p.postal_code,
    p.city,
    p.country,
    p.lat,
    p.lng,
    p.opening_hours,
    p.special_hours,
    p.website,
    p.instagram,
    p.facebook,
    p.google_rating,
    p.google_review_count,
    p.google_place_id,
    p.is_featured,
    p.tags
  FROM public.partners p
  WHERE p.slug = partner_slug AND p.is_active = true;
$$;

-- 6. Create secure function for rewards without sensitive stock/pricing internals
CREATE OR REPLACE FUNCTION public.get_public_rewards_safe()
RETURNS TABLE (
  id uuid,
  partner_id uuid,
  title text,
  description text,
  image_url text,
  reward_type text,
  taler_cost integer,
  value_amount integer,
  value_percent integer,
  terms text,
  valid_from date,
  valid_until date,
  is_available boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.partner_id,
    r.title,
    r.description,
    r.image_url,
    r.reward_type::text,
    r.taler_cost,
    r.value_amount,
    r.value_percent,
    r.terms,
    r.valid_from,
    r.valid_until,
    (r.stock_remaining IS NULL OR r.stock_remaining > 0) as is_available
  FROM public.rewards r
  WHERE r.is_active = true 
    AND (r.valid_until IS NULL OR r.valid_until >= CURRENT_DATE);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_partners_safe() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_public_partner_safe(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_public_rewards_safe() TO authenticated, anon;