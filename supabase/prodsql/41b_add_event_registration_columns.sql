-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #41b: ADD EVENT REGISTRATION COLUMNS
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Add registration_enabled and registration_deadline columns to events table
-- Run Order: AFTER 41_fix_status_display.sql
--            BEFORE 42_performance_optimization_indexes.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. ADD COLUMNS TO EVENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════

-- Add initial_template_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'initial_template_id'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN initial_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL;

    RAISE NOTICE 'Added initial_template_id column to events';
  END IF;
END $$;

-- Add detailed_template_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'detailed_template_id'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN detailed_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL;

    RAISE NOTICE 'Added detailed_template_id column to events';
  END IF;
END $$;

-- Add registration_enabled (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'registration_enabled'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN registration_enabled BOOLEAN DEFAULT TRUE NOT NULL;

    RAISE NOTICE 'Added registration_enabled column to events';
  END IF;
END $$;

-- Add registration_deadline (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'registration_deadline'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN registration_deadline TIMESTAMPTZ;

    RAISE NOTICE 'Added registration_deadline column to events';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. ADD COMMENTS
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN public.events.initial_template_id IS 'Form template for initial interest registration';
COMMENT ON COLUMN public.events.detailed_template_id IS 'Form template for detailed survey (after shortlisting)';
COMMENT ON COLUMN public.events.registration_enabled IS 'Whether registration is currently open for this event';
COMMENT ON COLUMN public.events.registration_deadline IS 'Registration closes at this time';

-- ═══════════════════════════════════════════════════════════════════════
-- 3. CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_events_initial_template ON public.events(initial_template_id);
CREATE INDEX IF NOT EXISTS idx_events_detailed_template ON public.events(detailed_template_id);
CREATE INDEX IF NOT EXISTS idx_events_registration_enabled ON public.events(registration_enabled);

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #41b: Event Registration Columns Added';
  RAISE NOTICE '   Columns added: 4 (initial_template_id, detailed_template_id,';
  RAISE NOTICE '                      registration_enabled, registration_deadline)';
  RAISE NOTICE '   Indexes created: 3';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run migration 42 to add performance indexes';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
