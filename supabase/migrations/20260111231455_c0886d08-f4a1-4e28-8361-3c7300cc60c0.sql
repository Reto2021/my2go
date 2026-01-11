-- =============================================
-- SECURITY HARDENING: profiles & partners tables
-- =============================================

-- 1. PARTNERS TABLE: Remove overly permissive public SELECT policy
-- The existing RPC functions (get_public_partners, get_public_partner_by_slug, etc.) 
-- already filter to only return safe columns. Direct table access should be restricted.

DROP POLICY IF EXISTS "Public can view active partners basic info" ON public.partners;

-- Create new restrictive policy: Only admins and partner admins can SELECT directly
CREATE POLICY "Only admins and partner admins can view partners directly"
ON public.partners
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR is_partner_admin(auth.uid(), id)
);

-- 2. PROFILES TABLE: Add leaderboard-specific policy for nickname/avatar only
-- Create a security definer function to safely get leaderboard data
CREATE OR REPLACE FUNCTION public.get_leaderboard_profile_safe(profile_id uuid)
RETURNS TABLE (
  avatar_url text,
  leaderboard_nickname text,
  show_on_leaderboard boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.avatar_url,
    p.leaderboard_nickname,
    p.show_on_leaderboard
  FROM public.profiles p
  WHERE p.id = profile_id
    AND p.show_on_leaderboard = true;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_leaderboard_profile_safe(uuid) TO authenticated;

-- 3. Create a safe function to get partner public info (backup for RPC)
CREATE OR REPLACE FUNCTION public.get_partner_public_info(partner_id uuid)
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
  city text,
  postal_code text,
  address_street text,
  address_number text,
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
  tags text[],
  is_featured boolean
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
    p.city,
    p.postal_code,
    p.address_street,
    p.address_number,
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
    p.tags,
    p.is_featured
  FROM public.partners p
  WHERE p.id = partner_id
    AND p.is_active = true;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_partner_public_info(uuid) TO anon, authenticated;