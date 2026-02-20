-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - REVIEWER PAPERS RLS POLICY
-- ═══════════════════════════════════════════════════════════════════════
-- Allow reviewers to view papers that are assigned to them
-- This enables the reviewer papers page to show paper details
-- ═══════════════════════════════════════════════════════════════════════

-- Add RLS policy for reviewers to view assigned papers
CREATE POLICY "Reviewers can view papers assigned to them"
ON papers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM paper_reviewer_assignments
    WHERE paper_reviewer_assignments.paper_id = papers.id
    AND paper_reviewer_assignments.reviewer_id = auth.uid()
  )
);
