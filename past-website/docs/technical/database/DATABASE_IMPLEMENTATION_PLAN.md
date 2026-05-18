# Database Implementation Plan
## Complete SQL Migration Strategy

**Purpose:** Define EXACTLY how to create all 15 tables, indexes, RLS policies, and seed data

**Decision Reference:** CRITICAL_DECISIONS.md → Choice: Single Migration File

**Date:** October 20, 2025

---

## 📋 OVERVIEW

**Approach:** Single SQL migration file

**File:** `supabase/migrations/20251020_initial_schema.sql`

**Execution:** Run once in Supabase SQL Editor

**Total Lines:** ~1,200 lines

---

## 📂 FILE STRUCTURE

```sql
-- supabase/migrations/20251020_initial_schema.sql

-- ============================================================================
-- INDABAX KENYA - INITIAL DATABASE SCHEMA
-- ============================================================================
-- Created: October 20, 2025
-- Purpose: Phase 2 Backend - Complete database setup
-- Tables: 15
-- Execution: Run once in Supabase SQL Editor
-- ============================================================================

-- SECTION 1: EXTENSIONS (lines 1-20)
-- SECTION 2: TABLE DEFINITIONS (lines 21-600)
-- SECTION 3: INDEXES (lines 601-700)
-- SECTION 4: RLS POLICIES (lines 701-1000)
-- SECTION 5: SEED DATA (lines 1001-1200)

-- ============================================================================
```

---

## 🔧 SECTION 1: EXTENSIONS

```sql
-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search (for future use)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

**Purpose:** Enable UUID generation and search capabilities

**Lines:** ~10 lines

---

## 📊 SECTION 2: TABLE DEFINITIONS (15 Tables)

### Table Creation Order (Dependency-Safe)

```
1. events (no dependencies)
2. speakers (no dependencies)
3. posts (references auth.users)
4. event_speakers (references events, speakers)
5. applications (references events, auth.users)
6. subscribers (no dependencies)
7. photos (references events, auth.users)
8. sponsors (no dependencies)
9. team_members (no dependencies)
10. schedule_items (references events)
11. faqs (no dependencies)
12. contact_submissions (references auth.users)
13. settings (no dependencies)
14. static_content (references auth.users)
15. admin_roles (references auth.users)
```

---

### Table 1: events

```sql
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

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.events IS 'Conference events and workshops';
COMMENT ON COLUMN public.events.venue_details IS 'JSON: {address, map_url, hotels: [...]}';
```

**Lines:** ~40 lines

---

### Table 2: speakers

```sql
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

CREATE TRIGGER update_speakers_updated_at
    BEFORE UPDATE ON public.speakers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.speakers IS 'Event speakers and presenters';
COMMENT ON COLUMN public.speakers.bio_short IS '2-3 sentences for flip cards';
COMMENT ON COLUMN public.speakers.bio_full IS 'Full biography (future: detail pages)';
```

**Lines:** ~30 lines

---

### Table 3: posts (News & Updates)

```sql
-- ============================================================================
-- TABLE: posts
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

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.posts IS 'News, announcements, and articles';
```

**Lines:** ~25 lines

---

### Table 4: event_speakers (Many-to-Many)

```sql
-- ============================================================================
-- TABLE: event_speakers
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
```

**Lines:** ~15 lines

---

### Table 5: applications (Registrations + Call for Papers)

```sql
-- ============================================================================
-- TABLE: applications
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
```

**Lines:** ~45 lines

---

### Table 6: subscribers (Newsletter)

```sql
-- ============================================================================
-- TABLE: subscribers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.subscribers IS 'Newsletter email list';
```

**Lines:** ~12 lines

---

### Table 7: photos (Gallery)

```sql
-- ============================================================================
-- TABLE: photos
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
```

**Lines:** ~20 lines

---

### Table 8: sponsors

```sql
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
```

**Lines:** ~15 lines

---

### Table 9: team_members

```sql
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
```

**Lines:** ~17 lines

---

### Table 10: schedule_items

```sql
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
```

**Lines:** ~20 lines

---

### Table 11: faqs

```sql
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

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.faqs IS 'Frequently asked questions';
```

**Lines:** ~20 lines

---

### Table 12: contact_submissions

```sql
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

CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.contact_submissions IS 'Contact form submissions';
```

**Lines:** ~25 lines

---

### Table 13: settings

```sql
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

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.settings IS 'Site-wide configuration';
COMMENT ON COLUMN public.settings.value IS 'JSON value for flexible settings';
```

**Lines:** ~20 lines

---

### Table 14: static_content

```sql
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

CREATE TRIGGER update_static_content_updated_at
    BEFORE UPDATE ON public.static_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.static_content IS 'Editable static page content (future)';
```

**Lines:** ~20 lines

---

### Table 15: admin_roles

```sql
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
```

**Lines:** ~15 lines

**Total Table Lines:** ~400 lines

---

## 🔍 SECTION 3: INDEXES

```sql
-- ============================================================================
-- INDEXES
-- ============================================================================

-- events
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_date ON public.events(start_date DESC);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_featured ON public.events(is_featured) WHERE is_featured = TRUE;

-- posts
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_category ON public.posts(category);

-- speakers
CREATE INDEX idx_speakers_featured ON public.speakers(is_featured, display_order);
CREATE INDEX idx_speakers_display_order ON public.speakers(display_order);

-- event_speakers
CREATE INDEX idx_event_speakers_event ON public.event_speakers(event_id);
CREATE INDEX idx_event_speakers_speaker ON public.event_speakers(speaker_id);

-- applications
CREATE INDEX idx_applications_type ON public.applications(application_type);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_email ON public.applications(email);
CREATE INDEX idx_applications_submitted ON public.applications(submitted_at DESC);
CREATE INDEX idx_applications_event ON public.applications(event_id) WHERE event_id IS NOT NULL;

-- subscribers
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_status ON public.subscribers(status);

-- photos
CREATE INDEX idx_photos_year ON public.photos(year DESC);
CREATE INDEX idx_photos_event ON public.photos(event_id) WHERE event_id IS NOT NULL;

-- sponsors
CREATE INDEX idx_sponsors_tier ON public.sponsors(tier, display_order);
CREATE INDEX idx_sponsors_active ON public.sponsors(is_active) WHERE is_active = TRUE;

-- team_members
CREATE INDEX idx_team_display_order ON public.team_members(display_order);
CREATE INDEX idx_team_active ON public.team_members(is_active) WHERE is_active = TRUE;

-- schedule_items
CREATE INDEX idx_schedule_event_day ON public.schedule_items(event_id, day_number, start_time);

-- faqs
CREATE INDEX idx_faqs_category ON public.faqs(category, display_order);
CREATE INDEX idx_faqs_active ON public.faqs(is_active) WHERE is_active = TRUE;

-- contact_submissions
CREATE INDEX idx_contact_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_created ON public.contact_submissions(created_at DESC);

-- settings
CREATE INDEX idx_settings_key ON public.settings(key);

-- admin_roles
CREATE INDEX idx_admin_user ON public.admin_roles(user_id);
```

**Total Index Lines:** ~60 lines

---

## 🔐 SECTION 4: RLS POLICIES

```sql
-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Settings: Public can view popup settings
CREATE POLICY "Public view popup settings"
  ON public.settings FOR SELECT
  USING (key = 'popup' OR key = 'site_info');

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

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Events: Admin full access
CREATE POLICY "Admin full access to events"
  ON public.events FOR ALL
  USING (is_admin());

-- Posts: Admin full access
CREATE POLICY "Admin full access to posts"
  ON public.posts FOR ALL
  USING (is_admin());

-- Speakers: Admin full access
CREATE POLICY "Admin full access to speakers"
  ON public.speakers FOR ALL
  USING (is_admin());

-- Event Speakers: Admin full access
CREATE POLICY "Admin full access to event_speakers"
  ON public.event_speakers FOR ALL
  USING (is_admin());

-- Applications: Admin full access
CREATE POLICY "Admin full access to applications"
  ON public.applications FOR ALL
  USING (is_admin());

-- Subscribers: Admin full access
CREATE POLICY "Admin full access to subscribers"
  ON public.subscribers FOR ALL
  USING (is_admin());

-- Photos: Admin full access
CREATE POLICY "Admin full access to photos"
  ON public.photos FOR ALL
  USING (is_admin());

-- Sponsors: Admin full access
CREATE POLICY "Admin full access to sponsors"
  ON public.sponsors FOR ALL
  USING (is_admin());

-- Team: Admin full access
CREATE POLICY "Admin full access to team"
  ON public.team_members FOR ALL
  USING (is_admin());

-- Schedule: Admin full access
CREATE POLICY "Admin full access to schedule"
  ON public.schedule_items FOR ALL
  USING (is_admin());

-- FAQs: Admin full access
CREATE POLICY "Admin full access to FAQs"
  ON public.faqs FOR ALL
  USING (is_admin());

-- Contact: Admin full access
CREATE POLICY "Admin full access to contact"
  ON public.contact_submissions FOR ALL
  USING (is_admin());

-- Settings: Admin full access
CREATE POLICY "Admin full access to settings"
  ON public.settings FOR ALL
  USING (is_admin());

-- Static Content: Admin full access
CREATE POLICY "Admin full access to static_content"
  ON public.static_content FOR ALL
  USING (is_admin());

-- Admin Roles: Super admin only
CREATE POLICY "Super admin manage roles"
  ON public.admin_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
```

**Total RLS Lines:** ~200 lines

---

## 🌱 SECTION 5: SEED DATA

```sql
-- ============================================================================
-- SEED DATA
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

-- Sample Sponsor
INSERT INTO public.sponsors (name, tier, display_order, is_active) VALUES
('DeepLearning.AI', 'platinum', 1, true),
('Google Research', 'gold', 2, true);
```

**Total Seed Lines:** ~80 lines

---

## 📏 FINAL FILE STATS

| Section | Lines | Percentage |
|---------|-------|------------|
| Extensions | 10 | 1% |
| Tables | 400 | 33% |
| Indexes | 60 | 5% |
| RLS Policies | 200 | 17% |
| Seed Data | 80 | 7% |
| Comments & Spacing | 450 | 37% |
| **TOTAL** | **~1,200** | **100%** |

---

## ✅ EXECUTION CHECKLIST

### Before Running Migration:

- [ ] Supabase project exists
- [ ] Connected to correct project
- [ ] Backed up existing data (if any)
- [ ] SQL Editor open in Supabase Dashboard

### Running Migration:

- [ ] Copy entire migration file
- [ ] Paste into Supabase SQL Editor
- [ ] Review for any syntax errors
- [ ] Click "RUN" button
- [ ] Wait for completion (~30 seconds)
- [ ] Check for success message

### After Running Migration:

- [ ] Verify all 15 tables created
- [ ] Check table structure (columns, types)
- [ ] Verify indexes created
- [ ] Verify RLS enabled on all tables
- [ ] Test RLS policies (try public query)
- [ ] Check seed data inserted
- [ ] Query events table (should return 1 row)
- [ ] Query settings table (should return 2 rows)

---

## 🔄 ROLLBACK PLAN

If migration fails:

```sql
-- Drop all tables (cascade will remove dependencies)
DROP TABLE IF EXISTS public.admin_roles CASCADE;
DROP TABLE IF EXISTS public.static_content CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.contact_submissions CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.schedule_items CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.sponsors CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.event_speakers CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.speakers CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS is_admin();
```

Then fix errors and re-run migration.

---

## 🧪 VALIDATION QUERIES

After migration, run these queries to validate:

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Expected: 15

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All should show 't' (true)

-- Check indexes
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public';
-- Expected: ~45

-- Check seed data
SELECT COUNT(*) FROM public.events;
-- Expected: 1

SELECT COUNT(*) FROM public.speakers;
-- Expected: 2

SELECT COUNT(*) FROM public.posts;
-- Expected: 1

SELECT COUNT(*) FROM public.faqs;
-- Expected: 3

SELECT COUNT(*) FROM public.settings;
-- Expected: 2
```

---

## 📦 FILE LOCATION

```
indabax-kenya-website/
└── supabase/
    └── migrations/
        └── 20251020_initial_schema.sql (1,200 lines)
```

---

## ⏱️ ESTIMATED TIME

- Create migration file: 30 minutes
- Review & verify: 15 minutes
- Run migration: 1 minute
- Validate: 10 minutes
- **Total: ~1 hour**

---

## 🎯 SUCCESS CRITERIA

✅ **Migration Complete When:**

1. All 15 tables exist
2. All indexes created
3. RLS enabled on all tables
4. RLS policies working (test queries succeed)
5. Seed data present (1 event, 2 speakers, 1 post, 3 FAQs, 2 settings)
6. No errors in Supabase logs

---

**Status:** ✅ PLAN COMPLETE - Ready to create migration file
**Next:** Create actual SQL file
**Timeline:** Ready to execute in 1 hour
