-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Update form_responses RLS policy for modification control
-- Date: Dec 30, 2025
-- Description: Allow users to modify their responses only if:
--   1. status is 'in_progress' or 'completed' (not reviewed by admin)
--   2. status_v2 is NULL, 'interested', or 'pending' (admin hasn't processed)
--   3. reviewed_by, shortlisted_by, approved_by, rejected_by are all NULL
-- ═══════════════════════════════════════════════════════════════════════

-- Drop the existing update policy
DROP POLICY IF EXISTS "Allow users to update own form responses" ON form_responses;

-- Create updated policy with status_v2 check
CREATE POLICY "Allow users to update own form responses"
ON form_responses
FOR UPDATE
USING (
  -- User must own the response (by user_id or email)
  (user_id = auth.uid() OR (respondent_email)::text = auth.email())
  OR
  -- OR be an admin
  (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::user_role
  ))
)
WITH CHECK (
  -- Admins can always update
  (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::user_role
  ))
  OR
  -- Regular users can only update if:
  (
    -- 1. Basic status is in_progress or completed (not a system status)
    (status = ANY (ARRAY['in_progress'::response_status, 'completed'::response_status]))
    AND
    -- 2. Admin hasn't processed the application (status_v2 is still pending or null)
    (status_v2 IS NULL OR status_v2 = ANY (ARRAY['interested'::registration_status_v2, 'pending'::registration_status_v2]))
    AND
    -- 3. No admin has reviewed/actioned the application
    (reviewed_by IS NULL AND shortlisted_by IS NULL AND approved_by IS NULL AND rejected_by IS NULL)
  )
);

-- Add comment explaining the policy
COMMENT ON POLICY "Allow users to update own form responses" ON form_responses IS
'Users can modify their applications only before deadline and before admin review.
Admin-processed applications (shortlisted, approved, rejected, etc.) cannot be modified by users.';
