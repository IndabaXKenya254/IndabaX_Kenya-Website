-- ═══════════════════════════════════════════════════════════════════════
-- FIX ADMIN_ROLES RLS - FINAL SOLUTION (Based on PostgreSQL Best Practices)
-- ═══════════════════════════════════════════════════════════════════════
-- Research Sources:
-- - https://github.com/orgs/supabase/discussions/3328
-- - https://stackoverflow.com/questions/48238936/
-- - PostgreSQL Official Docs on SECURITY DEFINER
--
-- Problem: RLS policy on admin_roles calls is_admin(), which queries admin_roles,
--          creating infinite recursion
--
-- Solution:
-- 1. is_admin() is already SECURITY DEFINER (bypasses RLS)
-- 2. admin_roles table must have NO policy that references itself
-- 3. Use simple policy: user_id = auth.uid() (no subqueries)
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Drop ALL existing policies on admin_roles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'admin_roles'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.admin_roles';
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create simple SELECT policy (NO RECURSION)
-- Authenticated users can SELECT their own admin_roles row
-- This allows is_admin() function to work (which has SECURITY DEFINER)
CREATE POLICY "admin_roles_select_own"
  ON public.admin_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Note: No INSERT/UPDATE/DELETE policies defined
-- Admin role management is done via:
-- - Supabase Dashboard (as postgres superuser)
-- - Direct SQL (as postgres superuser)
-- - Or via service role key in backend (bypasses RLS)

-- Step 4: Verify the is_admin() function is SECURITY DEFINER
-- This should already be set, but let's ensure it
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The SECURITY DEFINER makes this function run as the postgres superuser
-- which bypasses RLS, preventing recursion
