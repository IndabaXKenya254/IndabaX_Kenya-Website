-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #41c: FIX ACTIVITY_LOGS COLUMN NAME
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Rename actor_id to user_id in activity_logs table
-- Run Order: AFTER 41b_add_event_registration_columns.sql
--            BEFORE 42_performance_optimization_indexes.sql
-- ═══════════════════════════════════════════════════════════════════════

-- Check if column needs to be renamed
DO $$
BEGIN
  -- Check if actor_id exists and user_id doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_logs'
      AND column_name = 'actor_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_logs'
      AND column_name = 'user_id'
  ) THEN
    -- Rename the column
    ALTER TABLE public.activity_logs
    RENAME COLUMN actor_id TO user_id;

    RAISE NOTICE 'Renamed activity_logs.actor_id to user_id';
  ELSE
    RAISE NOTICE 'Column already correct (user_id exists or actor_id does not exist)';
  END IF;
END $$;

-- Update the foreign key constraint to reference user_profiles instead of auth.users
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'activity_logs'
      AND constraint_name = 'activity_logs_actor_id_fkey'
  ) THEN
    ALTER TABLE public.activity_logs
    DROP CONSTRAINT activity_logs_actor_id_fkey;

    RAISE NOTICE 'Dropped old constraint activity_logs_actor_id_fkey';
  END IF;

  -- Add new constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'activity_logs'
      AND constraint_name = 'activity_logs_user_id_fkey'
  ) THEN
    ALTER TABLE public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Added constraint activity_logs_user_id_fkey';
  END IF;
END $$;

-- Make user_id nullable if it's not already
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_logs'
      AND column_name = 'user_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.activity_logs
    ALTER COLUMN user_id DROP NOT NULL;

    RAISE NOTICE 'Made user_id nullable';
  END IF;
END $$;

-- Add missing columns from dev migration if they don't exist
DO $$
BEGIN
  -- Add user_email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_logs'
      AND column_name = 'user_email'
  ) THEN
    ALTER TABLE public.activity_logs
    ADD COLUMN user_email VARCHAR(255);

    RAISE NOTICE 'Added user_email column';
  END IF;

  -- Rename action to activity_type if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_logs'
      AND column_name = 'action'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_logs'
      AND column_name = 'activity_type'
  ) THEN
    ALTER TABLE public.activity_logs
    RENAME COLUMN action TO activity_type;

    RAISE NOTICE 'Renamed action to activity_type';
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_logs'
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.activity_logs
    ADD COLUMN metadata JSONB;

    RAISE NOTICE 'Added metadata column';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #41c: Activity Logs Column Fixed';
  RAISE NOTICE '   Renamed: actor_id → user_id';
  RAISE NOTICE '   Updated: Foreign key constraint';
  RAISE NOTICE '   Added: user_email, metadata columns';
  RAISE NOTICE '   Renamed: action → activity_type';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run migration 42 (should work now)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
