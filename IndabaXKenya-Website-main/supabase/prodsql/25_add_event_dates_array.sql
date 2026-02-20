-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD EVENT DATES ARRAY
-- ═══════════════════════════════════════════════════════════════════════
-- Add flexible date array for precise event scheduling (complements weekend flags)
-- Created: 2025-10-24
--
-- LOGIC:
-- - Keep includes_saturday/includes_sunday for quick setup (simple cases)
-- - Add event_dates for precise date selection (complex schedules)
-- - If event_dates is populated, use it; otherwise use weekend flags
-- - This gives users both quick config AND precise control

-- ============================================================================
-- 1. ADD EVENT_DATES COLUMN
-- ============================================================================

-- Add column to store exact dates when event runs
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_dates JSONB DEFAULT NULL;

COMMENT ON COLUMN public.events.event_dates IS 'Array of specific dates when the event runs (e.g., ["2025-01-15", "2025-01-16", "2025-01-17"]). If NULL, assumes all dates between start_date and end_date.';

-- ============================================================================
-- 2. OPTIONAL: MIGRATION FUNCTION TO POPULATE FROM WEEKEND FLAGS
-- ============================================================================

-- For existing events, generate event_dates from start/end dates and weekend flags
-- This preserves existing event configurations
CREATE OR REPLACE FUNCTION populate_event_dates() RETURNS void AS $$
DECLARE
    event_record RECORD;
    iter_date DATE;
    dates_array JSONB;
BEGIN
    FOR event_record IN SELECT id, start_date, end_date, includes_saturday, includes_sunday FROM public.events WHERE event_dates IS NULL
    LOOP
        dates_array := '[]'::jsonb;
        iter_date := event_record.start_date;

        WHILE iter_date <= event_record.end_date LOOP
            -- Check if this date should be included
            IF (EXTRACT(DOW FROM iter_date) = 0 AND event_record.includes_sunday) OR  -- Sunday
               (EXTRACT(DOW FROM iter_date) = 6 AND event_record.includes_saturday) OR  -- Saturday
               (EXTRACT(DOW FROM iter_date) NOT IN (0, 6)) THEN  -- Weekday
                dates_array := dates_array || to_jsonb(iter_date::text);
            END IF;

            iter_date := iter_date + INTERVAL '1 day';
        END LOOP;

        UPDATE public.events SET event_dates = dates_array WHERE id = event_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration (comment out if you don't want to auto-populate)
SELECT populate_event_dates();

-- Drop the temporary function
DROP FUNCTION populate_event_dates();

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================

-- Show sample data
SELECT id, title, start_date, end_date, 
       includes_saturday, includes_sunday,
       event_dates,
       jsonb_array_length(event_dates) as num_event_days
FROM public.events
LIMIT 5;
