-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Add media_type to photos table
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-15
-- Purpose: Add support for video files in gallery (HEIC, MOV, MP4)
-- Tables: photos
-- ═══════════════════════════════════════════════════════════════════════

-- Add media_type column to photos table
-- Allowed values: 'image' (default) or 'video'
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image'
CHECK (media_type IN ('image', 'video'));

COMMENT ON COLUMN public.photos.media_type IS 'Type of media: image or video';

-- Create index for media_type filtering
CREATE INDEX IF NOT EXISTS idx_photos_media_type
ON public.photos(media_type);

COMMENT ON INDEX idx_photos_media_type IS 'Index for filtering photos by media type (image/video)';

-- Set existing records to 'image' (they are all images)
UPDATE public.photos
SET media_type = 'image'
WHERE media_type IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ═══════════════════════════════════════════════════════════════════════

-- Check if media_type column exists
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'photos' AND column_name = 'media_type';

-- Check index was created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'photos' AND indexname = 'idx_photos_media_type';

-- Verify all existing photos are marked as 'image'
-- SELECT media_type, COUNT(*)
-- FROM public.photos
-- GROUP BY media_type;

-- ═══════════════════════════════════════════════════════════════════════
-- ROLLBACK (if needed)
-- ═══════════════════════════════════════════════════════════════════════

-- DROP INDEX IF EXISTS public.idx_photos_media_type;
-- ALTER TABLE public.photos DROP COLUMN IF EXISTS media_type;
