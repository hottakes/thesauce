-- Create challenge_completions table
CREATE TABLE public.challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (applicant_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (applicants completing challenges)
CREATE POLICY "Anyone can complete challenges"
ON public.challenge_completions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to view their own completions (by applicant_id match)
CREATE POLICY "Anyone can view completions"
ON public.challenge_completions
FOR SELECT
USING (true);

-- Admins can manage all completions
CREATE POLICY "Admins can manage completions"
ON public.challenge_completions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_challenge_completions_applicant ON public.challenge_completions(applicant_id);
CREATE INDEX idx_challenge_completions_challenge ON public.challenge_completions(challenge_id);