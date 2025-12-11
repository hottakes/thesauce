-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "View own application by referral code" ON public.applicants;

-- Create a restrictive SELECT policy - only allow viewing via service role (admin access)
-- Users get their data from the INSERT response, not from SELECT queries
CREATE POLICY "No public read access"
ON public.applicants
FOR SELECT
USING (false);