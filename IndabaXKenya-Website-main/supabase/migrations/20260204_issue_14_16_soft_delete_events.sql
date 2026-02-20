-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - SOFT DELETE FOR EVENTS (Issues #14 & #16)
-- ═══════════════════════════════════════════════════════════════════════════
-- Problem: CASCADE DELETE on events table destroys all reviewer assignments
--          and form responses when an event is deleted
--
-- Solution: Implement soft-delete pattern:
--   1. Add deleted_at column to events table
--   2. Change CASCADE DELETE to SET NULL on reviewers.event_id
--   3. Change CASCADE DELETE to SET NULL on form_responses.event_id
--   4. Update views to exclude soft-deleted events by default
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add soft-delete column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.events.deleted_at IS 'Soft-delete timestamp. NULL = active, non-NULL = deleted.';

-- 2. Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON public.events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(deleted_at) WHERE deleted_at IS NULL;

-- 3. Update reviewers FK to SET NULL instead of CASCADE DELETE
-- First drop the existing constraint, then recreate with SET NULL
DO $$
BEGIN
  -- Check if the constraint exists before trying to drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviewers_event_id_fkey'
    AND table_name = 'reviewers'
  ) THEN
    ALTER TABLE public.reviewers DROP CONSTRAINT reviewers_event_id_fkey;
  END IF;

  -- Add the new constraint with SET NULL
  ALTER TABLE public.reviewers
    ADD CONSTRAINT reviewers_event_id_fkey
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE SET NULL;

  -- Make event_id nullable if it isn't already
  ALTER TABLE public.reviewers ALTER COLUMN event_id DROP NOT NULL;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update reviewers FK: %', SQLERRM;
END $$;

-- 4. Update form_responses FK to SET NULL instead of CASCADE DELETE
DO $$
BEGIN
  -- Check if the constraint exists before trying to drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'form_responses_event_id_fkey'
    AND table_name = 'form_responses'
  ) THEN
    ALTER TABLE public.form_responses DROP CONSTRAINT form_responses_event_id_fkey;
  END IF;

  -- Add the new constraint with SET NULL
  ALTER TABLE public.form_responses
    ADD CONSTRAINT form_responses_event_id_fkey
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE SET NULL;

  -- Make event_id nullable if it isn't already
  ALTER TABLE public.form_responses ALTER COLUMN event_id DROP NOT NULL;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update form_responses FK: %', SQLERRM;
END $$;

-- 5. Create helper function for soft-delete
CREATE OR REPLACE FUNCTION soft_delete_event(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.events
  SET deleted_at = NOW()
  WHERE id = p_event_id
  AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

-- 6. Create helper function to restore deleted event
CREATE OR REPLACE FUNCTION restore_event(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.events
  SET deleted_at = NULL
  WHERE id = p_event_id
  AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$;

-- 7. Create view for active events only (excludes soft-deleted)
CREATE OR REPLACE VIEW public.active_events AS
SELECT *
FROM public.events
WHERE deleted_at IS NULL;

COMMENT ON VIEW public.active_events IS 'View showing only active (non-deleted) events';

-- 8. Grant permissions on new view
GRANT SELECT ON public.active_events TO authenticated;
GRANT SELECT ON public.active_events TO anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- SUMMARY OF CHANGES
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Issues Fixed:
-- - #14: Reviewer records are now preserved when events are deleted (SET NULL)
-- - #16: Application records are now preserved when events are deleted (SET NULL)
--
-- New Columns:
-- - events.deleted_at: Soft-delete timestamp
--
-- Changed FK Constraints:
-- - reviewers.event_id: ON DELETE CASCADE → ON DELETE SET NULL
-- - form_responses.event_id: ON DELETE CASCADE → ON DELETE SET NULL
--
-- New Functions:
-- - soft_delete_event(event_id): Marks event as deleted
-- - restore_event(event_id): Restores deleted event
--
-- New View:
-- - active_events: Shows only non-deleted events
--
-- API Changes Required:
-- - Update DELETE /api/admin/events/[id] to call soft_delete_event()
-- - Update event list queries to use active_events view or filter by deleted_at IS NULL
-- ═══════════════════════════════════════════════════════════════════════════
