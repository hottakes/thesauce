-- Grant table-level permissions to anon and authenticated roles
GRANT INSERT ON public.applicants TO anon;
GRANT INSERT ON public.applicants TO authenticated;
GRANT SELECT ON public.applicants TO anon;
GRANT SELECT ON public.applicants TO authenticated;
GRANT UPDATE ON public.applicants TO authenticated;

-- Drop existing INSERT policies that may conflict
DROP POLICY IF EXISTS "Anyone can submit application" ON public.applicants;
DROP POLICY IF EXISTS "Public can insert applicants" ON public.applicants;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.applicants;
DROP POLICY IF EXISTS "allow_public_insert" ON public.applicants;
DROP POLICY IF EXISTS "No public read access" ON public.applicants;

-- Create new INSERT policy allowing anonymous and authenticated users
CREATE POLICY "allow_public_insert" ON public.applicants
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create new SELECT policy - users can read their own record or admins can read all
CREATE POLICY "Users can read own record" ON public.applicants
FOR SELECT
TO anon, authenticated
USING (
  (user_id = auth.uid()) OR 
  (user_id IS NULL AND email = get_current_user_email()) OR
  has_role(auth.uid(), 'admin'::app_role)
);