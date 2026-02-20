-- ═══════════════════════════════════════════════════════════════════════
-- PUBLIC FORM ACCESS FOR REGISTRATION
-- Created: December 29, 2025
-- Purpose: Allow anonymous/public access to form templates and questions
--          so that public registration pages can load forms without auth
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- POLICY: Allow anonymous users to read form templates
-- Needed for public event registration pages
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Allow public read access to form templates" ON form_templates;
CREATE POLICY "Allow public read access to form templates" ON form_templates
  FOR SELECT
  TO anon
  USING (true);

-- ═══════════════════════════════════════════════════════════════════════
-- POLICY: Allow anonymous users to read form questions
-- Needed for public event registration pages to display form fields
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Allow public read access to form questions" ON form_questions;
CREATE POLICY "Allow public read access to form questions" ON form_questions
  FOR SELECT
  TO anon
  USING (true);

-- ═══════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════
COMMENT ON POLICY "Allow public read access to form templates" ON form_templates
  IS 'Allow anonymous users to read form templates for public registration';

COMMENT ON POLICY "Allow public read access to form questions" ON form_questions
  IS 'Allow anonymous users to read form questions for public registration';
