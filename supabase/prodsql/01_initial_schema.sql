-- ============================================================================
-- INDABAX KENYA - INITIAL DATABASE SCHEMA
-- ============================================================================
-- Created: October 20, 2025
-- Purpose: Phase 2 Backend - Complete database setup
-- Tables: 15
-- Execution: Run once in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search (for future use)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SECTION 2: TABLE DEFINITIONS
-- ============================================================================

-- ============================================================================
-- TABLE: events
-- ============================================================================
-- Purpose: Store event information (conferences, workshops, etc.)
-- Access: Public read (published only), Admin full access
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  location VARCHAR(255),
  venue TEXT,
  featured_image TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  event_type VARCHAR(50) DEFAULT 'upcoming' CHECK (event_type IN ('upcoming', 'past')),
  is_featured BOOLEAN DEFAULT FALSE,
  venue_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.events IS 'Conference events and workshops';
COMMENT ON COLUMN public.events.venue_details IS 'JSON: {address, map_url, hotels: [...]}';

-- ============================================================================
-- TABLE: speakers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  organization VARCHAR(255),
  photo_url TEXT,
  bio_short TEXT,
  bio_full TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.speakers IS 'Event speakers and presenters';
COMMENT ON COLUMN public.speakers.bio_short IS '2-3 sentences for flip cards';
COMMENT ON COLUMN public.speakers.bio_full IS 'Full biography (future: detail pages)';

-- ============================================================================
-- TABLE: posts (News & Updates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category VARCHAR(100) CHECK (category IN ('news', 'announcement', 'article')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.posts IS 'News, announcements, and articles';

-- ============================================================================
-- TABLE: event_speakers (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE,
  role VARCHAR(50) CHECK (role IN ('keynote', 'speaker', 'panelist', 'moderator')),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, speaker_id)
);

COMMENT ON TABLE public.event_speakers IS 'Links speakers to events with roles';

-- ============================================================================
-- TABLE: applications (Registrations + Call for Papers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  application_type VARCHAR(50) NOT NULL CHECK (application_type IN ('registration', 'call_for_papers')),

  -- Personal Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  organization VARCHAR(255),
  country VARCHAR(100),

  -- Registration Specific
  ticket_type VARCHAR(50) CHECK (ticket_type IN ('general', 'student', 'speaker')),
  dietary_requirements TEXT,
  tshirt_size VARCHAR(10),
  accessibility_needs TEXT,

  -- Call for Papers Specific
  presentation_type VARCHAR(50) CHECK (presentation_type IN ('talk', 'workshop', 'poster')),
  presentation_title VARCHAR(255),
  abstract TEXT,
  keywords TEXT,
  track VARCHAR(100),
  bio TEXT,
  linkedin_url TEXT,
  file_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  admin_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.applications IS 'Event registrations and paper submissions';
COMMENT ON COLUMN public.applications.application_type IS 'registration or call_for_papers';

-- ============================================================================
-- TABLE: subscribers (Newsletter)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.subscribers IS 'Newsletter email list';

-- ============================================================================
-- TABLE: photos (Gallery)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  year INT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_name VARCHAR(255),
  caption TEXT,
  photographer VARCHAR(255),
  display_order INT DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.photos IS 'Gallery photos organized by year and event';

-- ============================================================================
-- TABLE: sponsors
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze')),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.sponsors IS 'Event sponsors grouped by tier';

-- ============================================================================
-- TABLE: team_members
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  photo_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.team_members IS 'Organization team members';

-- ============================================================================
-- TABLE: schedule_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number > 0),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_type VARCHAR(50) CHECK (session_type IN ('keynote', 'talk', 'workshop', 'break', 'networking')),
  location VARCHAR(255),
  speaker_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.schedule_items IS 'Event schedule by day';
COMMENT ON COLUMN public.schedule_items.speaker_ids IS 'Array of speaker UUIDs';

-- ============================================================================
-- TABLE: faqs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) CHECK (category IN ('registration', 'venue', 'schedule', 'speakers', 'general')),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.faqs IS 'Frequently asked questions';

-- ============================================================================
-- TABLE: contact_submissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.contact_submissions IS 'Contact form submissions';

-- ============================================================================
-- TABLE: settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.settings IS 'Site-wide configuration';
COMMENT ON COLUMN public.settings.value IS 'JSON value for flexible settings';

-- ============================================================================
-- TABLE: static_content
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.static_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page VARCHAR(100) NOT NULL,
  section VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'html' CHECK (content_type IN ('html', 'markdown', 'text')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(page, section)
);

COMMENT ON TABLE public.static_content IS 'Editable static page content (future)';

-- ============================================================================
-- TABLE: admin_roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.admin_roles IS 'Admin user roles and permissions';
COMMENT ON COLUMN public.admin_roles.permissions IS 'JSON: {can_delete: true, can_export: true}';

-- ============================================================================
-- SECTION 3: TRIGGERS
-- ============================================================================

-- Trigger function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_speakers_updated_at
    BEFORE UPDATE ON public.speakers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_static_content_updated_at
    BEFORE UPDATE ON public.static_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 4: INDEXES
-- ============================================================================

-- Events indexes
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_date ON public.events(start_date DESC);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_featured ON public.events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_events_type ON public.events(event_type);

-- Posts indexes
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_author ON public.posts(author_id);

-- Speakers indexes
CREATE INDEX idx_speakers_featured ON public.speakers(is_featured, display_order);
CREATE INDEX idx_speakers_display_order ON public.speakers(display_order);

-- Event Speakers indexes
CREATE INDEX idx_event_speakers_event ON public.event_speakers(event_id);
CREATE INDEX idx_event_speakers_speaker ON public.event_speakers(speaker_id);
CREATE INDEX idx_event_speakers_role ON public.event_speakers(role);

-- Applications indexes
CREATE INDEX idx_applications_type ON public.applications(application_type);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_email ON public.applications(email);
CREATE INDEX idx_applications_submitted ON public.applications(submitted_at DESC);
CREATE INDEX idx_applications_event ON public.applications(event_id) WHERE event_id IS NOT NULL;

-- Subscribers indexes
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_status ON public.subscribers(status);

-- Photos indexes
CREATE INDEX idx_photos_year ON public.photos(year DESC);
CREATE INDEX idx_photos_event ON public.photos(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_photos_display_order ON public.photos(year, display_order);

-- Sponsors indexes
CREATE INDEX idx_sponsors_tier ON public.sponsors(tier, display_order);
CREATE INDEX idx_sponsors_active ON public.sponsors(is_active) WHERE is_active = TRUE;

-- Team Members indexes
CREATE INDEX idx_team_display_order ON public.team_members(display_order);
CREATE INDEX idx_team_active ON public.team_members(is_active) WHERE is_active = TRUE;

-- Schedule Items indexes
CREATE INDEX idx_schedule_event_day ON public.schedule_items(event_id, day_number, start_time);
CREATE INDEX idx_schedule_type ON public.schedule_items(session_type);

-- FAQs indexes
CREATE INDEX idx_faqs_category ON public.faqs(category, display_order);
CREATE INDEX idx_faqs_active ON public.faqs(is_active) WHERE is_active = TRUE;

-- Contact Submissions indexes
CREATE INDEX idx_contact_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_created ON public.contact_submissions(created_at DESC);

-- Settings indexes
CREATE INDEX idx_settings_key ON public.settings(key);

-- Admin Roles indexes
CREATE INDEX idx_admin_user ON public.admin_roles(user_id);
CREATE INDEX idx_admin_role ON public.admin_roles(role);

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function to check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PUBLIC READ POLICIES (Published content only)
-- ============================================================================

-- Events: Public can view published events
CREATE POLICY "Public view published events"
  ON public.events FOR SELECT
  USING (status = 'published');

-- Posts: Public can view published posts
CREATE POLICY "Public view published posts"
  ON public.posts FOR SELECT
  USING (status = 'published' AND published_at IS NOT NULL);

-- Speakers: Public can view all speakers
CREATE POLICY "Public view speakers"
  ON public.speakers FOR SELECT
  USING (true);

-- Event Speakers: Public can view all
CREATE POLICY "Public view event speakers"
  ON public.event_speakers FOR SELECT
  USING (true);

-- Photos: Public can view all
CREATE POLICY "Public view photos"
  ON public.photos FOR SELECT
  USING (true);

-- Sponsors: Public can view active sponsors
CREATE POLICY "Public view active sponsors"
  ON public.sponsors FOR SELECT
  USING (is_active = true);

-- Team: Public can view active team members
CREATE POLICY "Public view active team"
  ON public.team_members FOR SELECT
  USING (is_active = true);

-- Schedule: Public can view all
CREATE POLICY "Public view schedule"
  ON public.schedule_items FOR SELECT
  USING (true);

-- FAQs: Public can view active FAQs
CREATE POLICY "Public view active FAQs"
  ON public.faqs FOR SELECT
  USING (is_active = true);

-- Settings: Public can view specific settings
CREATE POLICY "Public view specific settings"
  ON public.settings FOR SELECT
  USING (key IN ('popup', 'site_info'));

-- ============================================================================
-- PUBLIC INSERT POLICIES (Forms)
-- ============================================================================

-- Applications: Anyone can submit
CREATE POLICY "Public submit applications"
  ON public.applications FOR INSERT
  WITH CHECK (true);

-- Subscribers: Anyone can subscribe
CREATE POLICY "Public subscribe"
  ON public.subscribers FOR INSERT
  WITH CHECK (true);

-- Contact: Anyone can contact
CREATE POLICY "Public submit contact"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ADMIN FULL ACCESS POLICIES
-- ============================================================================

-- Events: Admin full access
CREATE POLICY "Admin full access to events"
  ON public.events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Posts: Admin full access
CREATE POLICY "Admin full access to posts"
  ON public.posts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Speakers: Admin full access
CREATE POLICY "Admin full access to speakers"
  ON public.speakers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Event Speakers: Admin full access
CREATE POLICY "Admin full access to event_speakers"
  ON public.event_speakers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Applications: Admin full access
CREATE POLICY "Admin full access to applications"
  ON public.applications FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Subscribers: Admin full access
CREATE POLICY "Admin full access to subscribers"
  ON public.subscribers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Photos: Admin full access
CREATE POLICY "Admin full access to photos"
  ON public.photos FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Sponsors: Admin full access
CREATE POLICY "Admin full access to sponsors"
  ON public.sponsors FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Team: Admin full access
CREATE POLICY "Admin full access to team"
  ON public.team_members FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Schedule: Admin full access
CREATE POLICY "Admin full access to schedule"
  ON public.schedule_items FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- FAQs: Admin full access
CREATE POLICY "Admin full access to FAQs"
  ON public.faqs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Contact: Admin full access
CREATE POLICY "Admin full access to contact"
  ON public.contact_submissions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Settings: Admin full access
CREATE POLICY "Admin full access to settings"
  ON public.settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Static Content: Admin full access
CREATE POLICY "Admin full access to static_content"
  ON public.static_content FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin Roles: Super admin only
CREATE POLICY "Super admin manage roles"
  ON public.admin_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================================
-- SECTION 6: SEED DATA
-- ============================================================================

-- Settings: Popup configuration
INSERT INTO public.settings (key, value, description) VALUES
('popup', '{
  "enabled": true,
  "title": "Register for IndabaX Kenya 2026",
  "content": "• Join 500+ AI enthusiasts<br>• Network with researchers<br>• Free workshops & talks",
  "buttonText": "Register Now",
  "buttonLink": "/register",
  "delay": 3
}'::jsonb, 'Registration popup settings'),

('site_info', '{
  "title": "IndabaX Kenya",
  "description": "Leading AI/ML Conference in East Africa",
  "contact_email": "info@indabaxkenya.org",
  "contact_phone": "+254 700 000 000",
  "address": "University of Nairobi, Nairobi, Kenya"
}'::jsonb, 'General site information');

-- Sample Event: IndabaX Kenya 2026
INSERT INTO public.events (slug, title, description, start_date, end_date, location, venue, status, event_type, is_featured, venue_details) VALUES
('indabax-kenya-2026', 'IndabaX Kenya 2026',
'Join us for the premier AI and Machine Learning conference in East Africa. Three days of keynotes, workshops, and networking with leading researchers and practitioners.',
'2026-03-15', '2026-03-17', 'Nairobi, Kenya', 'KICC (Kenyatta International Convention Centre)',
'published', 'upcoming', true,
'{"address": "Harambee Avenue, Nairobi", "map_url": "https://maps.google.com/?q=KICC+Nairobi", "hotels": ["Sarova Stanley", "Hilton Nairobi"]}'::jsonb);

-- Sample Speakers
INSERT INTO public.speakers (name, title, organization, bio_short, is_featured, display_order) VALUES
('Dr. Jane Mwangi', 'AI Research Lead', 'DeepMind Africa',
'Leading researcher in natural language processing with focus on African languages. Published 20+ papers in top-tier conferences.',
true, 1),

('Prof. James Odhiambo', 'Professor of Computer Science', 'University of Nairobi',
'Expert in machine learning applications for agriculture. Founder of AgriTech ML Lab.',
true, 2);

-- Sample Post
INSERT INTO public.posts (slug, title, excerpt, content, status, category, published_at) VALUES
('welcome-indabax-2026', 'Welcome to IndabaX Kenya 2026',
'We are excited to announce IndabaX Kenya 2026, happening March 15-17 in Nairobi!',
'<h2>About IndabaX Kenya 2026</h2><p>We are thrilled to announce the return of IndabaX Kenya for 2026! This year promises to be our biggest and best event yet, with keynotes from leading researchers, hands-on workshops, and networking opportunities.</p><h3>What to Expect</h3><ul><li>Keynote presentations from global AI leaders</li><li>Technical workshops on cutting-edge ML techniques</li><li>Networking sessions with peers and mentors</li><li>Poster sessions showcasing local research</li></ul><p>Registration is now open and completely FREE. We look forward to seeing you there!</p>',
'published', 'announcement', NOW());

-- Sample FAQs
INSERT INTO public.faqs (question, answer, category, display_order, is_active) VALUES
('How do I register for IndabaX Kenya 2026?',
'Registration is completely free! Simply visit our registration page, fill out the form with your details, and you will receive a confirmation email.',
'registration', 1, true),

('Where is the event located?',
'IndabaX Kenya 2026 will be held at KICC (Kenyatta International Convention Centre) in Nairobi, Kenya. The venue is centrally located and easily accessible.',
'venue', 2, true),

('Is there a cost to attend?',
'No! Attendance is completely free for all participants. We believe in making AI education accessible to everyone.',
'registration', 3, true);

-- Sample Sponsors
INSERT INTO public.sponsors (name, logo_url, website_url, tier, display_order, is_active) VALUES
('DeepLearning.AI', 'https://via.placeholder.com/300x100/1a5490/ffffff?text=DeepLearning.AI', 'https://www.deeplearning.ai', 'platinum', 1, true),
('Google Research', 'https://via.placeholder.com/300x100/4285f4/ffffff?text=Google+Research', 'https://research.google', 'gold', 2, true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify installation
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  RAISE NOTICE 'Migration complete! Created % tables.', table_count;
END $$;
