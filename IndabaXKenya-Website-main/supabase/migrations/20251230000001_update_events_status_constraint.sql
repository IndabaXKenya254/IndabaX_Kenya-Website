-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Update events status CHECK constraint
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Align database constraint with frontend status values
-- Frontend uses: upcoming, ongoing, past, archived, cancelled, draft, published
-- Database had: draft, published, archived, upcoming
--
-- This adds: ongoing, past, cancelled to allow full frontend functionality

-- Step 1: Drop the existing constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

-- Step 2: Add the updated constraint with all valid values
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status::text = ANY (ARRAY[
    'draft'::text,
    'published'::text,
    'upcoming'::text,
    'ongoing'::text,
    'past'::text,
    'archived'::text,
    'cancelled'::text
  ]));

-- Note: This migration is backwards compatible - no data needs to change
