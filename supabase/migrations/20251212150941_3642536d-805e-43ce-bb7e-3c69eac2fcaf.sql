-- Add columns to applicants table for ambassador portal
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- Create opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_logo_url TEXT,
  description TEXT,
  short_description TEXT,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('sampling', 'event', 'content', 'tabling', 'promotion')),
  compensation TEXT,
  location TEXT,
  schools TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  spots_total INTEGER,
  spots_filled INTEGER DEFAULT 0,
  requirements TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opportunity_applications table
CREATE TABLE public.opportunity_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE (opportunity_id, applicant_id)
);

-- Add proof_url to existing challenge_completions table
ALTER TABLE public.challenge_completions 
ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Enable RLS on new tables
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for opportunities
CREATE POLICY "Anyone can view active opportunities"
ON public.opportunities FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can manage opportunities"
ON public.opportunities FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for opportunity_applications
CREATE POLICY "Applicants can view their own applications"
ON public.opportunity_applications FOR SELECT
USING (
  applicant_id IN (
    SELECT id FROM public.applicants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Applicants can apply to opportunities"
ON public.opportunity_applications FOR INSERT
WITH CHECK (
  applicant_id IN (
    SELECT id FROM public.applicants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all applications"
ON public.opportunity_applications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updated_at on opportunities
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();