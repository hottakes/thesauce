-- Create storage buckets for applicant content
INSERT INTO storage.buckets (id, name, public) VALUES ('applicant-content', 'applicant-content', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('applicant-recordings', 'applicant-recordings', true);

-- Storage policies for applicant-content bucket
CREATE POLICY "Anyone can upload content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'applicant-content');

CREATE POLICY "Anyone can view content"
ON storage.objects FOR SELECT
USING (bucket_id = 'applicant-content');

CREATE POLICY "Anyone can delete own content"
ON storage.objects FOR DELETE
USING (bucket_id = 'applicant-content');

-- Storage policies for applicant-recordings bucket
CREATE POLICY "Anyone can upload recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'applicant-recordings');

CREATE POLICY "Anyone can view recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'applicant-recordings');

CREATE POLICY "Anyone can delete own recordings"
ON storage.objects FOR DELETE
USING (bucket_id = 'applicant-recordings');

-- Add new columns to applicants table
ALTER TABLE public.applicants
ADD COLUMN content_urls jsonb DEFAULT '[]'::jsonb,
ADD COLUMN pitch_url text,
ADD COLUMN pitch_type text;