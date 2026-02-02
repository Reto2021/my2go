-- Create partner_radios table for Business Radio feature
CREATE TABLE public.partner_radios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  stream_url TEXT NOT NULL,
  preroll_audio_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  brand_color TEXT DEFAULT '#C7A94E',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  enable_taler_rewards BOOLEAN DEFAULT false,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast slug lookups
CREATE INDEX idx_partner_radios_slug ON partner_radios(slug);
CREATE INDEX idx_partner_radios_partner ON partner_radios(partner_id);

-- Enable RLS
ALTER TABLE partner_radios ENABLE ROW LEVEL SECURITY;

-- Partners can manage their own radios
CREATE POLICY "Partner admins can manage own radios"
  ON partner_radios
  FOR ALL
  USING (is_partner_admin(auth.uid(), partner_id));

-- Admins can manage all radios
CREATE POLICY "Admins can manage all partner radios"
  ON partner_radios
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Public can view active radios (for the public landing page)
CREATE POLICY "Public can view active partner radios"
  ON partner_radios
  FOR SELECT
  USING (is_active = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partner_radios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_partner_radios_updated_at
BEFORE UPDATE ON partner_radios
FOR EACH ROW
EXECUTE FUNCTION update_partner_radios_updated_at();

-- Function to increment play count (can be called from edge function)
CREATE OR REPLACE FUNCTION increment_partner_radio_plays(_radio_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE partner_radios
  SET play_count = play_count + 1
  WHERE id = _radio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;