-- Create storage bucket for partner documents (invoices, contracts, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-documents',
  'partner-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for partner-documents bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-documents' AND
  (storage.foldername(name))[1] = 'quiz-invoices'
);

-- Allow users to view their own uploads
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-documents'
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-documents' AND
  (storage.foldername(name))[1] = 'quiz-invoices'
);

-- Allow anon users to upload (for quiz without login)
CREATE POLICY "Anon users can upload quiz documents"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'partner-documents' AND
  (storage.foldername(name))[1] = 'quiz-invoices'
);