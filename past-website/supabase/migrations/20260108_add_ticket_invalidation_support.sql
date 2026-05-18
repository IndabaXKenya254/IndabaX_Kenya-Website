-- ═══════════════════════════════════════════════════════════════════════
-- ADD TICKET INVALIDATION SUPPORT
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Add invalidation tracking columns and new status values
-- Date: 2026-01-08
-- Purpose: Support ticket invalidation when applications are revoked/rejected/waitlisted

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Add invalidation tracking columns
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invalidated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invalidation_reason TEXT;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Update status constraint to include new invalidation statuses
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing constraint
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;

-- Add new constraint with additional status values
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
CHECK (status IN (
  'active',
  'checked_in',
  'cancelled',
  'expired',
  'revoked',      -- NEW: Application approval was revoked
  'rejected',     -- NEW: Application was rejected after approval
  'waitlisted'    -- NEW: Application was moved to waitlist after approval
));

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Add indexes for performance
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tickets_is_valid
ON tickets(is_valid)
WHERE is_valid = false;

CREATE INDEX IF NOT EXISTS idx_tickets_invalidated_at
ON tickets(invalidated_at)
WHERE invalidated_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Add comment for documentation
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN tickets.invalidated_at IS 'Timestamp when ticket was invalidated (revoked/rejected/waitlisted)';
COMMENT ON COLUMN tickets.invalidated_by IS 'Admin user who invalidated the ticket';
COMMENT ON COLUMN tickets.invalidation_reason IS 'Reason for ticket invalidation (e.g., "Application revoked: insufficient experience")';
