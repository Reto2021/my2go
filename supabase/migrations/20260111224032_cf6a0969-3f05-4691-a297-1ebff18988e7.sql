-- =====================================================
-- SECURITY HARDENING PHASE 3 - Final fixes
-- Fix remaining policy issues
-- =====================================================

-- 1. Remove the old partners SELECT policy if it still exists
DROP POLICY IF EXISTS "Authenticated users can view active partners public data" ON public.partners;

-- 2. Remove the old air_drop_codes policy if it still exists  
DROP POLICY IF EXISTS "Authenticated users can view active codes for validation" ON public.air_drop_codes;

-- 3. Remove the old transactions INSERT policy if it still exists
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;

-- 4. Remove the old code_claims INSERT policy if it still exists
DROP POLICY IF EXISTS "Users can create own claims" ON public.code_claims;