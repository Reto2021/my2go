-- Add Google Place ID to partners table
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Add review request settings to partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS review_request_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS review_request_delay_minutes INTEGER DEFAULT 5;

-- Create review_requests table to track review solicitations
CREATE TABLE public.review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  redemption_id UUID REFERENCES public.redemptions(id) ON DELETE SET NULL,
  in_app_rating INTEGER CHECK (in_app_rating BETWEEN 1 AND 5),
  review_clicked BOOLEAN DEFAULT false,
  review_clicked_at TIMESTAMPTZ,
  feedback_text TEXT,
  feedback_submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_review_requests_partner_id ON public.review_requests(partner_id);
CREATE INDEX idx_review_requests_user_id ON public.review_requests(user_id);
CREATE INDEX idx_review_requests_created_at ON public.review_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own review requests
CREATE POLICY "Users can create their own review requests"
ON public.review_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own review requests
CREATE POLICY "Users can view their own review requests"
ON public.review_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own review requests (to add rating/feedback)
CREATE POLICY "Users can update their own review requests"
ON public.review_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Partner admins can view review requests for their partner
CREATE POLICY "Partner admins can view their partner review requests"
ON public.review_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_admins
    WHERE partner_admins.partner_id = review_requests.partner_id
    AND partner_admins.user_id = auth.uid()
  )
);

-- Add transaction source for review bonus
-- Note: This is handled via the existing 'bonus' source type