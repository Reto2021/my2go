-- Add partner_tier enum and column
CREATE TYPE public.partner_tier AS ENUM ('starter', 'partner');

-- Add tier column to partners table with default 'partner' for existing partners
ALTER TABLE public.partners 
ADD COLUMN tier public.partner_tier NOT NULL DEFAULT 'partner';

-- Set existing active partners to 'partner' tier (they already paid)
UPDATE public.partners SET tier = 'partner' WHERE is_active = true;

-- New partners will default to 'starter' - change default
ALTER TABLE public.partners ALTER COLUMN tier SET DEFAULT 'starter';

-- Add stripe_customer_id and stripe_subscription_id for partner billing
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Create index for tier queries
CREATE INDEX idx_partners_tier ON public.partners(tier);

-- Function to check if partner has specific feature access
CREATE OR REPLACE FUNCTION public.partner_has_feature(p_partner_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier public.partner_tier;
BEGIN
  SELECT tier INTO v_tier FROM public.partners WHERE id = p_partner_id;
  
  IF v_tier IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Starter tier features
  IF v_tier = 'starter' THEN
    RETURN p_feature IN ('visit_points', 'basic_listing', 'basic_analytics');
  END IF;
  
  -- Partner tier has all features
  IF v_tier = 'partner' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- View for partner tier features
CREATE OR REPLACE VIEW public.partner_tier_features AS
SELECT 
  p.id as partner_id,
  p.name,
  p.tier,
  CASE WHEN p.tier = 'partner' THEN TRUE ELSE FALSE END as can_create_rewards,
  CASE WHEN p.tier = 'partner' THEN TRUE ELSE FALSE END as has_advanced_analytics,
  CASE WHEN p.tier = 'partner' THEN TRUE ELSE FALSE END as has_priority_support,
  CASE WHEN p.tier = 'partner' THEN FALSE ELSE TRUE END as shows_powered_by_badge,
  CASE WHEN p.tier = 'partner' THEN TRUE ELSE FALSE END as can_export_data,
  CASE WHEN p.tier = 'partner' THEN TRUE ELSE FALSE END as has_featured_placement
FROM public.partners p
WHERE p.is_active = true;