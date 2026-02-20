-- ═══════════════════════════════════════════════════════════════════════
-- FIX is_admin() FUNCTION - Use Correct user_profiles Table
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251222_fix_is_admin_function
-- Date: December 22, 2025
--
-- Issue Fixed:
--   ERROR: relation "public.user_roles" does not exist (42P01)
--   Root cause: is_admin() function was looking for non-existent user_roles table
--
-- Solution:
--   Update is_admin() to check user_profiles.role column instead
--   The system uses user_profiles table with role enum (applicant, speaker, reviewer, admin)
-- ═══════════════════════════════════════════════════════════════════════

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS public.is_admin();

-- Create corrected is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has admin role in user_profiles table
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Add function documentation
COMMENT ON FUNCTION public.is_admin() IS
'Checks if the current authenticated user has admin role.
Returns true if user_profiles.role = ''admin'', false otherwise.
Used in RLS policies to restrict admin-only operations.';

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════
-- Test the function (should return true for admin users, false for others):
-- SELECT is_admin();

-- Check function definition:
-- SELECT routine_name, routine_definition
-- FROM information_schema.routines
-- WHERE routine_name = 'is_admin' AND routine_schema = 'public';

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
