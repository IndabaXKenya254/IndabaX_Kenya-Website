-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Update All Speakers to 2025
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: January 8, 2026
-- Purpose: Update all existing speakers to have speaker_year = 2025
-- Reason: Client feedback - All speakers provided spoke in 2025, need consistent year
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Update all speakers to have speaker_year = 2025
UPDATE speakers
SET speaker_year = 2025
WHERE speaker_year IS NULL OR speaker_year != 2025;

-- Log the number of affected rows
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Updated % speakers to year 2025', affected_count;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT speaker_year, COUNT(*) as count
-- FROM speakers
-- GROUP BY speaker_year
-- ORDER BY speaker_year;
