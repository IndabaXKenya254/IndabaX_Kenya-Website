-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix uploaded_by column type in photos table
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Change uploaded_by from UUID to VARCHAR to store admin email
-- Date: 2025-10-25
-- Tables: photos
-- Risk: LOW - Only changes column type, keeps existing data compatible

BEGIN;

-- Drop the foreign key constraint first (if it exists)
ALTER TABLE public.photos
DROP CONSTRAINT IF EXISTS photos_uploaded_by_fkey;

-- Change column type from UUID to VARCHAR(255)
-- This will convert existing UUIDs to text format
ALTER TABLE public.photos
ALTER COLUMN uploaded_by TYPE VARCHAR(255) USING uploaded_by::TEXT;

-- Remove NOT NULL constraint if it exists (make it optional)
ALTER TABLE public.photos
ALTER COLUMN uploaded_by DROP NOT NULL;

COMMENT ON COLUMN public.photos.uploaded_by IS 'Email address of admin who uploaded the photo';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
-- Run these queries to verify the migration:
--
-- 1. Check column type:
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'photos' AND column_name = 'uploaded_by';
--
-- 2. Check constraints:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'photos';

-- ═══════════════════════════════════════════════════════════════════════
-- ROLLBACK (if needed)
-- ═══════════════════════════════════════════════════════════════════════
-- BEGIN;
-- ALTER TABLE public.photos
-- ALTER COLUMN uploaded_by TYPE UUID USING uploaded_by::UUID;
-- ALTER TABLE public.photos
-- ADD CONSTRAINT photos_uploaded_by_fkey
-- FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
-- COMMIT;
