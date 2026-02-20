-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Add missing ip_address column to review_locks table
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Fix review_locks table - add ip_address column
-- Date: 2025-11-21 14:00
-- Issue: Table was created without ip_address column
-- Solution: Add the missing column

-- Add the missing ip_address column
ALTER TABLE public.review_locks
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);

-- Add comment to document the column
COMMENT ON COLUMN public.review_locks.ip_address IS
'IP address of the admin who acquired the lock.
Used for audit trail and debugging.
Optional field, can be NULL.';

-- Verify the column exists
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'review_locks'
      AND column_name = 'ip_address'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE NOTICE '✅ ip_address column added successfully to review_locks table';
  ELSE
    RAISE EXCEPTION '❌ Failed to add ip_address column';
  END IF;
END $$;
