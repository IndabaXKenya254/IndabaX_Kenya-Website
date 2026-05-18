-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - STORAGE BUCKETS SETUP
-- ═══════════════════════════════════════════════════════════════════════
-- Create storage buckets and RLS policies for file uploads
-- Created: 2025-10-23

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

-- Event images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Speaker photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speaker-photos',
  'speaker-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Gallery photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery-photos',
  'gallery-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Sponsor logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sponsor-logos',
  'sponsor-logos',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Post images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================================================

DO $$
DECLARE
    bucket_name TEXT;
BEGIN
    FOR bucket_name IN
        SELECT unnest(ARRAY['event-images', 'speaker-photos', 'gallery-photos', 'sponsor-logos', 'post-images'])
    LOOP
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Admin users can upload to %s" ON storage.objects', bucket_name);
        EXECUTE format('DROP POLICY IF EXISTS "Admin users can update in %s" ON storage.objects', bucket_name);
        EXECUTE format('DROP POLICY IF EXISTS "Admin users can delete from %s" ON storage.objects', bucket_name);
        EXECUTE format('DROP POLICY IF EXISTS "Public can view %s" ON storage.objects', bucket_name);
    END LOOP;
END $$;

-- ============================================================================
-- 3. CREATE RLS POLICIES FOR EACH BUCKET
-- ============================================================================

-- Helper function to check if user is admin (reuse existing or create)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- EVENT IMAGES POLICIES
CREATE POLICY "Admin users can upload to event-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND public.is_admin()
);

CREATE POLICY "Admin users can update in event-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND public.is_admin()
);

CREATE POLICY "Admin users can delete from event-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND public.is_admin()
);

CREATE POLICY "Public can view event-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- SPEAKER PHOTOS POLICIES
CREATE POLICY "Admin users can upload to speaker-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'speaker-photos'
  AND public.is_admin()
);

CREATE POLICY "Admin users can update in speaker-photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'speaker-photos'
  AND public.is_admin()
);

CREATE POLICY "Admin users can delete from speaker-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'speaker-photos'
  AND public.is_admin()
);

CREATE POLICY "Public can view speaker-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'speaker-photos');

-- GALLERY PHOTOS POLICIES
CREATE POLICY "Admin users can upload to gallery-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-photos'
  AND public.is_admin()
);

CREATE POLICY "Admin users can update in gallery-photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery-photos'
  AND public.is_admin()
);

CREATE POLICY "Admin users can delete from gallery-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-photos'
  AND public.is_admin()
);

CREATE POLICY "Public can view gallery-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gallery-photos');

-- SPONSOR LOGOS POLICIES
CREATE POLICY "Admin users can upload to sponsor-logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sponsor-logos'
  AND public.is_admin()
);

CREATE POLICY "Admin users can update in sponsor-logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'sponsor-logos'
  AND public.is_admin()
);

CREATE POLICY "Admin users can delete from sponsor-logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'sponsor-logos'
  AND public.is_admin()
);

CREATE POLICY "Public can view sponsor-logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'sponsor-logos');

-- POST IMAGES POLICIES
CREATE POLICY "Admin users can upload to post-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND public.is_admin()
);

CREATE POLICY "Admin users can update in post-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND public.is_admin()
);

CREATE POLICY "Admin users can delete from post-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND public.is_admin()
);

CREATE POLICY "Public can view post-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- ============================================================================
-- 4. VERIFY SETUP
-- ============================================================================

-- Show all buckets
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('event-images', 'speaker-photos', 'gallery-photos', 'sponsor-logos', 'post-images')
ORDER BY id;

-- Show all storage policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%event-images%'
   OR policyname LIKE '%speaker-photos%'
   OR policyname LIKE '%gallery-photos%'
   OR policyname LIKE '%sponsor-logos%'
   OR policyname LIKE '%post-images%'
ORDER BY policyname;
