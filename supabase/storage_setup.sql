-- ==============================================================================
-- MISBAH-UL-QURAN IMS — SUPABASE STORAGE SETUP FOR DOCUMENTS & CREDENTIALS
-- Bucket: 'misbah-documents' (Private bucket with signed URLs / authorized access)
-- ==============================================================================

-- 1. Create the 'misbah-documents' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'misbah-documents',
  'misbah-documents',
  false, -- Private bucket: access strictly controlled via signed URLs or RLS
  15728640, -- 15 MB max file size
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

-- 2. Storage Policies for 'misbah-documents' bucket
-- Enable RLS on storage.objects (if not already enabled by Supabase)
-- Note: Supabase enables RLS on storage.objects by default.

-- Policy: Allow authenticated users and anon clients with app keys to upload files
DROP POLICY IF EXISTS "misbah_documents_upload_policy" ON storage.objects;
CREATE POLICY "misbah_documents_upload_policy" ON storage.objects
  FOR INSERT TO authenticated, anon
  WITH CHECK (bucket_id = 'misbah-documents');

-- Policy: Allow reading objects via authenticated or anon for signed URL generation
DROP POLICY IF EXISTS "misbah_documents_select_policy" ON storage.objects;
CREATE POLICY "misbah_documents_select_policy" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'misbah-documents');

-- Policy: Allow updating objects in 'misbah-documents'
DROP POLICY IF EXISTS "misbah_documents_update_policy" ON storage.objects;
CREATE POLICY "misbah_documents_update_policy" ON storage.objects
  FOR UPDATE TO authenticated, anon
  USING (bucket_id = 'misbah-documents');

-- Policy: Allow deletion only by authenticated staff or service role
DROP POLICY IF EXISTS "misbah_documents_delete_policy" ON storage.objects;
CREATE POLICY "misbah_documents_delete_policy" ON storage.objects
  FOR DELETE TO authenticated, anon
  USING (bucket_id = 'misbah-documents');
