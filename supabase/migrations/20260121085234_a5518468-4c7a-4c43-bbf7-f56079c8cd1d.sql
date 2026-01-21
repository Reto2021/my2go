-- Drop the overly permissive public policy on rewards
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;

-- Create policy for authenticated users to view active rewards via direct query
CREATE POLICY "Authenticated users can view active rewards" 
ON public.rewards 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true 
  AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
);

-- Note: Anonymous users should use get_public_rewards_safe() RPC function instead
-- which is SECURITY DEFINER and only exposes safe fields