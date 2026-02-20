-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD WEEKEND FIELDS TO EVENTS
-- ═══════════════════════════════════════════════════════════════════════
-- Add fields to track if event runs on weekends for accurate day calculation
-- Created: 2025-10-24

-- ============================================================================
-- 1. ADD WEEKEND FIELDS TO EVENTS TABLE
-- ============================================================================

-- Add columns to track if event runs on weekends
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS includes_saturday BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS includes_sunday BOOLEAN DEFAULT true;

-- Set default values for existing events (assume they include weekends)
UPDATE public.events
SET includes_saturday = true,
    includes_sunday = true
WHERE includes_saturday IS NULL OR includes_sunday IS NULL;

-- ============================================================================
-- 2. ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.events.includes_saturday IS 'Whether the event runs on Saturdays (for accurate day count calculation)';
COMMENT ON COLUMN public.events.includes_sunday IS 'Whether the event runs on Sundays (for accurate day count calculation)';

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================

-- Show updated events table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events'
  AND column_name IN ('includes_saturday', 'includes_sunday')
ORDER BY column_name;

-- Show sample data
SELECT id, title, start_date, end_date, includes_saturday, includes_sunday
FROM public.events
LIMIT 5;
