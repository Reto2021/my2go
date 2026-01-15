-- Create partner_reviews table for storing Google reviews
CREATE TABLE public.partner_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  google_review_id TEXT UNIQUE,
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  relative_time_description TEXT,
  review_time TIMESTAMP WITH TIME ZONE,
  language TEXT DEFAULT 'de',
  is_featured BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_partner_reviews_partner_id ON public.partner_reviews(partner_id);
CREATE INDEX idx_partner_reviews_rating ON public.partner_reviews(rating);
CREATE INDEX idx_partner_reviews_featured ON public.partner_reviews(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE public.partner_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible reviews (public display)
CREATE POLICY "Anyone can view visible reviews"
ON public.partner_reviews
FOR SELECT
USING (is_visible = true);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.partner_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Partner admins can manage their partner's reviews
CREATE POLICY "Partner admins can manage partner reviews"
ON public.partner_reviews
FOR ALL
USING (is_partner_admin(auth.uid(), partner_id));