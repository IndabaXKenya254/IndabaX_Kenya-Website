-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ALLOW REVIEWERS TO UPDATE THEIR PAPER ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════════════════
-- Reviewers need UPDATE permission to submit reviews (score, comments, etc.)

-- Allow reviewers to update their own paper assignments (for submitting reviews)
CREATE POLICY "Reviewers can update own paper assignments"
ON paper_reviewer_assignments
FOR UPDATE
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());
