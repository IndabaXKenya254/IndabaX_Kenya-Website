-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - PAPER/APPLICATION ASSIGNMENTS TO REVIEWERS
-- ═══════════════════════════════════════════════════════════════════════
-- Issue #38: Add ability to assign specific applications to reviewers
-- Features:
--   - Assign applications to specific reviewers
--   - Prevent duplicate assignments (same application to same reviewer)
--   - Support for random bulk assignment
-- ═══════════════════════════════════════════════════════════════════════

-- Create paper_assignments table
CREATE TABLE IF NOT EXISTS public.paper_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  reviewer_id UUID NOT NULL REFERENCES public.reviewers(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Assignment metadata
  assigned_by UUID REFERENCES public.user_profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Review status
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_progress', 'completed')),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- UNIQUE constraint: One reviewer cannot be assigned the same application twice
  CONSTRAINT unique_reviewer_application UNIQUE(reviewer_id, application_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_paper_assignments_reviewer ON public.paper_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_paper_assignments_application ON public.paper_assignments(application_id);
CREATE INDEX IF NOT EXISTS idx_paper_assignments_event ON public.paper_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_paper_assignments_status ON public.paper_assignments(review_status);

-- Enable RLS
ALTER TABLE public.paper_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can manage paper assignments" ON public.paper_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Reviewers can view their own assignments
CREATE POLICY "Reviewers can view own assignments" ON public.paper_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviewers r
      WHERE r.id = paper_assignments.reviewer_id
      AND r.user_id = (SELECT id FROM public.user_profiles WHERE user_id = auth.uid())
    )
  );

-- Reviewers can update their own assignments (for review status)
CREATE POLICY "Reviewers can update own assignments" ON public.paper_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reviewers r
      WHERE r.id = paper_assignments.reviewer_id
      AND r.user_id = (SELECT id FROM public.user_profiles WHERE user_id = auth.uid())
    )
  );

-- Function to get unassigned applications for an event
CREATE OR REPLACE FUNCTION get_unassigned_applications(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  template_id UUID,
  status TEXT,
  submitted_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fr.id,
    fr.user_id,
    fr.template_id,
    fr.status,
    fr.submitted_at,
    up.email as user_email,
    COALESCE(up.full_name, up.email) as user_name
  FROM public.form_responses fr
  JOIN public.form_templates ft ON fr.template_id = ft.id
  LEFT JOIN public.user_profiles up ON fr.user_id = up.id
  WHERE ft.event_id = p_event_id
    AND fr.status IN ('pending', 'submitted', 'shortlisted')
    AND NOT EXISTS (
      SELECT 1 FROM public.paper_assignments pa
      WHERE pa.application_id = fr.id
    )
  ORDER BY fr.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to randomly assign applications to a reviewer
CREATE OR REPLACE FUNCTION assign_random_applications(
  p_reviewer_id UUID,
  p_event_id UUID,
  p_count INTEGER,
  p_assigned_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_assigned INTEGER := 0;
  v_application RECORD;
BEGIN
  -- Get random unassigned applications
  FOR v_application IN
    SELECT fr.id as application_id
    FROM public.form_responses fr
    JOIN public.form_templates ft ON fr.template_id = ft.id
    WHERE ft.event_id = p_event_id
      AND fr.status IN ('pending', 'submitted', 'shortlisted')
      AND NOT EXISTS (
        SELECT 1 FROM public.paper_assignments pa
        WHERE pa.application_id = fr.id
          AND pa.reviewer_id = p_reviewer_id
      )
    ORDER BY RANDOM()
    LIMIT p_count
  LOOP
    -- Insert assignment (ignore if already exists)
    INSERT INTO public.paper_assignments (
      reviewer_id,
      application_id,
      event_id,
      assigned_by
    ) VALUES (
      p_reviewer_id,
      v_application.application_id,
      p_event_id,
      p_assigned_by
    )
    ON CONFLICT (reviewer_id, application_id) DO NOTHING;

    IF FOUND THEN
      v_assigned := v_assigned + 1;
    END IF;
  END LOOP;

  RETURN v_assigned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for reviewer workload
CREATE OR REPLACE VIEW reviewer_assignment_stats AS
SELECT
  r.id as reviewer_id,
  r.user_id,
  r.event_id,
  up.email as reviewer_email,
  up.full_name as reviewer_name,
  e.title as event_title,
  COUNT(pa.id) as total_assigned,
  COUNT(pa.id) FILTER (WHERE pa.review_status = 'pending') as pending_reviews,
  COUNT(pa.id) FILTER (WHERE pa.review_status = 'in_progress') as in_progress_reviews,
  COUNT(pa.id) FILTER (WHERE pa.review_status = 'completed') as completed_reviews
FROM public.reviewers r
JOIN public.user_profiles up ON r.user_id = up.id
JOIN public.events e ON r.event_id = e.id
LEFT JOIN public.paper_assignments pa ON pa.reviewer_id = r.id
GROUP BY r.id, r.user_id, r.event_id, up.email, up.full_name, e.title;

-- Grant access to the view
GRANT SELECT ON reviewer_assignment_stats TO authenticated;

COMMENT ON TABLE public.paper_assignments IS 'Assigns specific applications/papers to reviewers for review';
COMMENT ON FUNCTION get_unassigned_applications IS 'Returns applications that have not been assigned to any reviewer';
COMMENT ON FUNCTION assign_random_applications IS 'Randomly assigns N applications to a reviewer for an event';
