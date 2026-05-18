-- ============================================================================
-- PRODUCTION SQL #46: Add Event Category and FAQ Classification
-- ============================================================================
-- Created: December 14, 2025
-- Purpose: Support NOAI/IndabaX event separation and FAQ categorization
-- Run Order: AFTER 45_fix_security_advisories.sql
--
-- Changes:
--   1. Add event_category column to events table (indabax/noai/general)
--   2. Add classification column to faqs table (website/noai)
--   3. Add indexes for performance
--   4. Add application_form_url for flexibility (Google Forms or built-in)
--   5. Add event_year field with auto-update trigger
-- ============================================================================

-- ============================================================================
-- 1. ADD EVENT_CATEGORY TO EVENTS TABLE
-- ============================================================================

-- Add event_category column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'event_category'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN event_category VARCHAR(50) DEFAULT 'general'
    CHECK (event_category IN ('indabax', 'noai', 'general'));

    RAISE NOTICE 'Added event_category column to events table';
  END IF;
END $$;

-- Add optional Google Form URL (when not using built-in forms)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'application_form_url'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN application_form_url TEXT;

    RAISE NOTICE 'Added application_form_url column to events table';
  END IF;
END $$;

-- Add year field for easier querying (derived from start_date but explicit)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'event_year'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN event_year INTEGER;

    RAISE NOTICE 'Added event_year column to events table';
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.events.event_category IS 'Event category: indabax (main conference), noai (olympiad), general (other events)';
COMMENT ON COLUMN public.events.application_form_url IS 'Optional: Google Form URL if not using built-in form templates';
COMMENT ON COLUMN public.events.event_year IS 'Year of the event (e.g., 2026) for easy filtering by year';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_year ON public.events(event_year);
CREATE INDEX IF NOT EXISTS idx_events_category_year ON public.events(event_category, event_year);

-- ============================================================================
-- 2. ADD CLASSIFICATION TO FAQS TABLE
-- ============================================================================

-- Add classification column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'faqs'
      AND column_name = 'classification'
  ) THEN
    ALTER TABLE public.faqs
    ADD COLUMN classification VARCHAR(20) DEFAULT 'website'
    CHECK (classification IN ('website', 'noai'));

    RAISE NOTICE 'Added classification column to faqs table';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.faqs.classification IS 'FAQ classification: website (general site FAQs), noai (NOAI-specific FAQs)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_faqs_classification ON public.faqs(classification);
CREATE INDEX IF NOT EXISTS idx_faqs_category_classification ON public.faqs(category, classification);

-- ============================================================================
-- 3. UPDATE EXISTING DATA
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
$$ LANGUAGE plpgsql
SET search_path = public;  -- SECURITY FIX: Prevents search_path injection

COMMENT ON FUNCTION public.set_event_year IS 'Auto-updates event_year column when start_date changes';

-- Create trigger to auto-update event_year
DROP TRIGGER IF EXISTS trigger_set_event_year ON public.events;
CREATE TRIGGER trigger_set_event_year
  BEFORE INSERT OR UPDATE OF start_date
  ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_event_year();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #46: Event Category and FAQ Classification';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Events table enhancements:';
  RAISE NOTICE '     ✓ event_category (indabax/noai/general)';
  RAISE NOTICE '     ✓ application_form_url (optional Google Form link)';
  RAISE NOTICE '     ✓ event_year (auto-updated from start_date)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   FAQs table enhancements:';
  RAISE NOTICE '     ✓ classification (website/noai)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Indexes created: 5 total';
  RAISE NOTICE '   Trigger: set_event_year (auto-updates year)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Security: set_event_year function has immutable search_path';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
