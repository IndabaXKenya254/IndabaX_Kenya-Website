-- ============================================================================
-- MIGRATION: Add Venue Images Storage Bucket
-- ============================================================================
-- Created: 2025-10-24
-- Description: Create venue-images bucket for venue photos
-- ============================================================================

-- Create venue-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-images',
  'venue-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Admin users can upload to venue-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update in venue-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete from venue-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view venue-images" ON storage.objects;

-- Create RLS policies for venue-images bucket

-- Policy: Admin users can upload to venue-images
CREATE POLICY "Admin users can upload to venue-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'venue-images'
  AND EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE admin_roles.user_id = auth.uid()
  )
);

-- Policy: Admin users can update in venue-images
CREATE POLICY "Admin users can update in venue-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'venue-images'
  AND EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE admin_roles.user_id = auth.uid()
  )
);

-- Policy: Admin users can delete from venue-images
CREATE POLICY "Admin users can delete from venue-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-images'
  AND EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE admin_roles.user_id = auth.uid()
  )
);

-- Policy: Public can view venue-images
CREATE POLICY "Public can view venue-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'venue-images');
