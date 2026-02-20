-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - FIX REVIEWER DATA RETENTION ON EVENT DELETE
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Change reviewers.event_id from ON DELETE CASCADE to ON DELETE SET NULL
-- Created: 2026-02-12
-- Issue: #14 - Retain reviewer records after event deletion
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PROBLEM:
-- When an event is deleted, all reviewer records for that event are CASCADE deleted.
-- This means reviewers with role='reviewer' in user_profiles lose their assignment history.
-- The reviewer still has role='reviewer' but no entry in the reviewers table.
--
-- SOLUTION:
-- 1. Make event_id nullable in reviewers table
-- 2. Change ON DELETE CASCADE to ON DELETE SET NULL
-- This preserves reviewer records when events are deleted, they just become "unassigned"
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Make event_id nullable
ALTER TABLE public.reviewers
ALTER COLUMN event_id DROP NOT NULL;

-- Step 2: Drop the existing foreign key constraint
-- The constraint name may vary, so we drop by finding it
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name for event_id
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'reviewers'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'event_id'
        AND tc.table_schema = 'public';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.reviewers DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found for event_id';
    END IF;
END $$;

-- Step 3: Add new foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.reviewers
ADD CONSTRAINT reviewers_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE SET NULL;

-- Step 4: Update the unique constraint to handle NULL event_id
-- The existing unique constraint UNIQUE(user_id, event_id) won't work properly with NULLs
-- We need to use a partial unique index instead

-- Drop the existing unique constraint
ALTER TABLE public.reviewers
DROP CONSTRAINT IF EXISTS unique_reviewer_event;

-- Create a partial unique index that allows multiple NULL event_id entries
-- but still prevents duplicates for the same user and non-null event
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reviewer_event
ON public.reviewers(user_id, event_id)
WHERE event_id IS NOT NULL;

-- Also allow only one "unassigned" entry per user (optional - comment out if you want multiple unassigned)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_unassigned_reviewer
-- ON public.reviewers(user_id)
-- WHERE event_id IS NULL;

-- Step 5: Add a comment documenting this change
COMMENT ON COLUMN public.reviewers.event_id IS
'Event assignment for this reviewer. NULL means unassigned/global reviewer. Changed from ON DELETE CASCADE to ON DELETE SET NULL in Issue #14 fix.';

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE - Reviewer records will now persist when events are deleted
-- ═══════════════════════════════════════════════════════════════════════════
