-- Create public assets bucket for marketing materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public-assets', 'public-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload public assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-assets' AND auth.role() = 'authenticated');