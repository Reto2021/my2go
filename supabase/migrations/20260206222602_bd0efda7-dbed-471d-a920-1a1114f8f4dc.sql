
-- Seasonal Campaigns table
CREATE TABLE public.seasonal_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  banner_image_url TEXT,
  badge_text TEXT DEFAULT '🔥 Saisonaktion',
  badge_color TEXT DEFAULT '#D4AF37',
  bonus_multiplier NUMERIC DEFAULT 1.0,
  bonus_taler INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign-Partner junction table
CREATE TABLE public.campaign_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.seasonal_campaigns(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  custom_badge_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, partner_id)
);

-- Enable RLS
ALTER TABLE public.seasonal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_partners ENABLE ROW LEVEL SECURITY;

-- Public read for active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON public.seasonal_campaigns FOR SELECT
  USING (is_active = true AND starts_at <= now() AND ends_at > now());

-- Admin full access to campaigns
CREATE POLICY "Admins can manage campaigns"
  ON public.seasonal_campaigns FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public read for campaign partners
CREATE POLICY "Anyone can view campaign partners"
  ON public.campaign_partners FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.seasonal_campaigns sc
    WHERE sc.id = campaign_id AND sc.is_active = true AND sc.starts_at <= now() AND sc.ends_at > now()
  ));

-- Admin full access to campaign partners
CREATE POLICY "Admins can manage campaign partners"
  ON public.campaign_partners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_seasonal_campaigns_updated_at
  BEFORE UPDATE ON public.seasonal_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for active campaign lookups
CREATE INDEX idx_seasonal_campaigns_active ON public.seasonal_campaigns (is_active, starts_at, ends_at);
CREATE INDEX idx_campaign_partners_campaign ON public.campaign_partners (campaign_id);
CREATE INDEX idx_campaign_partners_partner ON public.campaign_partners (partner_id);
