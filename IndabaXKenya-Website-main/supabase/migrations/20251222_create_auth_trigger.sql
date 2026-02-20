-- ═══════════════════════════════════════════════════════════════════════
-- AUTOMATIC USER PROFILE CREATION TRIGGER (PRODUCTION READY)
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251222_create_auth_trigger
-- Status: ✅ APPLIED (via execute_sql)
-- Date: December 22, 2025
--
-- Purpose:
--   Automatically creates user_profiles records when users register
--   through Supabase Auth, preventing login failures due to missing profiles
--
-- What This Fixes:
--   - Login error: "Cannot coerce the result to a single JSON object" (PGRST116)
--   - Users could register and verify email but couldn't log in
--   - Root cause: No user_profile record was created during registration
--
-- Implementation:
--   1. Function: public.handle_new_user() - Creates profile from auth metadata
--   2. Trigger: on_auth_user_created - Fires AFTER INSERT on auth.users
--   3. Security: SECURITY DEFINER with proper permissions
--   4. Error Handling: EXCEPTION block prevents auth failures
--   5. Race Conditions: ON CONFLICT DO NOTHING for idempotency
--
-- Reference: https://supabase.com/docs/guides/auth/managing-user-data
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- FUNCTION: Create user profile from auth metadata
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
    -- This ensures user registration succeeds even if profile creation fails
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Add function documentation
COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a user profile in public.user_profiles when a new user signs up.
Extracts metadata (name, organization, phone) from raw_user_meta_data passed during signup.
Includes error handling to prevent auth failures if profile creation fails.
Security: SECURITY DEFINER allows writing to user_profiles from auth schema.';

-- ───────────────────────────────────────────────────────────────────────
-- TRIGGER: Fire on new user creation
-- ───────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Trigger that automatically creates user_profiles record when new user signs up.
Fires after INSERT on auth.users and calls handle_new_user() function.
This ensures every authenticated user has a corresponding profile for role-based access.';

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════

-- Check trigger exists:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- Check function exists:
-- SELECT routine_name, routine_type, security_type
-- FROM information_schema.routines
-- WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- Check all users have profiles:
-- SELECT
--   au.email,
--   CASE WHEN up.id IS NULL THEN '❌ NO PROFILE' ELSE '✅ HAS PROFILE' END as status
-- FROM auth.users au
-- LEFT JOIN public.user_profiles up ON au.id = up.id
-- ORDER BY au.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
