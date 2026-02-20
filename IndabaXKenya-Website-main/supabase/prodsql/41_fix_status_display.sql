-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - FIX STATUS DISPLAY ISSUE
-- ═══════════════════════════════════════════════════════════════════════
-- Created: 2025-11-27
-- Purpose: Ensure status_v2 field is used for display instead of legacy status field
--
-- ISSUE: Application detail page was showing old 'status' field (COMPLETED)
--        instead of new 'status_v2' field (shortlisted/survey_sent)
--
-- SOLUTION:
-- 1. Update UI to prefer status_v2 over status
-- 2. Add workflow progression tracker
-- 3. Map old status values to new status_v2 for consistency
--
-- This migration ensures data consistency for applications that may have
-- been updated using the old status field.
-- ═══════════════════════════════════════════════════════════════════════

-- Update applications where status is 'completed' but status_v2 is NULL
-- Map to 'survey_completed' which is the closest equivalent
UPDATE form_responses
SET status_v2 = 'survey_completed'
WHERE status = 'completed'
  AND status_v2 IS NULL;

-- Note: The following updates were removed because 'accepted', 'pending', 'rejected'
-- are NOT valid values for the response_status enum.
-- The response_status enum only has: not_started, in_progress, completed
-- The registration workflow statuses (pending, approved, rejected) are in status_v2 column only.

-- Update applications where status is 'in_progress' but status_v2 is NULL
-- Map to 'pending' as a reasonable default
UPDATE form_responses
SET status_v2 = 'pending'
WHERE status = 'in_progress'
  AND status_v2 IS NULL;

-- Update applications where status is 'not_started' but status_v2 is NULL
-- Map to 'interested' as the initial state
UPDATE form_responses
SET status_v2 = 'interested'
WHERE status = 'not_started'
  AND status_v2 IS NULL;

-- Add comment explaining the fix
COMMENT ON COLUMN form_responses.status_v2 IS
'Current application status in the multi-stage workflow.
This field should be used for display instead of the legacy "status" field.
Workflow: interested → pending → shortlisted → survey_sent → survey_completed → approved/rejected';

COMMENT ON COLUMN form_responses.status IS
'DEPRECATED: Legacy status field kept for backward compatibility.
Use status_v2 instead. Values: pending, accepted, rejected, completed';
