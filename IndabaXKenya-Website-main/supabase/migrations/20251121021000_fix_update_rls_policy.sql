-- ═══════════════════════════════════════════════════════════════════════
-- FIX FORM RESPONSES UPDATE RLS POLICY
-- ═══════════════════════════════════════════════════════════════════════
-- Allow users to update their responses AND change status to completed

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Allow authenticated users to update own form responses" ON form_responses;

-- Create new update policy that allows completing forms
CREATE POLICY "Allow authenticated users to update own form responses"
ON form_responses
FOR UPDATE
TO authenticated
USING (
  -- Can update own responses (regardless of status)
  respondent_email = auth.email()
)
WITH CHECK (
  -- Can only update to in_progress or completed, and email must match
  respondent_email = auth.email()
  AND status IN ('in_progress', 'completed')
);
