-- Drop the insecure policy that allows anyone to view codes
DROP POLICY IF EXISTS "Users can view active codes for validation" ON public.air_drop_codes;

-- Create a new secure policy that only allows authenticated users to view active codes
-- This prevents unauthenticated scraping while still allowing the app to validate codes
CREATE POLICY "Authenticated users can view active codes for validation"
ON public.air_drop_codes
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true 
  AND valid_until > now()
);