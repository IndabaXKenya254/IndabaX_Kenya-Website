-- ============================================================================
-- MIGRATION: Add Event Category and FAQ Classification
-- ============================================================================
-- Created: December 14, 2025
-- Purpose: Support NOAI/IndabaX event separation and FAQ categorization
-- Changes:
--   1. Add event_category column to events table (indabax/noai/general)
--   2. Add classification column to faqs table (website/noai)
--   3. Add indexes for performance
--   4. Add application_form_url for flexibility (Google Forms or built-in)
-- ============================================================================

-- ============================================================================
-- 1. ADD EVENT_CATEGORY TO EVENTS TABLE
-- ============================================================================

-- Add event_category column
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_category VARCHAR(50) DEFAULT 'general'
CHECK (event_category IN ('indabax', 'noai', 'general'));

-- Add optional Google Form URL (when not using built-in forms)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS application_form_url TEXT;

-- Add year field for easier querying (derived from start_date but explicit)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_year INTEGER;

-- Add comments
COMMENT ON COLUMN public.events.event_category IS 'Event category: indabax (main conference), noai (olympiad), general (other events)';
COMMENT ON COLUMN public.events.application_form_url IS 'Optional: Google Form URL if not using built-in form templates';
COMMENT ON COLUMN public.events.event_year IS 'Year of the event (e.g., 2026) for easy filtering by year';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_year ON public.events(event_year);
CREATE INDEX IF NOT EXISTS idx_events_category_year ON public.events(event_category, event_year);

-- ============================================================================
-- 2. ADD CLASSIFICATION TO FAQS TABLE
-- ============================================================================

-- Add classification column
ALTER TABLE public.faqs
ADD COLUMN IF NOT EXISTS classification VARCHAR(20) DEFAULT 'website'
CHECK (classification IN ('website', 'noai'));

-- Add comment
COMMENT ON COLUMN public.faqs.classification IS 'FAQ classification: website (general site FAQs), noai (NOAI-specific FAQs)';

-- Create index
CREATE INDEX IF NOT EXISTS idx_faqs_classification ON public.faqs(classification);

-- Create index for combined filtering (category + classification)
CREATE INDEX IF NOT EXISTS idx_faqs_category_classification ON public.faqs(category, classification);

-- ============================================================================
-- 3. UPDATE EXISTING DATA (OPTIONAL - RUN MANUALLY IF NEEDED)
-- ============================================================================

-- Update event_year for existing events (derive from start_date)
UPDATE public.events
SET event_year = EXTRACT(YEAR FROM start_date)::INTEGER
WHERE event_year IS NULL AND start_date IS NOT NULL;

-- Set default category for existing events
UPDATE public.events
SET event_category = 'general'
WHERE event_category IS NULL;

-- ============================================================================
-- 4. HELPER FUNCTION: Auto-set event_year from start_date
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_event_year()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set event_year when start_date changes
  IF NEW.start_date IS NOT NULL THEN
    NEW.event_year := EXTRACT(YEAR FROM NEW.start_date)::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update event_year
DROP TRIGGER IF EXISTS trigger_set_event_year ON public.events;
CREATE TRIGGER trigger_set_event_year
  BEFORE INSERT OR UPDATE OF start_date
  ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_event_year();

-- ============================================================================
-- 5. VERIFICATION QUERIES (RUN AFTER MIGRATION)
-- ============================================================================

-- Verify events table structure
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'events'
--   AND column_name IN ('event_category', 'application_form_url', 'event_year')
-- ORDER BY ordinal_position;

-- Verify faqs table structure
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'faqs'
--   AND column_name = 'classification'
-- ORDER BY ordinal_position;

-- Count events by category
-- SELECT event_category, COUNT(*) as count
-- FROM public.events
-- GROUP BY event_category
-- ORDER BY count DESC;

-- Count FAQs by classification
-- SELECT classification, COUNT(*) as count
-- FROM public.faqs
-- GROUP BY classification
-- ORDER BY count DESC;

-- ============================================================================
-- ROLLBACK (IF NEEDED)
-- ============================================================================

-- DROP TRIGGER IF EXISTS trigger_set_event_year ON public.events;
-- DROP FUNCTION IF EXISTS public.set_event_year();
-- DROP INDEX IF EXISTS idx_events_category;
-- DROP INDEX IF EXISTS idx_events_year;
-- DROP INDEX IF EXISTS idx_events_category_year;
-- DROP INDEX IF EXISTS idx_faqs_classification;
-- DROP INDEX IF EXISTS idx_faqs_category_classification;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS event_category;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS application_form_url;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS event_year;
-- ALTER TABLE public.faqs DROP COLUMN IF EXISTS classification;
