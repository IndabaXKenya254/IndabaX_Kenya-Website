-- ═══════════════════════════════════════════════════════════════════════
-- BACKFILL USER PROFILES FOR EXISTING AUTH USERS
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251222_backfill_user_profiles
-- Purpose: Create user_profiles records for existing auth.users
--
-- Issue Fixed:
--   Users could register and verify email, but login failed with:
--   "Cannot coerce the result to a single JSON object" (PGRST116)
--   Root cause: user_profiles record was never created during registration
--
-- Note: The trigger creation is handled separately via Supabase Dashboard
--       or through the SQL Editor with proper permissions
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Backfill existing users without profiles
-- ───────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  backfill_count INTEGER;
  user_record RECORD;
BEGIN
  -- Log start
  RAISE NOTICE 'Starting user_profiles backfill...';

  -- Insert profiles for all auth.users that don't have profiles yet
  WITH missing_profiles AS (
    SELECT
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  )
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    organization,
    phone,
    role,
    email_verified,
    is_new_user,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    mp.id,
    mp.email,
    COALESCE(mp.raw_user_meta_data->>'name', ''),
    NULLIF(TRIM(COALESCE(mp.raw_user_meta_data->>'organization', '')), ''),
    NULLIF(TRIM(COALESCE(mp.raw_user_meta_data->>'phone', '')), ''),
    'applicant',
    false, -- Will be verified via email_verification_tokens
    true,
    true,
    mp.created_at, -- Preserve original creation date
    NOW()
  FROM missing_profiles mp
  ON CONFLICT (id) DO NOTHING;

  -- Get count of backfilled profiles
  GET DIAGNOSTICS backfill_count = ROW_COUNT;

  -- Log the result
  RAISE NOTICE 'Successfully backfilled % user profile(s)', backfill_count;

  -- Log details of backfilled users
  FOR user_record IN
    SELECT up.email, up.name, up.created_at
    FROM public.user_profiles up
    WHERE up.updated_at > NOW() - INTERVAL '1 minute'
    ORDER BY up.created_at DESC
  LOOP
    RAISE NOTICE '  - Backfilled: % (%) created at %',
      user_record.email, user_record.name, user_record.created_at;
  END LOOP;

END $$;

-- ───────────────────────────────────────────────────────────────────────
-- Verification: Check all users have profiles
-- ───────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  total_users INTEGER;
  users_with_profiles INTEGER;
  users_without_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;

  SELECT COUNT(*) INTO users_with_profiles
  FROM auth.users au
  INNER JOIN public.user_profiles up ON au.id = up.id;

  users_without_profiles := total_users - users_with_profiles;

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'User Profile Status Report:';
  RAISE NOTICE '  Total auth.users: %', total_users;
  RAISE NOTICE '  Users with profiles: %', users_with_profiles;
  RAISE NOTICE '  Users without profiles: %', users_without_profiles;

  IF users_without_profiles = 0 THEN
    RAISE NOTICE '  ✅ All users have profiles!';
  ELSE
    RAISE WARNING '  ⚠️  % user(s) still missing profiles', users_without_profiles;
  END IF;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
