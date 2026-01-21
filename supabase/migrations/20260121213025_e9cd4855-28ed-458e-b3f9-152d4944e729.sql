-- Add targeting columns to audio_ads table
ALTER TABLE public.audio_ads
ADD COLUMN target_cities text[] DEFAULT NULL,
ADD COLUMN target_postal_codes text[] DEFAULT NULL,
ADD COLUMN target_stations text[] DEFAULT NULL,
ADD COLUMN target_age_min integer DEFAULT NULL,
ADD COLUMN target_age_max integer DEFAULT NULL,
ADD COLUMN target_subscription_tiers text[] DEFAULT NULL,
ADD COLUMN target_min_streak integer DEFAULT NULL,
ADD COLUMN target_min_listen_hours integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.audio_ads.target_cities IS 'Target users in specific cities (NULL = all)';
COMMENT ON COLUMN public.audio_ads.target_postal_codes IS 'Target users with specific postal codes (NULL = all)';
COMMENT ON COLUMN public.audio_ads.target_stations IS 'Target users listening to specific radio stations by UUID (NULL = all)';
COMMENT ON COLUMN public.audio_ads.target_age_min IS 'Minimum age for targeting (NULL = no minimum)';
COMMENT ON COLUMN public.audio_ads.target_age_max IS 'Maximum age for targeting (NULL = no maximum)';
COMMENT ON COLUMN public.audio_ads.target_subscription_tiers IS 'Target specific subscription tiers: free, plus, trial (NULL = all)';
COMMENT ON COLUMN public.audio_ads.target_min_streak IS 'Target users with minimum streak days (NULL = no minimum)';
COMMENT ON COLUMN public.audio_ads.target_min_listen_hours IS 'Target users with minimum total listen hours (NULL = no minimum)';