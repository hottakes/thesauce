-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Anyone can submit application" ON public.applicants;

-- Recreate as a PERMISSIVE policy (default) that actually allows inserts
CREATE POLICY "Anyone can submit application" 
ON public.applicants 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);