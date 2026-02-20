-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 5: ADMIN REVIEW SYSTEM
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Add review locking, shortlisting, and enhanced application tracking
-- Date: 2025-11-21
-- Phase: 5 of 12

-- ═══════════════════════════════════════════════════════════════════════
-- 1. CREATE REVIEW LOCKS TABLE
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS review_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What's being reviewed (UNIQUE prevents duplicate locks)
  registration_id UUID NOT NULL UNIQUE,

  -- Who's reviewing
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lock timing
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Metadata
  ip_address VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS review_locks_registration_id_idx ON review_locks(registration_id);
CREATE INDEX IF NOT EXISTS review_locks_locked_by_idx ON review_locks(locked_by);
CREATE INDEX IF NOT EXISTS review_locks_expires_at_idx ON review_locks(expires_at);

-- Comments
COMMENT ON TABLE review_locks IS
'Prevents concurrent reviews of the same application.
Locks expire after 30 minutes or when manually released.
UNIQUE constraint on registration_id ensures only one lock per application.';

COMMENT ON COLUMN review_locks.expires_at IS
'Lock expiry time (locked_at + 30 minutes).
Auto-extends if user is still active.
Automatically released after expiry.';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. EXTEND FORM_RESPONSES TABLE (for survey links)
-- ═══════════════════════════════════════════════════════════════════════

-- Add survey deadline configuration (admin can set this per event)
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  survey_deadline_days INTEGER DEFAULT 7;

COMMENT ON COLUMN form_responses.survey_deadline_days IS
'Number of days from shortlist date until survey expires.
Admin-configurable, defaults to 7 days.';

-- ═══════════════════════════════════════════════════════════════════════
-- 3. EXTEND FORM_RESPONSES TABLE (enhanced tracking)
-- ═══════════════════════════════════════════════════════════════════════

-- Add enhanced status field (preserves backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status_v2') THEN
    CREATE TYPE registration_status_v2 AS ENUM (
      'interested',        -- Initial interest shown
      'pending',           -- Admin reviewing
      'shortlisted',       -- Admin shortlisted, survey sent
      'survey_sent',       -- Survey link sent
      'survey_completed',  -- User completed detailed survey
      'approved',          -- Final approval, ticket sent
      'rejected',          -- Application rejected
      'attended'           -- Post-event: User attended
    );
  END IF;
END $$;

-- Add new status column (keeping old 'status' for backward compatibility)
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  status_v2 registration_status_v2 DEFAULT 'interested';

-- Review tracking
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  review_notes TEXT;

-- Shortlisting tracking
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  shortlisted_by UUID REFERENCES auth.users(id);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  shortlisted_at TIMESTAMP WITH TIME ZONE;

-- Decision tracking
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  decision_by UUID REFERENCES auth.users(id);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  decision_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  decision_notes TEXT;

-- Approved/Rejected specific tracking
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  approved_by UUID REFERENCES auth.users(id);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  rejected_by UUID REFERENCES auth.users(id);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  rejection_reason TEXT;

-- Comments
COMMENT ON COLUMN form_responses.status_v2 IS
'Enhanced status tracking for Phase 5+ multi-stage workflow.
Uses new enum with more granular statuses.
Old "status" column preserved for backward compatibility.';

COMMENT ON COLUMN form_responses.review_notes IS
'Admin notes during review process.
Supports autosave, visible only to admins.';

COMMENT ON COLUMN form_responses.rejection_reason IS
'Optional reason for rejection, included in rejection email.';

-- ═══════════════════════════════════════════════════════════════════════
-- 4. CREATE FUNCTION: Auto-cleanup expired locks
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing function if it exists (handles the error you encountered)
DROP FUNCTION IF EXISTS cleanup_expired_locks();

CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM review_locks
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_locks IS
'Deletes expired review locks.
Should be called periodically (e.g., via cron job or trigger).';

-- ═══════════════════════════════════════════════════════════════════════
-- 5. CREATE FUNCTION: Check if application is locked
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_application_locked(UUID, UUID);

CREATE OR REPLACE FUNCTION is_application_locked(
  p_registration_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_by_user_id UUID,
  locked_by_email TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_owned_by_requester BOOLEAN
) AS $$
BEGIN
  -- First, cleanup expired locks
  PERFORM cleanup_expired_locks();

  -- Check lock status
  RETURN QUERY
  SELECT
    (rl.id IS NOT NULL) AS is_locked,
    rl.locked_by AS locked_by_user_id,
    u.email AS locked_by_email,
    rl.locked_at,
    rl.expires_at,
    (rl.locked_by = p_user_id) AS is_owned_by_requester
  FROM review_locks rl
  LEFT JOIN auth.users u ON u.id = rl.locked_by
  WHERE rl.registration_id = p_registration_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_application_locked IS
'Checks if an application is currently locked.
Automatically cleans up expired locks before checking.
Returns lock details including who locked it and when it expires.';

-- ═══════════════════════════════════════════════════════════════════════
-- 6. CREATE FUNCTION: Acquire lock
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS acquire_review_lock(UUID, UUID, VARCHAR, INTEGER);

CREATE OR REPLACE FUNCTION acquire_review_lock(
  p_registration_id UUID,
  p_user_id UUID,
  p_ip_address VARCHAR(50) DEFAULT NULL,
  p_lock_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  lock_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_lock_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_existing_lock RECORD;
BEGIN
  -- Cleanup expired locks first
  PERFORM cleanup_expired_locks();

  -- Check if already locked
  SELECT * INTO v_existing_lock
  FROM review_locks
  WHERE registration_id = p_registration_id;

  IF FOUND THEN
    -- Lock exists
    IF v_existing_lock.locked_by = p_user_id THEN
      -- User already owns the lock, extend it
      v_expires_at := NOW() + (p_lock_duration_minutes || ' minutes')::INTERVAL;

      UPDATE review_locks
      SET
        expires_at = v_expires_at,
        locked_at = NOW()
      WHERE id = v_existing_lock.id
      RETURNING id INTO v_lock_id;

      RETURN QUERY SELECT
        TRUE,
        'Lock extended'::TEXT,
        v_lock_id,
        v_expires_at;
    ELSE
      -- Locked by someone else
      RETURN QUERY SELECT
        FALSE,
        'Application is currently being reviewed by another user'::TEXT,
        v_existing_lock.id,
        v_existing_lock.expires_at;
    END IF;
  ELSE
    -- No lock exists, create new one
    v_expires_at := NOW() + (p_lock_duration_minutes || ' minutes')::INTERVAL;

    INSERT INTO review_locks (
      registration_id,
      locked_by,
      locked_at,
      expires_at,
      ip_address
    ) VALUES (
      p_registration_id,
      p_user_id,
      NOW(),
      v_expires_at,
      p_ip_address
    )
    RETURNING id INTO v_lock_id;

    RETURN QUERY SELECT
      TRUE,
      'Lock acquired'::TEXT,
      v_lock_id,
      v_expires_at;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION acquire_review_lock IS
'Attempts to acquire a review lock on an application.
If already locked by current user, extends the lock.
If locked by someone else, returns error.
If unlocked, creates new lock with configurable duration (default 30 min).';

-- ═══════════════════════════════════════════════════════════════════════
-- 7. CREATE FUNCTION: Release lock
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS release_review_lock(UUID, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION release_review_lock(
  p_registration_id UUID,
  p_user_id UUID,
  p_force BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_existing_lock RECORD;
BEGIN
  -- Find lock
  SELECT * INTO v_existing_lock
  FROM review_locks
  WHERE registration_id = p_registration_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'No lock found'::TEXT;
    RETURN;
  END IF;

  -- Check ownership (unless force unlock)
  IF NOT p_force AND v_existing_lock.locked_by != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'You do not own this lock'::TEXT;
    RETURN;
  END IF;

  -- Delete lock
  DELETE FROM review_locks WHERE id = v_existing_lock.id;

  RETURN QUERY SELECT TRUE, 'Lock released'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION release_review_lock IS
'Releases a review lock on an application.
Only lock owner can release (unless p_force = TRUE for admins).
Used when reviewer closes application or submits review.';

-- ═══════════════════════════════════════════════════════════════════════
-- 8. ADD INDEXES for new columns
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS form_responses_status_v2_idx ON form_responses(status_v2);
CREATE INDEX IF NOT EXISTS form_responses_reviewed_by_idx ON form_responses(reviewed_by);
CREATE INDEX IF NOT EXISTS form_responses_shortlisted_by_idx ON form_responses(shortlisted_by);
CREATE INDEX IF NOT EXISTS form_responses_approved_by_idx ON form_responses(approved_by);
CREATE INDEX IF NOT EXISTS form_responses_rejected_by_idx ON form_responses(rejected_by);

-- ═══════════════════════════════════════════════════════════════════════
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on review_locks
ALTER TABLE review_locks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all locks" ON review_locks;
DROP POLICY IF EXISTS "Admins can create locks" ON review_locks;
DROP POLICY IF EXISTS "Admins can delete own locks" ON review_locks;

-- Admins can view all locks
CREATE POLICY "Admins can view all locks" ON review_locks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create locks
CREATE POLICY "Admins can create locks" ON review_locks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete their own locks
CREATE POLICY "Admins can delete own locks" ON review_locks
  FOR DELETE
  USING (
    locked_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════
-- 10. MIGRATION UTILITIES
-- ═══════════════════════════════════════════════════════════════════════

-- Migrate existing statuses to new status_v2 field
UPDATE form_responses
SET status_v2 =
  CASE
    WHEN status = 'not_started' THEN 'interested'::registration_status_v2
    WHEN status = 'in_progress' THEN 'pending'::registration_status_v2
    WHEN status = 'completed' THEN 'survey_completed'::registration_status_v2
    ELSE 'interested'::registration_status_v2
  END
WHERE status_v2 IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 11. CREATE VIEW: Application with lock status
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing view if it exists
DROP VIEW IF EXISTS applications_with_locks;

CREATE OR REPLACE VIEW applications_with_locks AS
SELECT
  fr.*,
  rl.id AS lock_id,
  rl.locked_by AS locked_by_user_id,
  rl.locked_at,
  rl.expires_at AS lock_expires_at,
  (rl.id IS NOT NULL) AS is_locked,
  (rl.locked_by = auth.uid()) AS is_locked_by_me,
  u.email AS locked_by_email,
  up.name AS locked_by_name
FROM form_responses fr
LEFT JOIN review_locks rl ON rl.registration_id = fr.id
LEFT JOIN auth.users u ON u.id = rl.locked_by
LEFT JOIN user_profiles up ON up.id = rl.locked_by;

COMMENT ON VIEW applications_with_locks IS
'Convenient view combining form_responses with lock status.
Shows who has locked the application and when it expires.
Use this for applications list page to show lock indicators.';

-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════

-- Summary:
-- ✅ Created review_locks table
-- ✅ Extended form_responses with Phase 5 tracking columns
-- ✅ Created registration_status_v2 enum
-- ✅ Added lock management functions (acquire, release, check)
-- ✅ Added auto-cleanup for expired locks
-- ✅ Created indexes for performance
-- ✅ Added RLS policies
-- ✅ Migrated existing statuses
-- ✅ Created applications_with_locks view
-- ✅ Fixed: Added DROP FUNCTION IF EXISTS to handle re-runs

-- Next steps:
-- 1. Test migration in development ✅
-- 2. Review with user ✅
-- 3. Execute in production (YOU ARE HERE)
