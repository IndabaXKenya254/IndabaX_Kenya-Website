-- ═══════════════════════════════════════════════════════════════════════
-- NOAI SUBSECTIONS TABLE - Dynamic Content Blocks
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251222_create_noai_subsections
-- Description: Create subsections table for editable NOAI content blocks
-- This allows admins to add/edit/remove content sections while maintaining styling
-- Created: December 22, 2025
-- ═══════════════════════════════════════════════════════════════════════

-- 1. CREATE SUBSECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.noai_subsections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_section_key VARCHAR(100) NOT NULL, -- Links to noai_page_sections.section_key
  title VARCHAR(255), -- Optional title for the subsection
  content JSONB NOT NULL DEFAULT '{}', -- Flexible content storage (html, text, etc.)
  display_order INTEGER NOT NULL DEFAULT 0, -- Order within parent section
  is_published BOOLEAN NOT NULL DEFAULT true,

  -- Styling hints (optional, for different card types)
  style_variant VARCHAR(50), -- e.g., 'card', 'timeline', 'highlight', 'quote'
  icon VARCHAR(100), -- Icon class (e.g., 'icofont-trophy')

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_noai_subsections_parent ON public.noai_subsections(parent_section_key, is_published, display_order);
CREATE INDEX idx_noai_subsections_published ON public.noai_subsections(is_published, display_order);

-- 3. CREATE AUTO-UPDATE TRIGGER
CREATE TRIGGER update_noai_subsections_updated_at
  BEFORE UPDATE ON public.noai_subsections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. SET UP ROW LEVEL SECURITY (RLS)
ALTER TABLE public.noai_subsections ENABLE ROW LEVEL SECURITY;

-- Public read access for published subsections
CREATE POLICY "Public read access for published subsections"
  ON public.noai_subsections
  FOR SELECT
  USING (is_published = true);

-- Admin full access
CREATE POLICY "Admin full access to subsections"
  ON public.noai_subsections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
      AND admins.role IN ('admin', 'super_admin')
    )
  );

-- 5. INSERT SAMPLE SUBSECTIONS FOR ABOUT NOAI
INSERT INTO public.noai_subsections (parent_section_key, title, content, display_order, style_variant, icon) VALUES
-- About NOAI subsections
('about_noai', 'What is NOAI?', '{"html": "<p class=\"lead\">The National Olympiad for Artificial Intelligence (NOAI) is Kenya''s premier AI competition for high school students. It serves as the national selection process for the International Olympiad in Artificial Intelligence (IOAI).</p><p>NOAI brings together bright young minds from across Kenya to compete, learn, and showcase their understanding of AI concepts, machine learning, computer vision, and natural language processing.</p>"}', 1, 'card', 'icofont-brain-alt'),

('about_noai', 'Our Mission', '{"html": "<p>To inspire and nurture the next generation of AI innovators in Kenya by providing a platform for high school students to develop their skills, compete at the highest level, and represent Kenya on the international stage.</p>"}', 2, 'card', 'icofont-rocket-alt-2'),

('about_noai', 'Who Can Participate?', '{"html": "<ul><li>High school students (Form 1-4)</li><li>Kenyan citizens or residents</li><li>Passionate about AI, mathematics, and problem-solving</li><li>No prior AI experience required - just curiosity and dedication!</li></ul>"}', 3, 'card', 'icofont-users-alt-4'),

-- Kenya's Journey subsections
('kenya_journey', 'Our Historic Debut', '{"html": "<p class=\"lead\">Kenya made its debut at IOAI 2025 in Beijing, China on August 2nd, 2025, marking a historic moment for AI education in the country.</p><p>Our team competed alongside students from 33 countries and territories, representing the best and brightest young AI minds from across the African continent.</p>"}', 1, 'timeline', 'icofont-flag-alt-2'),

('kenya_journey', 'Team Performance', '{"html": "<p>The Kenyan delegation demonstrated strong capabilities, with students achieving commendable results. This active involvement is supported by local academic institutions and national initiatives aimed at nurturing talent in STEM fields from a young age.</p>"}', 2, 'highlight', 'icofont-trophy'),

('kenya_journey', 'Looking Ahead to 2026', '{"html": "<p>We are preparing an even stronger team for IOAI 2026 in Abu Dhabi, with expanded training programs, mentorship from AI professionals, and increased participation from schools across Kenya.</p>"}', 3, 'card', 'icofont-chart-growth');

-- 6. GRANT PERMISSIONS
GRANT SELECT ON public.noai_subsections TO anon, authenticated;
GRANT ALL ON public.noai_subsections TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════
-- Run this to verify the migration:
-- SELECT parent_section_key, title, display_order, is_published, style_variant
-- FROM noai_subsections
-- ORDER BY parent_section_key, display_order;
