
-- Migration: Regionalization architecture

-- 1. Add region_id to partners
ALTER TABLE partners ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
CREATE INDEX idx_partners_region_id ON partners(region_id);

-- 2. Add region_id to campaigns
ALTER TABLE seasonal_campaigns ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
CREATE INDEX idx_seasonal_campaigns_region_id ON seasonal_campaigns(region_id);

ALTER TABLE collecting_campaigns ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
CREATE INDEX idx_collecting_campaigns_region_id ON collecting_campaigns(region_id);

-- 3. Create trigger_slides table
CREATE TABLE trigger_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  text TEXT NOT NULL,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  priority INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_trigger_slides_region_id ON trigger_slides(region_id);

-- RLS for trigger_slides
ALTER TABLE trigger_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active trigger slides"
  ON trigger_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage trigger slides"
  ON trigger_slides FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
