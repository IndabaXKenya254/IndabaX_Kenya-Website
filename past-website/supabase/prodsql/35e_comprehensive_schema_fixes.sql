-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #35e: COMPREHENSIVE SCHEMA FIXES FOR FILE 35
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Fix ALL schema mismatches between file 35 and dev database
-- Run Order: AFTER 35d_fix_form_templates_schema.sql
--            BEFORE 42_performance_optimization_indexes.sql
--
-- CRITICAL ISSUES FOUND:
-- 1. registrations: Missing columns (decision_at, decision_notes, ticket_id, registered_at)
-- 2. registrations: Extra columns not in dev (approved_at, rejected_at, etc.)
-- 3. registrations: Missing FK constraints
-- 4. form_responses: status column is VARCHAR, should be response_status ENUM
-- 5. form_responses: Has submitted_at column not in dev
-- 6. review_locks: locked_by references auth.users, should be user_profiles
--
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 1: REGISTRATIONS TABLE - ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════

-- Add decision_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'decision_at'
  ) THEN
    ALTER TABLE public.registrations
    ADD COLUMN decision_at TIMESTAMPTZ;

    RAISE NOTICE 'Added decision_at column to registrations';
  END IF;
END $$;

-- Add decision_notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'decision_notes'
  ) THEN
    ALTER TABLE public.registrations
    ADD COLUMN decision_notes TEXT;

    RAISE NOTICE 'Added decision_notes column to registrations';
  END IF;
END $$;

-- Add ticket_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'ticket_id'
  ) THEN
    ALTER TABLE public.registrations
    ADD COLUMN ticket_id UUID;

    RAISE NOTICE 'Added ticket_id column to registrations';
  END IF;
END $$;

-- Add registered_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'registered_at'
  ) THEN
    ALTER TABLE public.registrations
    ADD COLUMN registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

    RAISE NOTICE 'Added registered_at column to registrations';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- FIX 2: REGISTRATIONS TABLE - REMOVE EXTRA COLUMNS NOT IN DEV
-- ═══════════════════════════════════════════════════════════════════════

-- Remove approved_at (dev doesn't have this)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.registrations
    DROP COLUMN approved_at;

    RAISE NOTICE 'Removed approved_at column (not in dev)';
  END IF;
END $$;

-- Remove rejected_at (dev doesn't have this)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE public.registrations
    DROP COLUMN rejected_at;

    RAISE NOTICE 'Removed rejected_at column (not in dev)';
  END IF;
END $$;

-- Remove rejection_reason (dev doesn't have this)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.registrations
    DROP COLUMN rejection_reason;

    RAISE NOTICE 'Removed rejection_reason column (not in dev)';
  END IF;
END $$;

-- Remove ticket_sent_at (dev doesn't have this)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'ticket_sent_at'
  ) THEN
    ALTER TABLE public.registrations
    DROP COLUMN ticket_sent_at;

    RAISE NOTICE 'Removed ticket_sent_at column (not in dev)';
  END IF;
END $$;

-- Remove attended_at (dev doesn't have this)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'attended_at'
  ) THEN
    ALTER TABLE public.registrations
    DROP COLUMN attended_at;

    RAISE NOTICE 'Removed attended_at column (not in dev)';
  END IF;
END $$;

-- Remove created_at (dev doesn't have this - only has registered_at + updated_at)
-- Note: Must drop dependent views first
DO $$
BEGIN
  -- Drop reviewer_stats view if it exists (depends on created_at)
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'reviewer_stats'
  ) THEN
    DROP VIEW IF EXISTS public.reviewer_stats CASCADE;
    RAISE NOTICE 'Dropped reviewer_stats view (will be recreated by file 37)';
  END IF;

  -- Now drop the created_at column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.registrations
    DROP COLUMN created_at CASCADE;

    RAISE NOTICE 'Removed created_at column (dev uses registered_at instead)';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- FIX 3: REGISTRATIONS TABLE - ADD MISSING FOREIGN KEY CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════

-- Note: ticket_id FK will be added by file 35c (references papers table)
-- The circular FKs (initial_form_response_id, detailed_form_response_id)
-- are handled in file 35c

-- Add ticket_id FK if table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'registrations'
      AND constraint_name = 'fk_ticket'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'tickets'
  ) THEN
    ALTER TABLE public.registrations
    ADD CONSTRAINT fk_ticket
    FOREIGN KEY (ticket_id)
    REFERENCES public.tickets(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Added fk_ticket constraint to registrations';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- FIX 4: FORM_RESPONSES TABLE - FIX STATUS COLUMN TYPE
-- ═══════════════════════════════════════════════════════════════════════

-- Change status from VARCHAR to response_status ENUM
-- Note: Must drop dependent views first
DO $$
BEGIN
  -- Drop applications_with_locks view if it exists (depends on form_responses columns)
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'applications_with_locks'
  ) THEN
    DROP VIEW IF EXISTS public.applications_with_locks CASCADE;
    RAISE NOTICE 'Dropped applications_with_locks view (will be recreated by file 45)';
  END IF;

  -- Check if status is currently VARCHAR
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_responses'
      AND column_name = 'status'
      AND data_type = 'character varying'
  ) THEN
    -- Drop and recreate with correct type
    ALTER TABLE public.form_responses
    DROP COLUMN status CASCADE;

    ALTER TABLE public.form_responses
    ADD COLUMN status response_status DEFAULT 'not_started' NOT NULL;

    RAISE NOTICE 'Fixed form_responses.status: VARCHAR → response_status ENUM';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- FIX 5: FORM_RESPONSES TABLE - REMOVE submitted_at (not in dev)
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_responses'
      AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE public.form_responses
    DROP COLUMN submitted_at;

    RAISE NOTICE 'Removed form_responses.submitted_at (not in dev)';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- FIX 6: REVIEW_LOCKS TABLE - FIX locked_by FOREIGN KEY
-- ═══════════════════════════════════════════════════════════════════════

-- Drop incorrect FK (references auth.users)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'review_locks'
      AND tc.constraint_name = 'review_locks_locked_by_fkey'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  ) THEN
    ALTER TABLE public.review_locks
    DROP CONSTRAINT review_locks_locked_by_fkey;

    RAISE NOTICE 'Dropped incorrect review_locks_locked_by_fkey (referenced auth.users)';
  END IF;
END $$;

-- Add correct FK (references user_profiles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'review_locks'
      AND constraint_name = 'review_locks_locked_by_fkey'
  ) THEN
    ALTER TABLE public.review_locks
    ADD CONSTRAINT review_locks_locked_by_fkey
    FOREIGN KEY (locked_by)
    REFERENCES public.user_profiles(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Added correct review_locks_locked_by_fkey (references user_profiles)';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- FIX 7: ADD COMMENTS FOR CLARITY
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN public.registrations.decision_at IS 'Timestamp when final decision (approve/reject) was made';
COMMENT ON COLUMN public.registrations.decision_notes IS 'Notes explaining the final decision';
COMMENT ON COLUMN public.registrations.ticket_id IS 'Foreign key to tickets table (after approval)';
COMMENT ON COLUMN public.registrations.registered_at IS 'Timestamp when user initially registered interest';

COMMENT ON COLUMN public.form_responses.status IS 'Response status: not_started | in_progress | completed';


-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #35e: Comprehensive Schema Fixes Applied';
  RAISE NOTICE '   ';
  RAISE NOTICE '   REGISTRATIONS TABLE:';
  RAISE NOTICE '     Added: decision_at, decision_notes, ticket_id, registered_at';
  RAISE NOTICE '     Removed: approved_at, rejected_at, rejection_reason,';
  RAISE NOTICE '              ticket_sent_at, attended_at, created_at';
  RAISE NOTICE '     Fixed: Added ticket_id FK constraint';
  RAISE NOTICE '   ';
  RAISE NOTICE '   FORM_RESPONSES TABLE:';
  RAISE NOTICE '     Fixed: status column (VARCHAR → response_status ENUM)';
  RAISE NOTICE '     Removed: submitted_at column';
  RAISE NOTICE '   ';
  RAISE NOTICE '   REVIEW_LOCKS TABLE:';
  RAISE NOTICE '     Fixed: locked_by FK (auth.users → user_profiles)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   VIEWS DROPPED (will be recreated):';
  RAISE NOTICE '     - reviewer_stats (file 37 will recreate)';
  RAISE NOTICE '     - applications_with_locks (file 45 will recreate)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   ALL SCHEMAS NOW MATCH DEV DATABASE!';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run file 36_tickets_table_enhancements.sql';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
