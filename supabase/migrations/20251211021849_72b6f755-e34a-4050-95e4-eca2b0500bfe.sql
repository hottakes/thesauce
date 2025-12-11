-- Add Instagram profile data columns to applicants table
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS instagram_profile_pic TEXT,
ADD COLUMN IF NOT EXISTS instagram_followers INTEGER,
ADD COLUMN IF NOT EXISTS instagram_verified BOOLEAN DEFAULT false;