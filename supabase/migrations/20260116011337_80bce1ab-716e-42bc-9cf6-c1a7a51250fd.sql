-- Drop existing policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recreate policies with explicit authentication check
-- This ensures anonymous/unauthenticated users are explicitly denied

-- Users can only view their own profile (requires authentication)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
);

-- Users can only update their own profile (requires authentication)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
);

-- Admins can view all profiles (requires authentication + admin role)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- Add comment documenting the security rationale
COMMENT ON TABLE public.profiles IS 'User profiles containing PII (email, phone, birth_date, postal_code). Access restricted to authenticated users viewing their own profile or admins. Anonymous access explicitly denied via auth.uid() IS NOT NULL checks.';