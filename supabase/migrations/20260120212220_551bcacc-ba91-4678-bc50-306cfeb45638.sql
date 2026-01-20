-- Fix security definer view by using security_invoker
DROP VIEW IF EXISTS public.partner_tier_features;

CREATE VIEW public.partner_tier_features 
WITH (security_invoker = true) AS
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