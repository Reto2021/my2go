-- Add Google Review fields to partners table
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS google_rating numeric(2,1),
ADD COLUMN IF NOT EXISTS google_review_count integer;