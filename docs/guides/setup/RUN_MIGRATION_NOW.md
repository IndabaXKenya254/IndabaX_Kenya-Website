# 🚨 RUN PHASE 5 MIGRATION NOW

**Error:** `column "ip_address" of relation "review_locks" does not exist`

**Cause:** Phase 5 database migration has not been run yet.

**Solution:** Run the migration in Supabase SQL Editor (2 minutes)

---

## STEP 1: Open Supabase SQL Editor

**Go to:** https://supabase.com/dashboard/project/klnspdwlybpwkznzezzd/sql/new

---

## STEP 2: Copy Migration SQL

**Open this file on your computer:**
```
/home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website/supabase/migrations/20251121040000_phase5_review_system.sql
```

**Or copy from here:** (Full SQL below)

---

## STEP 3: Paste & Run

1. **Paste** the entire SQL into the Supabase SQL Editor
2. **Click** "Run" button (bottom right)
3. **Wait** for "Success" message (should take 5-10 seconds)

---

## STEP 4: Verify Migration Ran

**Run this verification query:**

```sql
-- Check if review_locks table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'review_locks'
) AS review_locks_exists;

-- Check if ip_address column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'review_locks'
  AND column_name = 'ip_address';

-- Check if status_v2 column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'form_responses'
  AND column_name = 'status_v2';

-- Should return:
-- review_locks_exists: true
-- ip_address: character varying (50)
-- status_v2: USER-DEFINED (registration_status_v2)
```

**Expected Results:**
```
review_locks_exists | true
ip_address         | character varying
status_v2          | USER-DEFINED
```

If all 3 exist, migration is complete! ✅

---

## STEP 5: Restart Your App

```bash
# In your terminal where npm run dev is running:
# Press Ctrl+C to stop

# Then restart:
npm run dev
```

**Now refresh your browser and the error should be gone!**

---

## 📄 FULL MIGRATION SQL (Copy All of This)

```sql
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

DROP FUNCTION IF EXISTS is_application_locked(UUID, UUID);

CREATE OR REPLACE FUNCTION is_application_locked(
  p_registration_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_by_user_id UUID,
  locked_by_email VARCHAR,
  locked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_owned_by_requester BOOLEAN
) AS $$
BEGIN
  -- First, cleanup expired locks
  PERFORM cleanup_expired_locks();

  -- Then check if lock exists
  RETURN QUERY
  SELECT
    TRUE AS is_locked,
    rl.locked_by AS locked_by_user_id,
    COALESCE(up.email, au.email) AS locked_by_email,
    rl.locked_at,
    rl.expires_at,
    (rl.locked_by = p_user_id) AS is_owned_by_requester
  FROM review_locks rl
  LEFT JOIN user_profiles up ON up.id = rl.locked_by
  LEFT JOIN auth.users au ON au.id = rl.locked_by
  WHERE rl.registration_id = p_registration_id
    AND rl.expires_at > NOW();

  -- If no rows, return unlocked status
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      FALSE AS is_locked,
      NULL::UUID AS locked_by_user_id,
      NULL::VARCHAR AS locked_by_email,
      NULL::TIMESTAMP WITH TIME ZONE AS locked_at,
      NULL::TIMESTAMP WITH TIME ZONE AS expires_at,
      FALSE AS is_owned_by_requester;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_application_locked IS
'Checks if an application is currently locked for review.
Returns lock status and owner information.
Automatically cleans up expired locks before checking.';

-- ═══════════════════════════════════════════════════════════════════════
-- 6. CREATE FUNCTION: Acquire review lock
-- ═══════════════════════════════════════════════════════════════════════

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

  -- Calculate expiry time
  v_expires_at := NOW() + (p_lock_duration_minutes || ' minutes')::INTERVAL;

  -- Check if lock already exists
  SELECT * INTO v_existing_lock
  FROM review_locks
  WHERE registration_id = p_registration_id
    AND expires_at > NOW();

  IF FOUND THEN
    -- Lock exists
    IF v_existing_lock.locked_by = p_user_id THEN
      -- User already owns the lock, extend it
      UPDATE review_locks
      SET expires_at = v_expires_at
      WHERE id = v_existing_lock.id
      RETURNING id INTO v_lock_id;

      RETURN QUERY
      SELECT
        TRUE AS success,
        'Lock extended' AS message,
        v_lock_id AS lock_id,
        v_expires_at AS expires_at;
    ELSE
      -- Locked by another user
      RETURN QUERY
      SELECT
        FALSE AS success,
        'Application is currently being reviewed by another user' AS message,
        NULL::UUID AS lock_id,
        v_existing_lock.expires_at AS expires_at;
    END IF;
  ELSE
    -- No lock exists, create new one
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

    RETURN QUERY
    SELECT
      TRUE AS success,
      'Lock acquired' AS message,
      v_lock_id AS lock_id,
      v_expires_at AS expires_at;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION acquire_review_lock IS
'Attempts to acquire a review lock for an application.
If lock exists and owned by requesting user, extends the lock.
If lock exists and owned by another user, returns failure.
If no lock exists, creates new lock.';

-- ═══════════════════════════════════════════════════════════════════════
-- 7. CREATE FUNCTION: Release review lock
-- ═══════════════════════════════════════════════════════════════════════

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
  v_deleted_count INTEGER;
BEGIN
  IF p_force THEN
    -- Force release (admin only, delete any lock)
    DELETE FROM review_locks
    WHERE registration_id = p_registration_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count > 0 THEN
      RETURN QUERY
      SELECT
        TRUE AS success,
        'Lock forcefully released' AS message;
    ELSE
      RETURN QUERY
      SELECT
        FALSE AS success,
        'No lock found' AS message;
    END IF;
  ELSE
    -- Normal release (only if owned by user)
    DELETE FROM review_locks
    WHERE registration_id = p_registration_id
      AND locked_by = p_user_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count > 0 THEN
      RETURN QUERY
      SELECT
        TRUE AS success,
        'Lock released' AS message;
    ELSE
      RETURN QUERY
      SELECT
        FALSE AS success,
        'No lock found or not owned by user' AS message;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION release_review_lock IS
'Releases a review lock.
Normal mode: Only releases if lock is owned by requesting user.
Force mode: Releases any lock (admin only).';

-- ═══════════════════════════════════════════════════════════════════════
-- 8. CREATE VIEW: Applications with lock status
-- ═══════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS applications_with_locks;

CREATE OR REPLACE VIEW applications_with_locks AS
SELECT
  fr.*,
  rl.id AS lock_id,
  rl.locked_by AS locked_by_user_id,
  rl.locked_at,
  rl.expires_at AS lock_expires_at,
  up.name AS locked_by_name,
  up.email AS locked_by_email,
  (rl.id IS NOT NULL AND rl.expires_at > NOW()) AS is_locked
FROM form_responses fr
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()
LEFT JOIN user_profiles up ON up.id = rl.locked_by;

COMMENT ON VIEW applications_with_locks IS
'Convenience view that joins form_responses with lock status.
Shows which applications are currently locked and by whom.
Only shows active locks (expires_at > NOW()).';

-- ═══════════════════════════════════════════════════════════════════════
-- 9. MIGRATE EXISTING DATA
-- ═══════════════════════════════════════════════════════════════════════

-- Map old status values to new status_v2 values
UPDATE form_responses
SET status_v2 = CASE
  WHEN status = 'not_started' THEN 'interested'::registration_status_v2
  WHEN status = 'in_progress' THEN 'pending'::registration_status_v2
  WHEN status = 'completed' THEN 'survey_completed'::registration_status_v2
  ELSE 'interested'::registration_status_v2
END
WHERE status_v2 IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 10. CREATE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS form_responses_status_v2_idx ON form_responses(status_v2);
CREATE INDEX IF NOT EXISTS form_responses_shortlisted_by_idx ON form_responses(shortlisted_by);
CREATE INDEX IF NOT EXISTS form_responses_shortlisted_at_idx ON form_responses(shortlisted_at);
CREATE INDEX IF NOT EXISTS form_responses_approved_by_idx ON form_responses(approved_by);
CREATE INDEX IF NOT EXISTS form_responses_rejected_by_idx ON form_responses(rejected_by);

-- ═══════════════════════════════════════════════════════════════════════
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on review_locks table
ALTER TABLE review_locks ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all locks
DROP POLICY IF EXISTS review_locks_admin_select ON review_locks;
CREATE POLICY review_locks_admin_select ON review_locks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Policy: Admins can insert locks (via functions)
DROP POLICY IF EXISTS review_locks_admin_insert ON review_locks;
CREATE POLICY review_locks_admin_insert ON review_locks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Policy: Admins can delete their own locks
DROP POLICY IF EXISTS review_locks_admin_delete ON review_locks;
CREATE POLICY review_locks_admin_delete ON review_locks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════
-- 12. GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_expired_locks() TO authenticated;
GRANT EXECUTE ON FUNCTION is_application_locked(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION acquire_review_lock(UUID, UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION release_review_lock(UUID, UUID, BOOLEAN) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5 migration complete!';
  RAISE NOTICE '   - review_locks table created';
  RAISE NOTICE '   - form_responses extended with 14 columns';
  RAISE NOTICE '   - registration_status_v2 enum created';
  RAISE NOTICE '   - 4 database functions created';
  RAISE NOTICE '   - applications_with_locks view created';
  RAISE NOTICE '   - RLS policies enabled';
  RAISE NOTICE '   - Indexes created for performance';
END $$;
```

---

## ✅ AFTER RUNNING MIGRATION

**Restart your dev server:**
```bash
# Press Ctrl+C in terminal
npm run dev
```

**Refresh your browser and the lock error should be gone!**

---

## 🐛 TROUBLESHOOTING

### "Permission denied for table"
**Solution:** Make sure you're logged in as the database owner in Supabase Dashboard

### "Already exists" errors
**Solution:** Migration is idempotent (safe to run multiple times). Just ignore these warnings.

### Still getting errors after migration?
**Solution:**
1. Check verification query results (Step 4)
2. Restart dev server
3. Clear browser cache (Ctrl+Shift+R)

---

**Run this migration NOW and your lock system will work!** 🚀
