-- ═══════════════════════════════════════════════════════════════════════
-- TEST STORAGE SETUP
-- ═══════════════════════════════════════════════════════════════════════
-- Verify storage buckets and policies are correctly configured

-- 1. Check all buckets exist
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('event-images', 'speaker-photos', 'gallery-photos', 'sponsor-logos', 'post-images')
ORDER BY id;

-- 2. Check bucket policies
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
AND (
  policyname LIKE '%event-images%'
  OR policyname LIKE '%speaker-photos%'
  OR policyname LIKE '%gallery-photos%'
  OR policyname LIKE '%sponsor-logos%'
  OR policyname LIKE '%post-images%'
)
ORDER BY policyname;

-- 3. Count policies per bucket
SELECT
  CASE
    WHEN policyname LIKE '%event-images%' THEN 'event-images'
    WHEN policyname LIKE '%speaker-photos%' THEN 'speaker-photos'
    WHEN policyname LIKE '%gallery-photos%' THEN 'gallery-photos'
    WHEN policyname LIKE '%sponsor-logos%' THEN 'sponsor-logos'
    WHEN policyname LIKE '%post-images%' THEN 'post-images'
  END as bucket,
  count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND (
  policyname LIKE '%event-images%'
  OR policyname LIKE '%speaker-photos%'
  OR policyname LIKE '%gallery-photos%'
  OR policyname LIKE '%sponsor-logos%'
  OR policyname LIKE '%post-images%'
)
GROUP BY bucket
ORDER BY bucket;

-- Expected: Each bucket should have 4 policies (INSERT, UPDATE, DELETE, SELECT)
