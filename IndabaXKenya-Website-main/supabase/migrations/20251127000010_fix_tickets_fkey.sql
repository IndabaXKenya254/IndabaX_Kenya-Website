-- ═══════════════════════════════════════════════════════════════════════
-- Fix tickets.registration_id foreign key to point to form_responses
-- ═══════════════════════════════════════════════════════════════════════
-- Issue: tickets.registration_id references registrations table (unused)
-- Fix: Change to reference form_responses table (active table)

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
