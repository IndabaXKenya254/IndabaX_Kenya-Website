-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - REVIEWER AUTHOR PROFILES RLS POLICY
-- ═══════════════════════════════════════════════════════════════════════
-- Allow reviewers to view author profiles for papers assigned to them
-- ONLY when the event's review mode is 'open' (not blind review)
-- ═══════════════════════════════════════════════════════════════════════

-- Add RLS policy for reviewers to view author profiles in open reviews
CREATE POLICY "Reviewers can view authors for open reviews"
ON user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM paper_reviewer_assignments pra
    JOIN papers p ON p.id = pra.paper_id
    JOIN events e ON e.id = pra.event_id
    WHERE pra.reviewer_id = auth.uid()
    AND p.user_id = user_profiles.id
    AND e.paper_review_mode = 'open'
  )
);
