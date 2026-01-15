-- Create table to track referral share events
CREATE TABLE public.referral_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL, -- 'whatsapp', 'telegram', 'email', 'copy', 'native'
  referral_code TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.referral_shares ENABLE ROW LEVEL SECURITY;

-- Users can insert their own share events
CREATE POLICY "Users can create own share events"
ON public.referral_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own share events
CREATE POLICY "Users can view own share events"
ON public.referral_shares
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all share events
CREATE POLICY "Admins can view all share events"
ON public.referral_shares
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create index for analytics queries
CREATE INDEX idx_referral_shares_channel ON public.referral_shares(channel);
CREATE INDEX idx_referral_shares_user ON public.referral_shares(user_id);
CREATE INDEX idx_referral_shares_date ON public.referral_shares(shared_at);

-- Add comment
COMMENT ON TABLE public.referral_shares IS 'Tracks which share channels users use for referrals';