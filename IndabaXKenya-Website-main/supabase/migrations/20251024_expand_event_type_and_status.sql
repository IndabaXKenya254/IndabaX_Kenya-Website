-- ============================================================================
-- MIGRATION: Expand Event Type and Status Enums
-- ============================================================================
-- Created: 2025-10-24
-- Description: Update event_type and status constraints to include new values
-- ============================================================================

-- Drop the old event_type constraint
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Add new event_type constraint with expanded values
ALTER TABLE public.events
ADD CONSTRAINT events_event_type_check
CHECK (event_type IN ('upcoming', 'past', 'workshop', 'conference', 'meetup'));

-- Drop the old status constraint
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_status_check;

-- Add new status constraint with expanded values
ALTER TABLE public.events
ADD CONSTRAINT events_status_check
CHECK (status IN ('draft', 'published', 'archived', 'upcoming'));

COMMENT ON COLUMN public.events.event_type IS 'Type of event: upcoming, past, workshop, conference, meetup';
COMMENT ON COLUMN public.events.status IS 'Publication status: draft, published, archived, upcoming';
