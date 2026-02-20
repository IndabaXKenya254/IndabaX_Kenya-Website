-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD PAPER_ID TO TICKETS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Migration to support speaker tickets linked to papers
-- Created: December 16, 2025

-- 1. Add paper_id column to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS paper_id uuid REFERENCES papers(id) ON DELETE SET NULL;

-- 2. Make registration_id nullable (for paper-based tickets that don't have registrations)
ALTER TABLE tickets
ALTER COLUMN registration_id DROP NOT NULL;

-- 3. Make user_id nullable (for backwards compatibility)
ALTER TABLE tickets
ALTER COLUMN user_id DROP NOT NULL;

-- 4. Create index on paper_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_paper_id ON tickets(paper_id);

-- 5. Add constraint to ensure either registration_id or paper_id is set
-- (commented out to allow flexibility, can be enabled if needed)
-- ALTER TABLE tickets
-- ADD CONSTRAINT chk_ticket_source
-- CHECK (registration_id IS NOT NULL OR paper_id IS NOT NULL);

COMMENT ON COLUMN tickets.paper_id IS 'Reference to papers table for speaker tickets generated from approved papers';
