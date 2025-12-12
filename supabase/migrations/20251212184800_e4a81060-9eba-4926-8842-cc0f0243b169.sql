-- Drop and recreate the INSERT policy to ensure it works for everyone
DROP POLICY IF EXISTS "Anyone can submit application" ON public.applicants;

-- Create permissive INSERT policy for all roles including public/anon
CREATE POLICY "Anyone can submit application" 
ON public.applicants 
FOR INSERT 
TO public
WITH CHECK (true);