-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - REVIEWER SYSTEM ENHANCEMENTS (PHASE 9)
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add reviewer assignments and performance tracking
-- Created: 2025-11-27
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CREATE REVIEWER_ASSIGNMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════
-- Assigns reviewers to specific events for workload distribution

CREATE TABLE IF NOT EXISTS reviewer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Assignment details
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  -- Quota (optional limit)
  max_reviews INTEGER, -- NULL = unlimited
  current_reviews INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate assignments
  UNIQUE(reviewer_id, event_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CREATE REVIEWER_STATS VIEW
-- ═══════════════════════════════════════════════════════════════════════════
-- Aggregates reviewer performance metrics
-- Note: Uses registrations table for status (approved/rejected), not form_responses

CREATE OR REPLACE VIEW reviewer_stats AS
SELECT
  up.id AS reviewer_id,
  up.name AS reviewer_name,
  up.email AS reviewer_email,
  COUNT(DISTINCT CASE WHEN reg.reviewed_by = up.id THEN reg.id END) AS total_reviews,
  COUNT(DISTINCT CASE WHEN reg.shortlisted_by = up.id THEN reg.id END) AS total_shortlists,
  COUNT(DISTINCT CASE WHEN reg.reviewed_by = up.id AND reg.status = 'approved' THEN reg.id END) AS total_accepted,
  COUNT(DISTINCT CASE WHEN reg.reviewed_by = up.id AND reg.status = 'rejected' THEN reg.id END) AS total_rejected,
  AVG(
    CASE
      WHEN reg.reviewed_by = up.id AND reg.reviewed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (reg.reviewed_at - reg.registered_at)) / 3600
      ELSE NULL
    END
  )::NUMERIC(10,2) AS avg_review_hours,
  MAX(CASE WHEN reg.reviewed_by = up.id THEN reg.reviewed_at END) AS last_review_at
FROM user_profiles up
LEFT JOIN registrations reg ON reg.reviewed_by = up.id OR reg.shortlisted_by = up.id
WHERE up.role IN ('reviewer', 'admin')
GROUP BY up.id, up.name, up.email;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_reviewer ON reviewer_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_event ON reviewer_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_active ON reviewer_assignments(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE reviewer_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all assignments
CREATE POLICY "Admins can manage reviewer assignments" ON reviewer_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reviewers can view their own assignments
CREATE POLICY "Reviewers can view own assignments" ON reviewer_assignments
  FOR SELECT
  USING (reviewer_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. FUNCTION: GET REVIEWER WORKLOAD
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_reviewer_workload(p_event_id UUID DEFAULT NULL)
RETURNS TABLE (
  reviewer_id UUID,
  reviewer_name TEXT,
  reviewer_email TEXT,
  pending_reviews BIGINT,
  completed_reviews BIGINT,
  assigned_quota INTEGER,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.name::TEXT,
    up.email::TEXT,
    COUNT(CASE WHEN reg.status IN ('pending', 'shortlisted') THEN reg.id END)::BIGINT AS pending_reviews,
    COUNT(CASE WHEN reg.reviewed_at IS NOT NULL THEN reg.id END)::BIGINT AS completed_reviews,
    ra.max_reviews,
    CASE
      WHEN ra.max_reviews IS NULL THEN TRUE
      WHEN ra.current_reviews < ra.max_reviews THEN TRUE
      ELSE FALSE
    END AS is_available
  FROM user_profiles up
  LEFT JOIN reviewer_assignments ra ON ra.reviewer_id = up.id
    AND (p_event_id IS NULL OR ra.event_id = p_event_id)
    AND ra.is_active = TRUE
  LEFT JOIN registrations reg ON reg.reviewed_by = up.id
    AND (p_event_id IS NULL OR reg.event_id = p_event_id)
  WHERE up.role IN ('reviewer', 'admin')
  GROUP BY up.id, up.name, up.email, ra.max_reviews, ra.current_reviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. TRIGGER: UPDATE REVIEWER STATS ON REVIEW
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_reviewer_assignment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_reviews count when a review is made
  IF NEW.reviewed_by IS NOT NULL AND (OLD.reviewed_by IS NULL OR OLD.reviewed_by != NEW.reviewed_by) THEN
    UPDATE reviewer_assignments
    SET
      current_reviews = current_reviews + 1,
      updated_at = NOW()
    WHERE reviewer_id = NEW.reviewed_by
      AND event_id = NEW.event_id
      AND is_active = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS update_reviewer_count_trigger ON registrations;
CREATE TRIGGER update_reviewer_count_trigger
  AFTER UPDATE OF reviewed_by ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_reviewer_assignment_count();

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════
