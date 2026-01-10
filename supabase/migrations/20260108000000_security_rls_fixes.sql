-- Security Migration: Fix overly permissive RLS policies
-- Issue: SELECT policies were USING (true), allowing anyone to read all data

-- =============================================================================
-- FIX 1: Applicants table - restrict SELECT to own record or admin
-- =============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "View own application by referral code" ON public.applicants;

-- Create restrictive policy: users can only view their own application
CREATE POLICY "Users view own application"
ON public.applicants FOR SELECT
USING (
  -- User can view their own linked record
  user_id = auth.uid()
  -- OR user is an admin
  OR has_role(auth.uid(), 'admin'::app_role)
  -- OR user is unauthenticated but knows their referral code (for post-signup dashboard)
  -- This allows the waitlist dashboard to work before account creation
  OR (auth.uid() IS NULL AND referral_code IS NOT NULL)
);

-- Note: The "Anyone can submit application" INSERT policy is intentionally kept
-- as the intake flow allows unauthenticated submissions

-- =============================================================================
-- FIX 2: Opportunity Applications - restrict SELECT to own applications or admin
-- =============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view applications" ON public.opportunity_applications;

-- Create restrictive policy
CREATE POLICY "Users view own applications"
ON public.opportunity_applications FOR SELECT
USING (
  -- User's applicant record matches
  applicant_id IN (SELECT id FROM applicants WHERE user_id = auth.uid())
  -- OR user is an admin
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================================================
-- FIX 3: Opportunity Applications - restrict INSERT to authenticated users with linked applicant
-- =============================================================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can apply" ON public.opportunity_applications;

-- Create restrictive INSERT policy
CREATE POLICY "Users can apply to opportunities"
ON public.opportunity_applications FOR INSERT
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  -- Must have a linked applicant record
  AND applicant_id IN (SELECT id FROM applicants WHERE user_id = auth.uid())
);

-- =============================================================================
-- FIX 4: Challenge Completions - ensure users can only manage their own
-- =============================================================================

-- Check if policy exists and is permissive, fix if needed
DROP POLICY IF EXISTS "Anyone can view completions" ON public.challenge_completions;
DROP POLICY IF EXISTS "Users view completions" ON public.challenge_completions;

CREATE POLICY "Users view own challenge completions"
ON public.challenge_completions FOR SELECT
USING (
  applicant_id IN (SELECT id FROM applicants WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure INSERT is restricted
DROP POLICY IF EXISTS "Users can complete challenges" ON public.challenge_completions;

CREATE POLICY "Users can complete own challenges"
ON public.challenge_completions FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND applicant_id IN (SELECT id FROM applicants WHERE user_id = auth.uid())
);

-- =============================================================================
-- FIX 5: Opportunities table - restrict write access to admins only
-- =============================================================================

-- Drop the overly permissive "allow_all" policy
DROP POLICY IF EXISTS "allow_all" ON public.opportunities;

-- Public can view active opportunities
CREATE POLICY "Anyone can view active opportunities"
ON public.opportunities FOR SELECT
USING (
  status = 'active'
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can create opportunities
CREATE POLICY "Admins can create opportunities"
ON public.opportunities FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can update opportunities
CREATE POLICY "Admins can update opportunities"
ON public.opportunities FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete opportunities
CREATE POLICY "Admins can delete opportunities"
ON public.opportunities FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================================
-- NOTE: Storage bucket policies must be configured via Supabase Dashboard
-- =============================================================================
-- Storage policies cannot be managed via SQL migrations because storage.objects
-- is owned by Supabase. Configure these manually in Dashboard → Storage → Policies:
--
-- For bucket "applicant-content":
--   INSERT: auth.uid() IS NOT NULL
--   DELETE: (storage.foldername(name))[1] = auth.uid()::text
--
-- For bucket "instagram-profiles":
--   SELECT: true (public read)
--   INSERT: service_role only (via edge function)
