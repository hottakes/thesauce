-- Allow users to update their own applicant record (for linking user_id after account creation)
CREATE POLICY "Users can update their own applicant record"
ON public.applicants
FOR UPDATE
USING (user_id = auth.uid() OR (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid())))
WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Allow users to view their own applicant record
CREATE POLICY "Users can view their own applicant record"
ON public.applicants
FOR SELECT
USING (user_id = auth.uid());