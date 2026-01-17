-- Table to track new partner alerts for users
-- Stores when a new partner was activated and which users have seen/dismissed the alert
CREATE TABLE public.new_partner_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Partner location info cached for efficient geo-filtering
  partner_city TEXT,
  partner_postal_code TEXT,
  partner_lat DOUBLE PRECISION,
  partner_lng DOUBLE PRECISION
);

-- Table to track which users have dismissed/seen which new partner alerts
CREATE TABLE public.new_partner_alert_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES public.new_partner_alerts(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_id)
);

-- Enable RLS
ALTER TABLE public.new_partner_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_partner_alert_dismissals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new_partner_alerts (read-only for authenticated users)
CREATE POLICY "Authenticated users can view new partner alerts"
ON public.new_partner_alerts
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for dismissals
CREATE POLICY "Users can view their own dismissals"
ON public.new_partner_alert_dismissals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dismissals"
ON public.new_partner_alert_dismissals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_new_partner_alerts_created_at ON public.new_partner_alerts(created_at DESC);
CREATE INDEX idx_new_partner_alerts_location ON public.new_partner_alerts(partner_city, partner_postal_code);
CREATE INDEX idx_new_partner_alert_dismissals_user ON public.new_partner_alert_dismissals(user_id);