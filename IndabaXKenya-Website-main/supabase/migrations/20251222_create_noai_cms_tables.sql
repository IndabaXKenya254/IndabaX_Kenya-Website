-- ═══════════════════════════════════════════════════════════════════════
-- NOAI CMS TABLES - Content Management System for NOAI Single-Page
-- ═══════════════════════════════════════════════════════════════════════
-- Date: December 22, 2025
-- Purpose: Create database tables to support admin-editable NOAI page content
-- Tables: noai_page_sections, noai_participants, noai_faqs, noai_settings
-- ═══════════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. NOAI PAGE SECTIONS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Stores editable content sections for the NOAI single-page layout

CREATE TABLE IF NOT EXISTS public.noai_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX idx_noai_sections_key ON public.noai_page_sections(section_key);
CREATE INDEX idx_noai_sections_published ON public.noai_page_sections(is_published);
CREATE INDEX idx_noai_sections_order ON public.noai_page_sections(display_order);

-- Add comments
COMMENT ON TABLE public.noai_page_sections IS 'Admin-editable content sections for NOAI single-page layout';
COMMENT ON COLUMN public.noai_page_sections.section_key IS 'Unique identifier: about_noai, about_ioai, kenya_journey';
COMMENT ON COLUMN public.noai_page_sections.content IS 'JSON content: {text, images, links, etc.}';
COMMENT ON COLUMN public.noai_page_sections.display_order IS 'Order of sections on page (lower = higher)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. NOAI PARTICIPANTS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Stores team members who participated in IOAI, organized by year

CREATE TYPE public.participant_role AS ENUM (
  'contestant',
  'team_leader',
  'deputy_leader',
  'observer'
);

CREATE TYPE public.participant_achievement AS ENUM (
  'gold',
  'silver',
  'bronze',
  'honorable_mention',
  'participant'
);

CREATE TABLE IF NOT EXISTS public.noai_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  school VARCHAR(255),
  role public.participant_role NOT NULL DEFAULT 'contestant',
  photo_url TEXT,
  achievement public.participant_achievement,
  bio TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT valid_year CHECK (year >= 2024 AND year <= 2100)
);

-- Add indexes
CREATE INDEX idx_noai_participants_year ON public.noai_participants(year);
CREATE INDEX idx_noai_participants_published ON public.noai_participants(is_published);
CREATE INDEX idx_noai_participants_year_order ON public.noai_participants(year, display_order);

-- Add comments
COMMENT ON TABLE public.noai_participants IS 'Team members who participated in IOAI, organized by year';
COMMENT ON COLUMN public.noai_participants.year IS 'IOAI participation year (e.g., 2025, 2026)';
COMMENT ON COLUMN public.noai_participants.role IS 'Role: contestant, team_leader, deputy_leader, observer';
COMMENT ON COLUMN public.noai_participants.achievement IS 'Medal/award: gold, silver, bronze, honorable_mention, participant';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. NOAI FAQS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Stores FAQ items for NOAI page

CREATE TABLE IF NOT EXISTS public.noai_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes
CREATE INDEX idx_noai_faqs_category ON public.noai_faqs(category);
CREATE INDEX idx_noai_faqs_published ON public.noai_faqs(is_published);
CREATE INDEX idx_noai_faqs_order ON public.noai_faqs(display_order);

-- Add comments
COMMENT ON TABLE public.noai_faqs IS 'Frequently Asked Questions for NOAI page';
COMMENT ON COLUMN public.noai_faqs.category IS 'Optional category: general, eligibility, application, etc.';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. NOAI SETTINGS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Stores page-wide settings for NOAI page (single-row table)

CREATE TABLE IF NOT EXISTS public.noai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ioai_website_url TEXT NOT NULL DEFAULT 'https://ioai-official.org',
  application_deadline TIMESTAMPTZ,
  show_application_cta BOOLEAN NOT NULL DEFAULT true,
  application_status_text TEXT DEFAULT 'Applications are now open!',
  featured_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure only one settings record exists
  CONSTRAINT single_settings_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Add comments
COMMENT ON TABLE public.noai_settings IS 'Page-wide settings for NOAI (single-row table)';
COMMENT ON COLUMN public.noai_settings.ioai_website_url IS 'External link to official IOAI website';
COMMENT ON COLUMN public.noai_settings.application_deadline IS 'Application deadline for countdown timer';
COMMENT ON COLUMN public.noai_settings.featured_year IS 'Year to display first in participants section';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.noai_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noai_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noai_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noai_settings ENABLE ROW LEVEL SECURITY;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RLS POLICIES - Public Read Access
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Page Sections - Public can read published sections
CREATE POLICY "Public can view published sections"
  ON public.noai_page_sections
  FOR SELECT
  USING (is_published = true);

-- 2. Participants - Public can view published participants
CREATE POLICY "Public can view published participants"
  ON public.noai_participants
  FOR SELECT
  USING (is_published = true);

-- 3. FAQs - Public can view published FAQs
CREATE POLICY "Public can view published FAQs"
  ON public.noai_faqs
  FOR SELECT
  USING (is_published = true);

-- 4. Settings - Public can view settings
CREATE POLICY "Public can view settings"
  ON public.noai_settings
  FOR SELECT
  USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RLS POLICIES - Admin Full Access
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Helper function to check if user is admin (reuse existing if available)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can manage all sections
CREATE POLICY "Admins can manage sections"
  ON public.noai_page_sections
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can manage all participants
CREATE POLICY "Admins can manage participants"
  ON public.noai_participants
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can manage all FAQs
CREATE POLICY "Admins can manage FAQs"
  ON public.noai_faqs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON public.noai_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGERS - Auto-update updated_at timestamp
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Reuse existing trigger function if available, or create new one
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all NOAI tables
CREATE TRIGGER update_noai_sections_updated_at
  BEFORE UPDATE ON public.noai_page_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_noai_participants_updated_at
  BEFORE UPDATE ON public.noai_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_noai_faqs_updated_at
  BEFORE UPDATE ON public.noai_faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_noai_settings_updated_at
  BEFORE UPDATE ON public.noai_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SEED INITIAL DATA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Insert default page sections
INSERT INTO public.noai_page_sections (section_key, title, content, display_order) VALUES
  ('about_noai', 'About NOAI', '{"text": "The National Olympiad for Artificial Intelligence (NOAI) is Kenya''s premier AI competition for high school students. It serves as the national selection process for the International Olympiad in Artificial Intelligence (IOAI)."}', 1),
  ('about_ioai', 'About IOAI', '{"text": "The International Olympiad in Artificial Intelligence (IOAI) is the world''s first AI competition for high school students, bringing together the brightest young minds from around the globe."}', 2),
  ('kenya_journey', 'Kenya''s Journey', '{"text": "Kenya made its debut at IOAI 2025 in Beijing, China, marking a historic moment for AI education in the country. Our team competed alongside students from 33 countries and territories."}', 3)
ON CONFLICT (section_key) DO NOTHING;

-- Insert default settings (with fixed UUID)
INSERT INTO public.noai_settings (
  id,
  ioai_website_url,
  show_application_cta,
  application_status_text,
  featured_year
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'https://ioai-official.org',
  true,
  'Applications for NOAI 2026 are now open!',
  2025
)
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- COMPLETION NOTICE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
BEGIN
  RAISE NOTICE '✅ NOAI CMS tables created successfully!';
  RAISE NOTICE '📋 Tables: noai_page_sections, noai_participants, noai_faqs, noai_settings';
  RAISE NOTICE '🔒 RLS policies enabled for public read and admin full access';
  RAISE NOTICE '📝 Default content seeded';
END $$;
