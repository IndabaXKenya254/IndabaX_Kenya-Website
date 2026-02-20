-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD TEMPLATE SNAPSHOT TO FORM RESPONSES (Issue #44)
-- ═══════════════════════════════════════════════════════════════════════════
-- When a form template is edited after submissions exist, the question-to-
-- response mapping breaks because responses are keyed by question UUID.
-- This column stores the question order and labels at submission time so
-- responses can always be displayed correctly.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS template_snapshot JSONB;

COMMENT ON COLUMN public.form_responses.template_snapshot IS
'Snapshot of form template questions at submission time. Stores question IDs, titles, types, and order for stable display even if the template is later modified.';

-- Index for queries that check if snapshot exists
CREATE INDEX IF NOT EXISTS idx_form_responses_has_snapshot
ON public.form_responses ((template_snapshot IS NOT NULL))
WHERE template_snapshot IS NOT NULL;
