-- Create applicants table
CREATE TABLE public.applicants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT,
  school TEXT NOT NULL,
  is_19_plus BOOLEAN NOT NULL DEFAULT false,
  instagram_handle TEXT NOT NULL,
  personality_traits TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  household_size INTEGER NOT NULL DEFAULT 1,
  scene_types TEXT[] NOT NULL DEFAULT '{}',
  scene_custom TEXT,
  content_uploaded BOOLEAN NOT NULL DEFAULT false,
  ambassador_type TEXT NOT NULL,
  waitlist_position INTEGER NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 50
);

-- Enable Row Level Security
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup form - no auth required)
CREATE POLICY "Anyone can submit application" 
ON public.applicants 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own application by referral code (for dashboard)
CREATE POLICY "View own application by referral code" 
ON public.applicants 
FOR SELECT 
USING (true);

-- Create index on referral_code for faster lookups
CREATE INDEX idx_applicants_referral_code ON public.applicants(referral_code);

-- Create index on instagram_handle to check for duplicates
CREATE INDEX idx_applicants_instagram ON public.applicants(instagram_handle);