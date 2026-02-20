-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD canComment PERMISSION (Issue #8)
-- ═══════════════════════════════════════════════════════════════════════════
-- Problem: Phase 1 Issue #24 fix added a canComment permission check to the
-- reviewer notes API, but canComment was never added to the default permissions
-- JSONB or admin UI. All reviewers had canComment=undefined → false, making
-- the comment section completely non-functional.
-- Solution: Add canComment=true to all existing reviewers and update the
-- column default to include it.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Update all existing reviewers to include canComment: true
UPDATE public.reviewers
SET permissions = permissions || '{"canComment": true}'::jsonb
WHERE permissions IS NOT NULL
  AND NOT (permissions ? 'canComment');

-- 2. Update the column default to include canComment for new reviewers
ALTER TABLE public.reviewers
ALTER COLUMN permissions SET DEFAULT '{
  "canViewApplications": true,
  "canApprove": false,
  "canReject": false,
  "canViewPII": true,
  "canViewSurveyResponses": true,
  "canViewPaperSubmissions": true,
  "canComment": true
}'::jsonb;
