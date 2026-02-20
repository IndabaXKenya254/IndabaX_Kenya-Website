-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Remove duplicate schedule items
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Delete duplicate schedule_items records (migration was run twice)
-- Date: 2025-10-23
-- Issue: Mock data migration created duplicates

BEGIN;

-- Delete duplicates, keeping only the oldest record (by created_at) for each unique session
DELETE FROM public.schedule_items
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY day_number, start_time, end_time, title, location
        ORDER BY created_at ASC
      ) as row_num
    FROM public.schedule_items
  ) t
  WHERE row_num > 1
);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
-- Run this query to verify no duplicates remain:
--
-- SELECT day_number, start_time, end_time, title, location, COUNT(*) as count
-- FROM public.schedule_items
-- GROUP BY day_number, start_time, end_time, title, location
-- HAVING COUNT(*) > 1;
--
-- Expected: 0 rows (no duplicates)

-- Check total count:
-- SELECT COUNT(*) FROM public.schedule_items;
-- Expected: ~19 records
