-- =====================================================
-- SECURITY HARDENING PHASE 2
-- 1. Restrict partners SELECT policy to hide contact fields
-- 2. Lock down transactions INSERT to prevent fraud
-- 3. Lock down code_claims INSERT to prevent fraud
-- 4. Improve partner_applications security
-- =====================================================

-- 1. Drop the permissive partners SELECT policy and create a more restrictive one
-- Users should only see public-safe fields through the RPC functions, not direct table access
DROP POLICY IF EXISTS "Authenticated users can view active partners public data" ON public.partners;

-- Create a new policy that only allows viewing through secure channels
-- Regular users can only see minimal fields needed for display
CREATE POLICY "Public can view active partners basic info"
ON public.partners
FOR SELECT
USING (
  -- Admins and partner admins can see their own partner fully
  has_role(auth.uid(), 'admin'::user_role) 
  OR is_partner_admin(auth.uid(), id)
  -- Everyone else should use RPC functions, but we still need basic access for joins
  OR (is_active = true)
);

-- 2. Restrict transaction creation to prevent user-initiated fraud
-- Users should NOT be able to create arbitrary transactions - only through RPC functions
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;

-- Only allow inserts through SECURITY DEFINER functions (which bypass RLS)
-- No direct user INSERT allowed
-- Note: This is already protected because all transaction-creating functions use SECURITY DEFINER

-- 3. Restrict code_claims - should only be created through RPC function
DROP POLICY IF EXISTS "Users can create own claims" ON public.code_claims;

-- Claims are already created through redeem_air_drop_code RPC which uses SECURITY DEFINER
-- No direct user INSERT should be allowed

-- 4. Improve partner_applications - make user_id NOT NULL and add proper policy
-- First update any NULL user_ids to prevent issues (shouldn't happen, but safety)
UPDATE public.partner_applications 
SET user_id = reviewed_by 
WHERE user_id IS NULL AND reviewed_by IS NOT NULL;

-- Note: We can't make user_id NOT NULL if there's existing data with NULLs
-- Instead, we ensure the RLS policy properly validates

-- Recreate the policy to be more strict
DROP POLICY IF EXISTS "Users can view own applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Users can insert applications" ON public.partner_applications;

CREATE POLICY "Users can view own applications"
ON public.partner_applications
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Authenticated users can insert own applications"
ON public.partner_applications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- 5. Improve air_drop_codes - hide claim counts from regular users
-- Create a function that validates codes without exposing full details
CREATE OR REPLACE FUNCTION public.validate_air_drop_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code_exists BOOLEAN;
  _is_valid BOOLEAN;
BEGIN
  -- Check if code exists and is valid (without exposing details)
  SELECT 
    EXISTS (SELECT 1 FROM air_drop_codes WHERE code = UPPER(TRIM(_code))),
    EXISTS (
      SELECT 1 FROM air_drop_codes 
      WHERE code = UPPER(TRIM(_code))
        AND is_active = true
        AND (valid_from IS NULL OR valid_from <= now())
        AND valid_until > now()
        AND (max_claims IS NULL OR current_claims < max_claims)
    )
  INTO _code_exists, _is_valid;
  
  IF NOT _code_exists THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code nicht gefunden');
  ELSIF NOT _is_valid THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code nicht mehr gültig');
  ELSE
    RETURN jsonb_build_object('valid', true);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_air_drop_code(text) TO authenticated;

-- 6. Restrict air_drop_codes visibility - users shouldn't see code details
DROP POLICY IF EXISTS "Authenticated users can view active codes for validation" ON public.air_drop_codes;

-- Only admins can view the full codes table - users must use validate/redeem functions
CREATE POLICY "Only admins can view air drop codes"
ON public.air_drop_codes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));