-- ═══════════════════════════════════════════════════════════════════════
-- Migration 40: Fix Tickets Foreign Key to Point to form_responses
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-11-27
-- Purpose: Fix tickets.registration_id foreign key to reference form_responses
--          instead of registrations table (which is unused)

-- Drop the old foreign key constraint
ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_registration_id_fkey;

-- Add new foreign key constraint pointing to form_responses
ALTER TABLE tickets
ADD CONSTRAINT tickets_registration_id_fkey
FOREIGN KEY (registration_id)
REFERENCES form_responses(id)
ON DELETE CASCADE;

-- Add comment for clarity
COMMENT ON CONSTRAINT tickets_registration_id_fkey ON tickets IS
'References form_responses (active applications table), not registrations (unused table)';

-- ═══════════════════════════════════════════════════════════════════════
-- Summary
-- ═══════════════════════════════════════════════════════════════════════
-- This migration fixes the foreign key constraint on the tickets table to
-- properly reference form_responses instead of the unused registrations table.
-- This enables automatic ticket generation for approved applications.
