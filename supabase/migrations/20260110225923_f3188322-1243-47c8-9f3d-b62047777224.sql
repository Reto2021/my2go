-- Update get_public_partners to only return active partners with at least one reward
CREATE OR REPLACE FUNCTION public.get_public_partners()
 RETURNS TABLE(id uuid, name text, slug text, short_description text, description text, category text, tags text[], logo_url text, cover_image_url text, brand_color text, address_street text, address_number text, postal_code text, city text, country text, lat numeric, lng numeric, opening_hours jsonb, special_hours jsonb, google_rating numeric, google_review_count integer, is_featured boolean, website text, instagram text, facebook text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND EXISTS (
      SELECT 1 FROM public.rewards r 
      WHERE r.partner_id = p.id AND r.is_active = true
    )
  ORDER BY p.is_featured DESC, p.name ASC
$function$;