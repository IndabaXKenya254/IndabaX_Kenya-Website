-- ═══════════════════════════════════════════════════════════════════════
-- ADD MISSING COLUMNS TO PHOTOS AND SCHEDULE_ITEMS
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Add columns that were missing from the schema
-- Created: Based on mock data migration script requirements
-- Risk Level: LOW - Only adding columns with defaults, no data loss
-- Rollback: See rollback section at bottom
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- ADD MISSING COLUMNS TO PHOTOS TABLE
-- ============================================================================

-- Add is_featured column to photos table
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN public.photos.is_featured IS 'Whether this photo should be featured in the gallery';

-- Create index for featured photos queries
CREATE INDEX IF NOT EXISTS idx_photos_is_featured
ON public.photos(is_featured)
WHERE is_featured = true;

-- ============================================================================
-- ADD MISSING COLUMNS TO SCHEDULE_ITEMS TABLE
-- ============================================================================

-- Add day_name column (e.g., "Day 1", "Day 2")
ALTER TABLE public.schedule_items
ADD COLUMN IF NOT EXISTS day_name VARCHAR(100);

COMMENT ON COLUMN public.schedule_items.day_name IS 'Day label for the schedule item (e.g., "Day 1", "Day 2")';

-- Add schedule_date column (the actual date)
ALTER TABLE public.schedule_items
ADD COLUMN IF NOT EXISTS schedule_date VARCHAR(100);

COMMENT ON COLUMN public.schedule_items.schedule_date IS 'Date label for the schedule item (e.g., "March 15, 2026")';

-- Create index for day queries
CREATE INDEX IF NOT EXISTS idx_schedule_items_day_name
ON public.schedule_items(day_name);

-- ============================================================================
-- VERIFY CHANGES
-- ============================================================================

DO $$
BEGIN
  -- Verify photos.is_featured column exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'photos'
      AND column_name = 'is_featured'
  ) THEN
    RAISE NOTICE '✓ photos.is_featured column added successfully';
  ELSE
    RAISE EXCEPTION '✗ Failed to add photos.is_featured column';
  END IF;

  -- Verify schedule_items.day_name column exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'schedule_items'
      AND column_name = 'day_name'
  ) THEN
    RAISE NOTICE '✓ schedule_items.day_name column added successfully';
  ELSE
    RAISE EXCEPTION '✗ Failed to add schedule_items.day_name column';
  END IF;

  -- Verify schedule_items.schedule_date column exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'schedule_items'
      AND column_name = 'schedule_date'
  ) THEN
    RAISE NOTICE '✓ schedule_items.schedule_date column added successfully';
  ELSE
    RAISE EXCEPTION '✗ Failed to add schedule_items.schedule_date column';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- If you need to rollback this migration, run:
--
-- BEGIN;
-- ALTER TABLE public.photos DROP COLUMN IF EXISTS is_featured;
-- ALTER TABLE public.schedule_items DROP COLUMN IF EXISTS day_name;
-- ALTER TABLE public.schedule_items DROP COLUMN IF EXISTS schedule_date;
-- DROP INDEX IF EXISTS public.idx_photos_is_featured;
-- DROP INDEX IF EXISTS public.idx_schedule_items_day_name;
-- COMMIT;
-- ═══════════════════════════════════════════════════════════════════════
