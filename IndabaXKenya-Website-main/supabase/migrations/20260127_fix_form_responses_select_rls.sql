-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: form_responses SELECT RLS policy missing user_id check
-- Date: 2026-01-27
-- ═══════════════════════════════════════════════════════════════════════════
-- Bug: The SELECT policy only checks `respondent_email = auth.email()`,
-- but NOT `user_id = auth.uid()`. This causes submission failures when:
--   1. Auto-save creates a record with user_id (INSERT policy allows this)
--   2. User enters a different email in the form than their auth email
--   3. Final submission tries to SELECT the existing record by user_id
--   4. RLS blocks it (no user_id in SELECT policy)
--   5. API thinks no record exists → tries INSERT → fails (duplicate)
--
-- Symptom: "progress is saving" (auto-save INSERT works) but final
-- submission fails. The record appears in the dashboard but status
-- never updates to "completed".
--
-- Fix: Add `user_id = auth.uid()` to the SELECT policy USING clause.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow authenticated users to view own form responses" ON public.form_responses;

CREATE POLICY "Allow authenticated users to view own form responses" ON public.form_responses
  FOR SELECT
  TO public
  USING (
    (user_id = auth.uid())
    OR ((respondent_email)::text = (SELECT auth.email()))
    OR (EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
        AND user_profiles.role = 'admin'::user_role
    ))
  );
