-- Add radius targeting columns to audio_ads
ALTER TABLE public.audio_ads 
ADD COLUMN IF NOT EXISTS target_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS target_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS target_radius_km INTEGER;

COMMENT ON COLUMN public.audio_ads.target_lat IS 'Center latitude for radius targeting';
COMMENT ON COLUMN public.audio_ads.target_lng IS 'Center longitude for radius targeting';
COMMENT ON COLUMN public.audio_ads.target_radius_km IS 'Radius in kilometers for geographic targeting';