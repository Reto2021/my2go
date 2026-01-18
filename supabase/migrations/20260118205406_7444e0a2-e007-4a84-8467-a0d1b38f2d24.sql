-- Add subscription tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS free_trial_started_at TIMESTAMP WITH TIME ZONE;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.subscription_status IS 'free, trial, active, cancelled, expired';
COMMENT ON COLUMN public.profiles.subscription_tier IS 'monthly or yearly';
COMMENT ON COLUMN public.profiles.free_trial_started_at IS 'Timestamp when free trial started for existing users';