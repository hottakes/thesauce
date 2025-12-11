-- Add policy for admins to read applicants
CREATE POLICY "Admins can view all applicants"
ON public.applicants
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to update applicants
CREATE POLICY "Admins can update applicants"
ON public.applicants
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to delete applicants
CREATE POLICY "Admins can delete applicants"
ON public.applicants
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));