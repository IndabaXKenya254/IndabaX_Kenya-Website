-- ═══════════════════════════════════════════════════════════════════════
-- AUTOMATIC USER PROFILE CREATION TRIGGER + BACKFILL
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251222_create_user_profile_trigger_with_backfill
-- Purpose:
--   1. Create trigger to auto-generate user_profiles on auth.users INSERT
--   2. Backfill existing auth.users that don't have profiles
--   3. Fix login issues caused by missing user_profiles
--
-- Issue Fixed:
--   Users could register and verify email, but login failed with:
--   "Cannot coerce the result to a single JSON object" (PGRST116)
--   Root cause: user_profiles record was never created during registration
--
-- Reference: https://supabase.com/docs/guides/auth/managing-user-data
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- STEP 1: Create the trigger function (Idempotent)
-- ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile with data from auth.users metadata
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
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'organization', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    'applicant', -- Default role for new users
    false, -- Email verification handled separately via email_verification_tokens
    true, -- Mark as new user
    true, -- Active by default
    NOW(),
    NOW()
  )
  -- Handle race conditions: if profile already exists, do nothing
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth.users insert
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add function documentation
COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a user profile in public.user_profiles when a new user signs up.
Extracts metadata (name, organization, phone) from raw_user_meta_data passed during signup.
Includes error handling to prevent auth failures if profile creation fails.';

-- ───────────────────────────────────────────────────────────────────────
-- STEP 2: Create the trigger (Idempotent)
-- ───────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Trigger that automatically creates user_profiles record when new user signs up.
Fires after INSERT on auth.users and calls handle_new_user() function.';

-- ───────────────────────────────────────────────────────────────────────
-- STEP 3: Backfill existing users without profiles
-- ───────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  backfill_count INTEGER;
BEGIN
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
  RAISE NOTICE 'Backfilled % user profile(s)', backfill_count;
END $$;

-- ───────────────────────────────────────────────────────────────────────
-- STEP 4: Verification query (for manual testing)
-- ───────────────────────────────────────────────────────────────────────
-- Run this to verify all users have profiles:
--
-- SELECT
--   au.email,
--   CASE WHEN up.id IS NULL THEN '❌ NO PROFILE' ELSE '✅ HAS PROFILE' END as status
-- FROM auth.users au
-- LEFT JOIN public.user_profiles up ON au.id = up.id
-- ORDER BY au.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
