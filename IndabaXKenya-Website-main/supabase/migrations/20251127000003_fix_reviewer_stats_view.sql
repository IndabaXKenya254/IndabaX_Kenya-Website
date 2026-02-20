-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - FIX REVIEWER STATS VIEW
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Drop and recreate reviewer_stats view with correct table reference
-- Created: 2025-11-27
-- Fixes: Uses registrations table instead of form_responses for status tracking
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the view if it exists
DROP VIEW IF EXISTS reviewer_stats;

-- Recreate with registrations table (has approved/rejected status)
-- Not form_responses (only has not_started/in_progress/completed)
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
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════
