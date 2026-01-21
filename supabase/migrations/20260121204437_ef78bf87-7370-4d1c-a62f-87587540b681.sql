-- ============================================
-- TALER-ALARM AUDIO ADS SYSTEM
-- Phase 1: Base schema for audio campaigns
-- ============================================

-- 1. Jingle Packages (Verpackungen) - Per partner or global
CREATE TABLE public.audio_jingles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  intro_url TEXT, -- URL to intro audio in storage
  outro_url TEXT, -- URL to outro audio in storage
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Audio Ad Campaigns
CREATE TABLE public.audio_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  jingle_id UUID REFERENCES public.audio_jingles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  claim_text TEXT NOT NULL, -- The text to be converted to speech
  voice_id TEXT NOT NULL DEFAULT 'JBFqnCBsd6RMkjVDRZzb', -- ElevenLabs voice ID
  voice_name TEXT, -- Display name for the voice
  generated_audio_url TEXT, -- URL to final stitched audio in storage
  generation_status TEXT NOT NULL DEFAULT 'pending', -- pending, generating, completed, failed
  generation_error TEXT,
  duration_seconds INTEGER,
  is_active BOOLEAN DEFAULT true,
  trigger_on_tier BOOLEAN DEFAULT false, -- Also trigger when user reaches a tier
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Audio Ad Schedules (Calendar-based)
CREATE TABLE public.audio_ad_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audio_ad_id UUID NOT NULL REFERENCES public.audio_ads(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  repeat_interval_minutes INTEGER, -- NULL = one-time, otherwise repeat every X minutes
  day_start_time TIME DEFAULT '08:00', -- Start of daily window
  day_end_time TIME DEFAULT '22:00', -- End of daily window
  weekdays INTEGER[] DEFAULT '{1,2,3,4,5,6,0}', -- 0=Sunday, 1=Monday, etc.
  is_active BOOLEAN DEFAULT true,
  last_played_at TIMESTAMPTZ,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Audio Ad Play Log (for analytics)
CREATE TABLE public.audio_ad_plays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audio_ad_id UUID NOT NULL REFERENCES public.audio_ads(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.audio_ad_schedules(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  trigger_type TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, tier_reached, manual
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_listened_seconds INTEGER,
  completed BOOLEAN DEFAULT false
);

-- Enable RLS on all tables
ALTER TABLE public.audio_jingles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_ad_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_ad_plays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_jingles
CREATE POLICY "Admins can manage all jingles"
  ON public.audio_jingles FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Partner admins can manage their jingles"
  ON public.audio_jingles FOR ALL
  USING (partner_id IS NOT NULL AND is_partner_admin(auth.uid(), partner_id));

CREATE POLICY "Anyone can view active default jingles"
  ON public.audio_jingles FOR SELECT
  USING (is_active = true AND is_default = true);

-- RLS Policies for audio_ads
CREATE POLICY "Admins can manage all audio ads"
  ON public.audio_ads FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Partner admins can manage their audio ads"
  ON public.audio_ads FOR ALL
  USING (is_partner_admin(auth.uid(), partner_id));

-- RLS Policies for audio_ad_schedules
CREATE POLICY "Admins can manage all schedules"
  ON public.audio_ad_schedules FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Partner admins can manage their ad schedules"
  ON public.audio_ad_schedules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.audio_ads aa 
    WHERE aa.id = audio_ad_schedules.audio_ad_id 
    AND is_partner_admin(auth.uid(), aa.partner_id)
  ));

CREATE POLICY "Partner admins can insert their ad schedules"
  ON public.audio_ad_schedules FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.audio_ads aa 
    WHERE aa.id = audio_ad_schedules.audio_ad_id 
    AND is_partner_admin(auth.uid(), aa.partner_id)
  ));

CREATE POLICY "Partner admins can update their ad schedules"
  ON public.audio_ad_schedules FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.audio_ads aa 
    WHERE aa.id = audio_ad_schedules.audio_ad_id 
    AND is_partner_admin(auth.uid(), aa.partner_id)
  ));

CREATE POLICY "Partner admins can delete their ad schedules"
  ON public.audio_ad_schedules FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.audio_ads aa 
    WHERE aa.id = audio_ad_schedules.audio_ad_id 
    AND is_partner_admin(auth.uid(), aa.partner_id)
  ));

-- RLS Policies for audio_ad_plays
CREATE POLICY "Admins can view all plays"
  ON public.audio_ad_plays FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Partner admins can view their ad plays"
  ON public.audio_ad_plays FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.audio_ads aa 
    WHERE aa.id = audio_ad_plays.audio_ad_id 
    AND is_partner_admin(auth.uid(), aa.partner_id)
  ));

CREATE POLICY "System can insert play logs"
  ON public.audio_ad_plays FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_audio_ads_partner ON public.audio_ads(partner_id);
CREATE INDEX idx_audio_ads_status ON public.audio_ads(generation_status);
CREATE INDEX idx_audio_ad_schedules_date ON public.audio_ad_schedules(scheduled_date, scheduled_time);
CREATE INDEX idx_audio_ad_schedules_active ON public.audio_ad_schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_audio_ad_plays_ad ON public.audio_ad_plays(audio_ad_id);
CREATE INDEX idx_audio_ad_plays_date ON public.audio_ad_plays(played_at);

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-ads', 'audio-ads', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can manage audio-ads bucket"
  ON storage.objects FOR ALL
  USING (bucket_id = 'audio-ads' AND has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Partner admins can upload to audio-ads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio-ads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read audio-ads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-ads');

-- Trigger for updated_at
CREATE TRIGGER update_audio_jingles_updated_at
  BEFORE UPDATE ON public.audio_jingles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audio_ads_updated_at
  BEFORE UPDATE ON public.audio_ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();