-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD INTEREST TEMPLATE TO EVENTS
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251229_add_interest_template_to_events.sql
-- Purpose: Add interest_template_id for collecting interest when event is closed
-- ═══════════════════════════════════════════════════════════════════════

-- Add interest_template_id column for Interest Form (used when event is closed)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS interest_template_id UUID REFERENCES form_templates(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN events.interest_template_id IS 'Form template for collecting interest when event registration is closed';
