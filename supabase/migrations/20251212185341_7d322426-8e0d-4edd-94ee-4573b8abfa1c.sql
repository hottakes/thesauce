-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can submit application" ON public.applicants;

-- Recreate with explicit role grants - using 'anon' for unauthenticated and 'authenticated' for logged in users
CREATE POLICY "Anyone can submit application" 
ON public.applicants 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);