-- Create storage bucket for Instagram profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('instagram-profiles', 'instagram-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to instagram profile pictures
CREATE POLICY "Instagram profiles are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'instagram-profiles');

-- Allow edge functions to upload profile pictures (using service role)
CREATE POLICY "Service role can upload instagram profiles"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'instagram-profiles');