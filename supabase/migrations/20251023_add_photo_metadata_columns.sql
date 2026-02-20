-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Add photo_date and uploaded_by columns to photos table
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Track when photos were uploaded and who uploaded them
-- Date: 2025-10-23
-- Tables: photos

BEGIN;

-- Add photo_date column (timestamp when photo was uploaded)
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS photo_date TIMESTAMPTZ DEFAULT NOW();

-- Add uploaded_by column (email of admin who uploaded the photo)
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255);

-- Create index for uploaded_by for faster filtering
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by
ON public.photos(uploaded_by);

-- Create index for photo_date for sorting
CREATE INDEX IF NOT EXISTS idx_photos_photo_date
ON public.photos(photo_date DESC);

-- Update existing photos to set photo_date to created_at if it exists
UPDATE public.photos
SET photo_date = created_at
WHERE photo_date IS NULL AND created_at IS NOT NULL;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
-- Run these queries to verify the migration:
--
-- 1. Check columns exist:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'photos' AND column_name IN ('photo_date', 'uploaded_by');
--
-- 2. Check indexes exist:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'photos' AND indexname IN ('idx_photos_uploaded_by', 'idx_photos_photo_date');
--
-- 3. Sample data:
-- SELECT id, caption, photo_date, uploaded_by, created_at
-- FROM public.photos
-- ORDER BY photo_date DESC
-- LIMIT 5;

-- ═══════════════════════════════════════════════════════════════════════
-- ROLLBACK (if needed)
-- ═══════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP INDEX IF EXISTS public.idx_photos_uploaded_by;
-- DROP INDEX IF EXISTS public.idx_photos_photo_date;
-- ALTER TABLE public.photos DROP COLUMN IF EXISTS uploaded_by;
-- ALTER TABLE public.photos DROP COLUMN IF EXISTS photo_date;
-- COMMIT;
