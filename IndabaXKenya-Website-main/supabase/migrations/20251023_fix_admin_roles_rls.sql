-- ═══════════════════════════════════════════════════════════════════════
-- FIX ADMIN_ROLES RLS POLICY - Prevent Infinite Recursion
-- ═══════════════════════════════════════════════════════════════════════
-- Problem: admin_roles table uses is_admin() in RLS policy, but is_admin()
--          queries admin_roles, creating infinite recursion
-- Solution: Allow authenticated users to read their own row directly
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing policy (if any)
DROP POLICY IF EXISTS "Admin full access to admin_roles" ON public.admin_roles;

-- Allow authenticated users to SELECT their own admin_roles record
-- This is needed for is_admin() function to work
CREATE POLICY "Users can view own admin role"
  ON public.admin_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super admins can manage admin_roles (INSERT, UPDATE, DELETE)
-- Use direct check instead of is_admin() to avoid recursion
CREATE POLICY "Super admins can manage admin roles"
  ON public.admin_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );
