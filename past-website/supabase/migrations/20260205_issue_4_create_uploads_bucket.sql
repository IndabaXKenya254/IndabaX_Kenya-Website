-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - CREATE UPLOADS BUCKET (Issue #4)
-- ═══════════════════════════════════════════════════════════════════════════
-- Problem: File upload in application forms fails because 'uploads' bucket
--          doesn't exist in Supabase Storage
--
-- Solution: Create a general-purpose 'uploads' bucket for form file uploads
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: Storage bucket creation is done via Supabase API, not SQL.
-- This migration file documents the required bucket configuration.
-- Execute via Supabase Dashboard or MCP tool.

-- Bucket: uploads
-- Public: true
-- Max file size: 10MB (10485760 bytes)
-- Allowed MIME types:
--   - Documents: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
--   - Images: image/jpeg, image/png, image/webp, image/gif
--   - Videos: video/mp4, video/webm, video/quicktime
--   - Spreadsheets: application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
--   - Text: text/plain, text/csv

-- RLS Policy for uploads bucket:
-- Allow authenticated users to upload files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the uploads bucket
-- Allow anyone to read (public bucket)
CREATE POLICY "Public read access for uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads' AND auth.uid() = owner);
