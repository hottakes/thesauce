-- Grant table-level permissions
GRANT ALL ON public.opportunities TO authenticated;
GRANT SELECT ON public.opportunities TO anon;
GRANT ALL ON public.opportunity_applications TO authenticated;
GRANT SELECT ON public.opportunity_applications TO anon;

-- Drop existing policies on opportunities table
DROP POLICY IF EXISTS "Anyone can view active opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Admins can manage opportunities" ON public.opportunities;

-- Create new policies for opportunities table
CREATE POLICY "Anyone can view opportunities" ON public.opportunities
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert opportunities" ON public.opportunities
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update opportunities" ON public.opportunities
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete opportunities" ON public.opportunities
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop existing policies on opportunity_applications table
DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.opportunity_applications;
DROP POLICY IF EXISTS "Applicants can apply to opportunities" ON public.opportunity_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.opportunity_applications;

-- Create new policies for opportunity_applications table
CREATE POLICY "Anyone can view applications" ON public.opportunity_applications
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can apply" ON public.opportunity_applications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update applications" ON public.opportunity_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications" ON public.opportunity_applications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));