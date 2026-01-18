-- Create sponsors table for companies that sponsor partners/rewards
CREATE TABLE public.sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_sponsors junction table to link sponsors to rewards
CREATE TABLE public.reward_sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  sponsorship_type TEXT DEFAULT 'financial', -- 'financial' = nur Finanzierung, 'provider' = Sponsor bietet Reward an
  display_text TEXT, -- Optional: "Gesponsert von..." oder custom Text
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reward_id, sponsor_id)
);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_sponsors ENABLE ROW LEVEL SECURITY;

-- Public read access for sponsors (they should be visible to everyone)
CREATE POLICY "Sponsors are publicly readable" 
ON public.sponsors 
FOR SELECT 
USING (is_active = true);

-- Admin can manage sponsors
CREATE POLICY "Admins can manage sponsors" 
ON public.sponsors 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Public read access for reward_sponsors
CREATE POLICY "Reward sponsors are publicly readable" 
ON public.reward_sponsors 
FOR SELECT 
USING (true);

-- Admin and partner admins can manage reward_sponsors
CREATE POLICY "Admins can manage reward sponsors" 
ON public.reward_sponsors 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partner admins can manage their reward sponsors" 
ON public.reward_sponsors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.rewards r
    JOIN public.partner_admins pa ON pa.partner_id = r.partner_id
    WHERE r.id = reward_id AND pa.user_id = auth.uid()
  )
);

-- Trigger for updated_at on sponsors
CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_reward_sponsors_reward_id ON public.reward_sponsors(reward_id);
CREATE INDEX idx_reward_sponsors_sponsor_id ON public.reward_sponsors(sponsor_id);