-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #35f: ADD MISSING REVIEW LOCK FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Add acquire_review_lock and release_review_lock functions
-- Run Order: AFTER 35e_comprehensive_schema_fixes.sql
--            BEFORE 36_tickets_table_enhancements.sql
--
-- Problem: File 35 created cleanup_expired_locks and is_application_locked
--          but missed acquire_review_lock and release_review_lock functions
--
-- Root Cause: File 35 was incomplete - didn't include all lock functions from dev
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. CREATE acquire_review_lock FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.acquire_review_lock(
  p_registration_id UUID,
  p_user_id UUID,
  p_ip_address VARCHAR DEFAULT NULL,
  p_lock_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  lock_id UUID,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_lock_id UUID;
  v_expires_at TIMESTAMPTZ;
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
$$ LANGUAGE plpgsql
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. CREATE release_review_lock FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.release_review_lock(
  p_registration_id UUID,
  p_user_id UUID,
  p_force BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
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
$$ LANGUAGE plpgsql
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. CREATE get_user_role FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = user_id;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. CREATE is_reviewer FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_reviewer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) IN ('reviewer', 'admin');
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. CREATE is_admin FUNCTION (if not exists)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 6. CREATE generate_resume_token FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generate_resume_token()
RETURNS VARCHAR AS $$
DECLARE
  token VARCHAR(255);
  token_exists BOOLEAN;
BEGIN
  LOOP
    token := encode(digest(random()::text || clock_timestamp()::text, 'sha256'), 'hex');
    SELECT EXISTS(
      SELECT 1 FROM public.form_responses
      WHERE resume_token = token OR access_token = token
    ) INTO token_exists;
    EXIT WHEN NOT token_exists;
  END LOOP;
  RETURN token;
END;
$$ LANGUAGE plpgsql
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 7. CREATE handle_new_user TRIGGER FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    organization,
    phone,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    'applicant', -- Default role for new users
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 8. CREATE log_application_activity FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.log_application_activity(
  p_application_id UUID,
  p_activity_type VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_user_email VARCHAR DEFAULT NULL,
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 9. CREATE trigger_log_notes_update TRIGGER FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.trigger_log_notes_update()
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
$$ LANGUAGE plpgsql
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 10. CREATE trigger_log_status_change TRIGGER FUNCTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.trigger_log_status_change()
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
$$ LANGUAGE plpgsql
SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════
-- 11. ADD COMMENTS
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON FUNCTION public.acquire_review_lock IS 'Acquires or extends a review lock on a registration. Returns success status and lock details.';
COMMENT ON FUNCTION public.release_review_lock IS 'Releases a review lock. Only lock owner can release unless p_force is TRUE.';
COMMENT ON FUNCTION public.get_user_role IS 'Returns the role of a user from user_profiles table.';
COMMENT ON FUNCTION public.is_reviewer IS 'Returns true if current user is a reviewer or admin.';
COMMENT ON FUNCTION public.is_admin IS 'Returns true if current user is an admin.';
COMMENT ON FUNCTION public.generate_resume_token IS 'Generates a unique resume token for form responses.';
COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function to create user_profiles entry when new user signs up.';
COMMENT ON FUNCTION public.log_application_activity IS 'Logs activity on an application (status changes, notes, etc).';
COMMENT ON FUNCTION public.trigger_log_notes_update IS 'Trigger function to log when review notes are updated.';
COMMENT ON FUNCTION public.trigger_log_status_change IS 'Trigger function to log when application status changes.';

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #35f: Review Lock Functions Added';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Functions created (9 total):';
  RAISE NOTICE '     1. acquire_review_lock(p_registration_id, p_user_id, p_ip_address, p_lock_duration_minutes)';
  RAISE NOTICE '     2. release_review_lock(p_registration_id, p_user_id, p_force)';
  RAISE NOTICE '     3. get_user_role(user_id)';
  RAISE NOTICE '     4. is_reviewer()';
  RAISE NOTICE '     5. is_admin()';
  RAISE NOTICE '     6. generate_resume_token()';
  RAISE NOTICE '     7. handle_new_user() [TRIGGER]';
  RAISE NOTICE '     8. log_application_activity(...)';
  RAISE NOTICE '     9. trigger_log_notes_update() [TRIGGER]';
  RAISE NOTICE '    10. trigger_log_status_change() [TRIGGER]';
  RAISE NOTICE '   ';
  RAISE NOTICE '   These functions work with:';
  RAISE NOTICE '     - cleanup_expired_locks() (created in file 35)';
  RAISE NOTICE '     - is_application_locked() (created in file 35)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run file 36_tickets_table_enhancements.sql';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
