-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Correct foreign key constraint on review_locks table
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Fix review_locks foreign key - should reference form_responses, not registrations
-- Date: 2025-11-21 14:10
-- Issue: Foreign key points to wrong table (registrations instead of form_responses)
-- Solution: Drop wrong constraint and add correct one

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE public.review_locks
DROP CONSTRAINT IF EXISTS review_locks_registration_id_fkey;

-- Step 2: Add the correct foreign key constraint
-- registration_id should reference form_responses.id (not registrations.id)
ALTER TABLE public.review_locks
ADD CONSTRAINT review_locks_registration_id_fkey
  FOREIGN KEY (registration_id)
  REFERENCES public.form_responses(id)
  ON DELETE CASCADE;

-- Step 3: Verify the constraint is correct
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
  v_referenced_table TEXT;
BEGIN
  -- Check if constraint exists and points to form_responses
  SELECT
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'review_locks'
        AND tc.constraint_name = 'review_locks_registration_id_fkey'
        AND ccu.table_name = 'form_responses'
    ),
    ccu.table_name
  INTO v_constraint_exists, v_referenced_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.table_name = 'review_locks'
    AND tc.constraint_name = 'review_locks_registration_id_fkey'
  LIMIT 1;

  IF v_constraint_exists AND v_referenced_table = 'form_responses' THEN
    RAISE NOTICE '✅ Foreign key constraint fixed successfully';
    RAISE NOTICE '   review_locks.registration_id now references form_responses.id';
  ELSE
    RAISE WARNING '⚠️  Foreign key may not be correctly configured';
    RAISE WARNING '   Current reference: %', v_referenced_table;
  END IF;
END $$;

-- Step 4: Add comment to document the relationship
COMMENT ON CONSTRAINT review_locks_registration_id_fkey ON public.review_locks IS
'Foreign key to form_responses table.
Ensures registration_id always points to a valid form response.
ON DELETE CASCADE means lock is automatically removed when form response is deleted.';
