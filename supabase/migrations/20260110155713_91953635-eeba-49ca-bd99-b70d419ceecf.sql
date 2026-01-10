-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partners;

-- Create a function to return only public-safe partner data for listings
CREATE OR REPLACE FUNCTION public.get_public_partners()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  short_description TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  logo_url TEXT,
  cover_image_url TEXT,
  brand_color TEXT,
  address_street TEXT,
  address_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  lat NUMERIC,
  lng NUMERIC,
  opening_hours JSONB,
  special_hours JSONB,
  google_rating NUMERIC,
  google_review_count INTEGER,
  is_featured BOOLEAN,
  website TEXT,
  instagram TEXT,
  facebook TEXT
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
    p.tags,
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
    p.google_rating,
    p.google_review_count,
    p.is_featured,
    p.website,
    p.instagram,
    p.facebook
  FROM public.partners p
  WHERE p.is_active = true
  ORDER BY p.is_featured DESC, p.name ASC
$$;

-- Create a function to get a single public partner by slug
CREATE OR REPLACE FUNCTION public.get_public_partner_by_slug(partner_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  short_description TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  logo_url TEXT,
  cover_image_url TEXT,
  brand_color TEXT,
  address_street TEXT,
  address_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  lat NUMERIC,
  lng NUMERIC,
  opening_hours JSONB,
  special_hours JSONB,
  google_rating NUMERIC,
  google_review_count INTEGER,
  is_featured BOOLEAN,
  website TEXT,
  instagram TEXT,
  facebook TEXT
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
    p.tags,
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
    p.google_rating,
    p.google_review_count,
    p.is_featured,
    p.website,
    p.instagram,
    p.facebook
  FROM public.partners p
  WHERE p.slug = partner_slug AND p.is_active = true
  LIMIT 1
$$;

-- Create a function to get public partner by ID (for rewards display)
CREATE OR REPLACE FUNCTION public.get_public_partner_by_id(partner_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  short_description TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  logo_url TEXT,
  cover_image_url TEXT,
  brand_color TEXT,
  address_street TEXT,
  address_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  lat NUMERIC,
  lng NUMERIC,
  opening_hours JSONB,
  special_hours JSONB,
  google_rating NUMERIC,
  google_review_count INTEGER,
  is_featured BOOLEAN,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  google_place_id TEXT
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
    p.tags,
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
    p.google_rating,
    p.google_review_count,
    p.is_featured,
    p.website,
    p.instagram,
    p.facebook,
    p.google_place_id
  FROM public.partners p
  WHERE p.id = partner_id AND p.is_active = true
  LIMIT 1
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_public_partners() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_partner_by_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_partner_by_id(UUID) TO anon, authenticated;

-- Create restrictive policy for authenticated users who need full access
CREATE POLICY "Authenticated users can view active partners public data"
ON public.partners FOR SELECT
TO authenticated
USING (
  is_active = true OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.is_partner_admin(auth.uid(), id)
);