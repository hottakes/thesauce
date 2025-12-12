-- Drop the old policy that only matches by user_id
DROP POLICY IF EXISTS "Users can view their own applicant record" ON public.applicants;

-- Create new policy that allows viewing by user_id OR by matching email
CREATE POLICY "Users can view their own applicant record" 
ON public.applicants 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);