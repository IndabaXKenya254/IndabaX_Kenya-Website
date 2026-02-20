-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: reviewer_paper_stats SECURITY DEFINER → SECURITY INVOKER
-- ═══════════════════════════════════════════════════════════════════════════
-- Supabase linter flagged: View `public.reviewer_paper_stats` is defined
-- with the SECURITY DEFINER property, which bypasses RLS policies.
-- Changing to SECURITY INVOKER so queries respect the calling user's
-- permissions and RLS policies.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER VIEW public.reviewer_paper_stats SET (security_invoker = on);
