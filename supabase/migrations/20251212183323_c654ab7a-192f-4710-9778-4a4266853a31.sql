-- Create a security definer function to get current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop the problematic policies that query auth.users directly
DROP POLICY IF EXISTS "Users can view their own applicant record" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own applicant record" ON public.applicants;

-- Recreate SELECT policy using the security definer function
CREATE POLICY "Users can view their own applicant record" 
ON public.applicants 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR (user_id IS NULL AND email = public.get_current_user_email())
);

-- Recreate UPDATE policy using the security definer function
CREATE POLICY "Users can update their own applicant record" 
ON public.applicants 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR (user_id IS NULL AND email = public.get_current_user_email())
)
WITH CHECK (
  user_id = auth.uid() 
  OR (user_id IS NULL AND email = public.get_current_user_email())
);