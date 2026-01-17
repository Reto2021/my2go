-- Create table to track QR scans
CREATE TABLE public.qr_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  referrer TEXT,
  user_id UUID,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

-- Index for efficient partner queries
CREATE INDEX idx_qr_scans_partner_id ON public.qr_scans(partner_id);
CREATE INDEX idx_qr_scans_scanned_at ON public.qr_scans(scanned_at DESC);
CREATE INDEX idx_qr_scans_campaign ON public.qr_scans(utm_campaign);

-- RLS Policies
CREATE POLICY "Partner admins can view their QR scans"
ON public.qr_scans
FOR SELECT
USING (is_partner_admin(auth.uid(), partner_id));

CREATE POLICY "Admins can view all QR scans"
ON public.qr_scans
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow anonymous inserts (scans can happen before login)
CREATE POLICY "Anyone can insert QR scans"
ON public.qr_scans
FOR INSERT
WITH CHECK (true);