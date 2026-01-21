-- Add column for uploaded claim audio (alternative to TTS)
ALTER TABLE public.audio_ads 
ADD COLUMN IF NOT EXISTS uploaded_claim_url TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.audio_ads.uploaded_claim_url IS 'URL to uploaded MP3 file, used instead of TTS generation when provided';