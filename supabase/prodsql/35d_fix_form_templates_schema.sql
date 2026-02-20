-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #35d: FIX FORM_TEMPLATES TABLE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Fix form_templates table schema to match dev
-- Run Order: AFTER 35c_add_missing_tables.sql
--            BEFORE 42_performance_optimization_indexes.sql
--
-- Problem: File 35 created form_templates with wrong columns:
--   - Missing: is_locked, locked_to_event_id, usage_type
--   - Wrong: template_data, is_active (should not exist)
--
-- Root Cause: File 35 used old schema instead of redesigned schema
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════

-- Add is_locked column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_templates'
      AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE public.form_templates
    ADD COLUMN is_locked BOOLEAN DEFAULT FALSE NOT NULL;

    RAISE NOTICE 'Added is_locked column to form_templates';
  END IF;
END $$;

-- Add locked_to_event_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_templates'
      AND column_name = 'locked_to_event_id'
  ) THEN
    ALTER TABLE public.form_templates
    ADD COLUMN locked_to_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

    RAISE NOTICE 'Added locked_to_event_id column to form_templates';
  END IF;
END $$;

-- Add usage_type column (CRITICAL - needed by file 42)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_templates'
      AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE public.form_templates
    ADD COLUMN usage_type VARCHAR(50) NOT NULL DEFAULT 'custom';

    RAISE NOTICE 'Added usage_type column to form_templates';
  END IF;
END $$;

-- Add settings column if missing (should exist but verify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_templates'
      AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.form_templates
    ADD COLUMN settings JSONB DEFAULT '{
      "validityPeriodDays": 7,
      "autoSave": true,
      "allowResume": true,
      "showProgress": true
    }'::jsonb;

    RAISE NOTICE 'Added settings column to form_templates';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- REMOVE WRONG COLUMNS (if they exist)
-- ═══════════════════════════════════════════════════════════════════════

-- Drop template_data if it exists (wrong column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_templates'
      AND column_name = 'template_data'
  ) THEN
    ALTER TABLE public.form_templates
    DROP COLUMN template_data;

    RAISE NOTICE 'Dropped wrong column template_data from form_templates';
  END IF;
END $$;

-- Drop is_active if it exists (wrong column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_templates'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.form_templates
    DROP COLUMN is_active;

    RAISE NOTICE 'Dropped wrong column is_active from form_templates';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- FIX CREATED_BY FOREIGN KEY
-- ═══════════════════════════════════════════════════════════════════════

-- Drop old FK if it references auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'form_templates'
      AND constraint_name = 'form_templates_created_by_fkey'
  ) THEN
    -- Check if it references auth.users (wrong)
    IF EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage
      WHERE constraint_schema = 'public'
        AND constraint_name = 'form_templates_created_by_fkey'
        AND table_schema = 'auth'
        AND table_name = 'users'
    ) THEN
      ALTER TABLE public.form_templates
      DROP CONSTRAINT form_templates_created_by_fkey;

      RAISE NOTICE 'Dropped old FK constraint (referenced auth.users)';
    END IF;
  END IF;
END $$;

-- Add correct FK to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'form_templates'
      AND constraint_name = 'form_templates_created_by_fkey'
  ) THEN
    ALTER TABLE public.form_templates
    ADD CONSTRAINT form_templates_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.user_profiles(id);

    RAISE NOTICE 'Added correct FK constraint (references user_profiles)';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- ADD COMMENTS
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN public.form_templates.usage_type IS 'initial_interest | detailed_survey | paper_submission | custom';
COMMENT ON COLUMN public.form_templates.settings IS 'JSON settings: validityPeriodDays, autoSave, allowResume, showProgress';
COMMENT ON COLUMN public.form_templates.is_locked IS 'Whether template is locked to a specific event';
COMMENT ON COLUMN public.form_templates.locked_to_event_id IS 'If locked, which event this template belongs to';


-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #35d: Form Templates Schema Fixed';
  RAISE NOTICE '   Added columns:';
  RAISE NOTICE '     - is_locked (BOOLEAN)';
  RAISE NOTICE '     - locked_to_event_id (UUID FK to events)';
  RAISE NOTICE '     - usage_type (VARCHAR) ← CRITICAL for file 42';
  RAISE NOTICE '     - settings (JSONB) if missing';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Removed wrong columns:';
  RAISE NOTICE '     - template_data (if existed)';
  RAISE NOTICE '     - is_active (if existed)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Fixed: created_by FK now references user_profiles';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run file 42_performance_optimization_indexes.sql';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
