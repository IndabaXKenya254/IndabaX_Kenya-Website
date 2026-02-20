-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - PAPER REVIEW SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add paper assignment and blind review system
-- Created: 2026-01-24
-- EXECUTED VIA MCP: 2026-01-24
-- Features:
--   1. Blind/Open review modes for events
--   2. Paper assignments (reviewer -> paper, unique constraint)
--   3. Reviewer comments/notes (separate from admin decisions)
--   4. Random paper assignment support
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ADD REVIEW MODE TO EVENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Create enum for review mode
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_mode') THEN
    CREATE TYPE review_mode AS ENUM (
      'open',          -- Reviewers can see author info
      'single_blind',  -- Reviewers cannot see author info, authors don't see reviewers
      'double_blind'   -- Neither party sees each other (most common for conferences)
    );
  END IF;
END$$;

-- Add review_mode column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS paper_review_mode review_mode DEFAULT 'double_blind';

COMMENT ON COLUMN events.paper_review_mode IS 'Review mode for papers: open, single_blind, double_blind';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CREATE PAPER_REVIEWER_ASSIGNMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════
-- Assigns reviewers to specific papers (NOT applications)
-- NOTE: Named paper_reviewer_assignments to distinguish from paper_assignments
--       which was already used for applications
-- UNIQUE constraint ensures one reviewer per paper (no duplicates)

CREATE TABLE IF NOT EXISTS paper_reviewer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Assignment details
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  -- Review status
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_progress', 'completed')),
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- UNIQUE constraint: Each paper can only be assigned to ONE reviewer
  -- This prevents duplicate assignments as per user requirement
  UNIQUE(paper_id)
);

COMMENT ON TABLE paper_assignments IS 'Paper assignments to reviewers (one reviewer per paper)';
COMMENT ON COLUMN paper_assignments.paper_id IS 'The paper being reviewed';
COMMENT ON COLUMN paper_assignments.reviewer_id IS 'The reviewer assigned to this paper';
COMMENT ON COLUMN paper_assignments.review_status IS 'Status: pending, in_progress, completed';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CREATE PAPER_REVIEWS TABLE
-- ═══════════════════════════════════════════════════════════════════════════
-- Stores reviewer comments/notes (NOT decisions - admins make those)

CREATE TABLE IF NOT EXISTS paper_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES paper_assignments(id) ON DELETE SET NULL,

  -- Review content (what reviewers can do)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT, -- General feedback
  strengths TEXT, -- What's good about the paper
  weaknesses TEXT, -- Areas for improvement
  recommendation TEXT CHECK (recommendation IN ('accept', 'revise', 'reject')), -- Recommendation only, not decision

  -- Confidence level
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One review per paper per reviewer
  UNIQUE(paper_id, reviewer_id)
);

COMMENT ON TABLE paper_reviews IS 'Reviewer feedback on papers (not decisions)';
COMMENT ON COLUMN paper_reviews.recommendation IS 'Reviewer recommendation (not final decision)';
COMMENT ON COLUMN paper_reviews.confidence IS 'How confident the reviewer is in their assessment (1-5)';

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_paper_assignments_paper ON paper_assignments(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_assignments_reviewer ON paper_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_paper_assignments_event ON paper_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_paper_assignments_status ON paper_assignments(review_status);

CREATE INDEX IF NOT EXISTS idx_paper_reviews_paper ON paper_reviews(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_reviews_reviewer ON paper_reviews(reviewer_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE paper_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_reviews ENABLE ROW LEVEL SECURITY;

-- Paper Assignments: Admins can manage all
CREATE POLICY "Admins can manage paper assignments" ON paper_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Paper Assignments: Reviewers can view their own
CREATE POLICY "Reviewers can view own paper assignments" ON paper_assignments
  FOR SELECT
  USING (reviewer_id = auth.uid());

-- Paper Reviews: Admins can view all reviews
CREATE POLICY "Admins can view all paper reviews" ON paper_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Paper Reviews: Reviewers can manage their own reviews
CREATE POLICY "Reviewers can manage own reviews" ON paper_reviews
  FOR ALL
  USING (reviewer_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. CREATE VIEW: REVIEWER PAPER STATS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW reviewer_paper_stats AS
SELECT
  up.id AS reviewer_id,
  up.name AS reviewer_name,
  up.email AS reviewer_email,
  COUNT(DISTINCT pa.id) AS total_assigned,
  COUNT(DISTINCT CASE WHEN pa.review_status = 'completed' THEN pa.id END) AS total_reviewed,
  COUNT(DISTINCT CASE WHEN pa.review_status = 'pending' THEN pa.id END) AS pending_reviews,
  COUNT(DISTINCT CASE WHEN pa.review_status = 'in_progress' THEN pa.id END) AS in_progress,
  MAX(pa.reviewed_at) AS last_review_at
FROM user_profiles up
LEFT JOIN paper_assignments pa ON pa.reviewer_id = up.id
WHERE up.role IN ('reviewer', 'admin')
GROUP BY up.id, up.name, up.email;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. FUNCTION: RANDOM PAPER ASSIGNMENT
-- ═══════════════════════════════════════════════════════════════════════════
-- Assigns random unassigned papers to a reviewer
-- Parameters:
--   p_reviewer_id: The reviewer to assign papers to
--   p_event_id: The event to select papers from
--   p_count: Number of papers to assign (10 or 20)

CREATE OR REPLACE FUNCTION assign_random_papers(
  p_reviewer_id UUID,
  p_event_id UUID,
  p_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  assigned_count INTEGER,
  paper_ids UUID[]
) AS $$
DECLARE
  v_assigned_ids UUID[];
  v_count INTEGER := 0;
BEGIN
  -- Get unassigned papers for the event and assign them
  WITH unassigned_papers AS (
    SELECT p.id
    FROM papers p
    WHERE p.event_id = p_event_id
      AND p.status = 'submitted'
      AND NOT EXISTS (
        SELECT 1 FROM paper_assignments pa WHERE pa.paper_id = p.id
      )
    ORDER BY RANDOM()
    LIMIT p_count
  ),
  inserted AS (
    INSERT INTO paper_assignments (paper_id, reviewer_id, event_id, assigned_by)
    SELECT id, p_reviewer_id, p_event_id, auth.uid()
    FROM unassigned_papers
    RETURNING paper_id
  )
  SELECT ARRAY_AGG(paper_id), COUNT(*)::INTEGER INTO v_assigned_ids, v_count
  FROM inserted;

  RETURN QUERY SELECT v_count, COALESCE(v_assigned_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_random_papers IS 'Assigns random unassigned papers to a reviewer';

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. TRIGGER: UPDATE TIMESTAMPS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_paper_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_paper_assignment_timestamp_trigger ON paper_assignments;
CREATE TRIGGER update_paper_assignment_timestamp_trigger
  BEFORE UPDATE ON paper_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_paper_assignment_timestamp();

DROP TRIGGER IF EXISTS update_paper_review_timestamp_trigger ON paper_reviews;
CREATE TRIGGER update_paper_review_timestamp_trigger
  BEFORE UPDATE ON paper_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_paper_assignment_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════
