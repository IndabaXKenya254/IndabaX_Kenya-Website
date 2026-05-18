-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD TEAM PHOTOS STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════════════════
-- Create team-photos bucket and RLS policies for team member photo uploads
-- Created: 2025-10-24

-- ============================================================================
-- 1. CREATE TEAM PHOTOS BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-photos',
  'team-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Admin users can upload to team-photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update in team-photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete from team-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view team-photos" ON storage.objects;

-- ============================================================================
-- 3. CREATE RLS POLICIES FOR TEAM PHOTOS BUCKET
-- ============================================================================

-- Upload policy
CREATE POLICY "Admin users can upload to team-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-photos'
  AND public.is_admin()
);

-- Update policy
CREATE POLICY "Admin users can update in team-photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-photos'
  AND public.is_admin()
);

-- Delete policy
CREATE POLICY "Admin users can delete from team-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-photos'
  AND public.is_admin()
);

-- Public read policy
CREATE POLICY "Public can view team-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'team-photos');

-- ============================================================================
-- 4. VERIFY SETUP
-- ============================================================================

-- Show bucket configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'team-photos';

-- Show policies for team-photos
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%team-photos%'
ORDER BY policyname;
