-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ISSUE #17: REVIEWER RECORD RETENTION
-- ═══════════════════════════════════════════════════════════════════════════
-- Adds is_active column to reviewers table so admins can deactivate
-- reviewers without losing their historical records.
-- Also changes event_id CASCADE to SET NULL to preserve reviewer records
-- when events are hard-deleted.
-- Date: 2026-02-14
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add is_active column (default true for existing reviewers)
ALTER TABLE public.reviewers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- 2. Add deactivated_at timestamp for audit trail
ALTER TABLE public.reviewers
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- 3. Make event_id nullable (for when events are hard-deleted)
ALTER TABLE public.reviewers
ALTER COLUMN event_id DROP NOT NULL;

-- 4. Change event_id foreign key from CASCADE to SET NULL
-- Drop old constraint and recreate with SET NULL
DO $$
BEGIN
  -- Find and drop existing foreign key constraint on event_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'reviewers'
    AND kcu.column_name = 'event_id'
    AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.reviewers DROP CONSTRAINT ' || tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'reviewers'
      AND kcu.column_name = 'event_id'
      AND tc.constraint_type = 'FOREIGN KEY'
      LIMIT 1
    );
  END IF;
END $$;

-- Recreate with ON DELETE SET NULL (preserves reviewer record when event is deleted)
ALTER TABLE public.reviewers
ADD CONSTRAINT reviewers_event_id_fkey
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;

-- 5. Update unique constraint to allow multiple inactive entries
-- Drop old constraint
ALTER TABLE public.reviewers
DROP CONSTRAINT IF EXISTS unique_reviewer_event;

-- Recreate as partial unique index (only enforced for active reviewers)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_reviewer_event
ON public.reviewers (user_id, event_id)
WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════
-- - Added is_active BOOLEAN (default true) to reviewers table
-- - Added deactivated_at TIMESTAMPTZ for audit trail
-- - Changed event_id from NOT NULL to nullable
-- - Changed event_id FK from ON DELETE CASCADE to ON DELETE SET NULL
-- - Changed unique constraint to only enforce for active reviewers
-- ═══════════════════════════════════════════════════════════════════════════
