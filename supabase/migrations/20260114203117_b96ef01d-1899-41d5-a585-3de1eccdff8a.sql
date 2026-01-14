-- Clean up duplicate and redundant policies on partner_applications table

-- Drop redundant SELECT policies (keep only one clear policy)
DROP POLICY IF EXISTS "Users can view own applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.partner_applications;

-- Drop redundant INSERT policies (keep only one clear policy)  
DROP POLICY IF EXISTS "Authenticated users can insert own applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Users can create their own application" ON public.partner_applications;

-- Create clean, explicit SELECT policy for users
-- Only allows viewing own applications (user_id must match auth.uid())
CREATE POLICY "Users can only view their own applications"
ON public.partner_applications
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Create clean INSERT policy
-- Users can only insert applications for themselves
CREATE POLICY "Users can insert their own applications"
ON public.partner_applications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Add UPDATE policy so users can update their pending applications
CREATE POLICY "Users can update their own pending applications"
ON public.partner_applications
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);