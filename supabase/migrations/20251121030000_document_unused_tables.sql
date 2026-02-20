-- ═══════════════════════════════════════════════════════════════════════
-- DOCUMENTATION: UNUSED TABLES
-- ═══════════════════════════════════════════════════════════════════════
-- This migration documents tables that exist but are not currently used

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: form_answers (UNUSED)
-- ═══════════════════════════════════════════════════════════════════════
--
-- STATUS: Created but NEVER USED
--
-- ORIGINAL PURPOSE:
-- Normalized storage of form answers (one row per question answer)
-- Alternative to denormalized JSONB approach
--
-- CURRENT IMPLEMENTATION:
-- Phase 4 uses denormalized storage in `form_responses.responses` (JSONB column)
-- Each response is stored as: { "question_id": "answer_value" }
--
-- WHY UNUSED:
-- 1. Denormalized approach chosen for:
--    - Faster retrieval (single query gets all answers)
--    - Simpler auto-save implementation
--    - Flexible schema (supports dynamic forms)
--    - JSONB supports complex types (arrays, objects)
--
-- 2. Normalized approach trade-offs:
--    ✅ PRO: Can query individual answers with SQL
--    ✅ PRO: Referential integrity on answers
--    ❌ CON: Multiple joins required to get full response
--    ❌ CON: More complex auto-save logic
--    ❌ CON: Higher database overhead
--
-- RECOMMENDATION:
-- Keep table for future use if normalized storage is needed
--
-- MIGRATION TO NORMALIZED (if needed in future):
-- 1. Migrate data from form_responses.responses JSONB to form_answers rows
-- 2. Update API to query form_answers table
-- 3. Update auto-save logic to handle row-based updates
--
-- CLEANUP (if never used):
-- DROP TABLE form_answers CASCADE;
--
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON TABLE form_answers IS
'UNUSED: Reserved for future normalized storage of form answers.
Current implementation uses denormalized JSONB in form_responses.responses column.
Created in migration 20251120000000_registration_redesign.sql but never populated.';

-- Add comment to explain why responses column is used instead
COMMENT ON COLUMN form_responses.responses IS
'Denormalized storage of form answers as JSONB.
Format: { "question_id": "answer_value", ... }
Preferred over normalized form_answers table for performance and flexibility.';
