-- ═══════════════════════════════════════════════════════════════════════
-- FIX ADMIN_ROLES RLS POLICY V2 - Simpler Approach
-- ═══════════════════════════════════════════════════════════════════════
-- Problem: Any policy that queries admin_roles creates infinite recursion
-- Solution: Only allow SELECT for own row, disable other operations via RLS
-- ═══════════════════════════════════════════════════════════════════════

-- Drop ALL existing policies on admin_roles
DROP POLICY IF EXISTS "Users can view own admin role" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admin full access to admin_roles" ON public.admin_roles;

-- Simple policy: authenticated users can only SELECT their own row
-- This breaks the recursion because there's no subquery
CREATE POLICY "Select own admin role"
  ON public.admin_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Note: INSERT/UPDATE/DELETE are blocked by RLS (no policies defined)
-- Admin management will be done via Supabase Dashboard or direct SQL
