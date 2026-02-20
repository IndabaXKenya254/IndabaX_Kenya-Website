-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD REVIEW COLUMNS TO PAPER ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════════════════
-- Add columns for storing review data (score, comments, recommendation)

ALTER TABLE paper_reviewer_assignments
ADD COLUMN IF NOT EXISTS review_score INTEGER CHECK (review_score >= 1 AND review_score <= 10),
ADD COLUMN IF NOT EXISTS review_comments TEXT,
ADD COLUMN IF NOT EXISTS review_recommendation TEXT CHECK (review_recommendation IN ('accept', 'revise', 'reject'));
