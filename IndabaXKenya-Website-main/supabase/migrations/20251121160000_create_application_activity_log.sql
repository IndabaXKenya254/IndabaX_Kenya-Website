-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - APPLICATION ACTIVITY LOG (PHASE 5 - DAY 7)
-- ═══════════════════════════════════════════════════════════════════════
-- Track all activity on applications for timeline/audit trail

-- ═══════════════════════════════════════════════════════════════════════
-- Create activity_logs table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What was the activity on
  application_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,

  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'submitted',
    'reviewed',
    'status_change',
    'note_added',
    'lock_acquired',
    'lock_released',
    'email_sent',
    'shortlisted',
    'survey_sent',
    'other'
  )),

  -- Who performed the activity
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_email VARCHAR(255), -- Cached email for display

  -- Additional context
  details TEXT, -- Human-readable description
  metadata JSONB, -- Additional structured data (e.g., old/new status)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT activity_logs_application_id_idx CHECK (application_id IS NOT NULL)
);

-- ═══════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_activity_logs_application_id
  ON public.activity_logs(application_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type
  ON public.activity_logs(activity_type);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON public.activity_logs(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.activity_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to view activity logs for their own applications
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
  FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.form_responses
      WHERE user_id = auth.uid()
    )
  );

-- Allow admins to view all activity logs
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow system to insert activity logs (via service role or admin)
CREATE POLICY "System can insert activity logs" ON public.activity_logs
  FOR INSERT
  WITH CHECK (true); -- Will be controlled by API layer

-- ═══════════════════════════════════════════════════════════════════════
-- Helper function to log activity
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION log_application_activity(
  p_application_id UUID,
  p_activity_type VARCHAR(50),
  p_user_id UUID DEFAULT NULL,
  p_user_email VARCHAR(255) DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_resolved_email VARCHAR(255);
BEGIN
  -- Resolve user email if not provided
  IF p_user_id IS NOT NULL AND p_user_email IS NULL THEN
    SELECT email INTO v_resolved_email
    FROM public.user_profiles
    WHERE id = p_user_id;
  ELSE
    v_resolved_email := p_user_email;
  END IF;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    application_id,
    activity_type,
    user_id,
    user_email,
    details,
    metadata
  ) VALUES (
    p_application_id,
    p_activity_type,
    p_user_id,
    v_resolved_email,
    p_details,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════
-- Automatic activity logging triggers
-- ═══════════════════════════════════════════════════════════════════════

-- Log when application status changes
CREATE OR REPLACE FUNCTION trigger_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM log_application_activity(
      NEW.id,
      'status_change',
      NEW.reviewed_by,
      NULL, -- Email will be resolved by function
      format('Status changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_form_responses_status_change ON public.form_responses;

CREATE TRIGGER trigger_form_responses_status_change
  AFTER UPDATE ON public.form_responses
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_log_status_change();

-- Log when review notes are updated
CREATE OR REPLACE FUNCTION trigger_log_notes_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.review_notes IS DISTINCT FROM OLD.review_notes AND NEW.review_notes IS NOT NULL THEN
    PERFORM log_application_activity(
      NEW.id,
      'note_added',
      NEW.reviewed_by,
      NULL,
      'Review notes updated',
      jsonb_build_object(
        'notes_length', length(NEW.review_notes)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_form_responses_notes_update ON public.form_responses;

CREATE TRIGGER trigger_form_responses_notes_update
  AFTER UPDATE ON public.form_responses
  FOR EACH ROW
  WHEN (OLD.review_notes IS DISTINCT FROM NEW.review_notes)
  EXECUTE FUNCTION trigger_log_notes_update();

-- ═══════════════════════════════════════════════════════════════════════
-- Seed initial activity log for existing applications
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO public.activity_logs (application_id, activity_type, details, created_at)
SELECT
  id,
  'submitted',
  'Application submitted',
  COALESCE(completed_at, created_at)
FROM public.form_responses
WHERE NOT EXISTS (
  SELECT 1 FROM public.activity_logs
  WHERE application_id = form_responses.id
  AND activity_type = 'submitted'
);

-- Log existing reviews
INSERT INTO public.activity_logs (application_id, activity_type, user_id, details, created_at)
SELECT
  id,
  'reviewed',
  reviewed_by,
  format('Application reviewed with status: %s', status),
  COALESCE(reviewed_at, created_at)
FROM public.form_responses
WHERE reviewed_at IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.activity_logs
  WHERE application_id = form_responses.id
  AND activity_type = 'reviewed'
);

-- ═══════════════════════════════════════════════════════════════════════
-- Grant permissions
-- ═══════════════════════════════════════════════════════════════════════

GRANT SELECT ON public.activity_logs TO authenticated;
GRANT INSERT ON public.activity_logs TO service_role;
GRANT ALL ON public.activity_logs TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- Complete
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.activity_logs IS 'Activity log for application review process - Phase 5 Day 7';
COMMENT ON FUNCTION log_application_activity IS 'Helper function to log application activity';
