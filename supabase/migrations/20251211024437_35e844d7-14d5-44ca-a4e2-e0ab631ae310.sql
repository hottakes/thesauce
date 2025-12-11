-- Add first_name and last_name columns to applicants table
ALTER TABLE public.applicants
ADD COLUMN first_name text,
ADD COLUMN last_name text;