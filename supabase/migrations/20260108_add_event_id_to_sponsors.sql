-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add event_id to Sponsors Table
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: January 8, 2026
-- Purpose: Add event_id foreign key to sponsors table for event-specific filtering
-- Reason: Client feedback #9 - Categorize sponsors by event only, not by year
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Add event_id column to sponsors table (nullable for backward compatibility)
ALTER TABLE sponsors
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sponsors_event_id ON sponsors(event_id);

-- Add comment to document the change
COMMENT ON COLUMN sponsors.event_id IS 'Links sponsor to a specific event. NULL means sponsor appears across all events (global sponsor).';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTES FOR MANUAL ASSIGNMENT
-- ═══════════════════════════════════════════════════════════════════════════
-- After running this migration, you can assign sponsors to specific events:
--
-- UPDATE sponsors
-- SET event_id = (SELECT id FROM events WHERE title LIKE '%2025%' LIMIT 1)
-- WHERE name IN ('Sponsor Name 1', 'Sponsor Name 2');
--
-- Or keep event_id NULL for sponsors that should appear on all events
-- ═══════════════════════════════════════════════════════════════════════════
