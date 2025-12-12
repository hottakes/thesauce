-- Drop the restrictive INSERT policy and replace with a permissive one
DROP POLICY IF EXISTS "Anyone can submit application" ON public.applicants;

-- Create a permissive INSERT policy instead (restrictive policies require ALL policies to pass)
CREATE POLICY "Anyone can submit application" 
ON public.applicants 
FOR INSERT 
WITH CHECK (true);