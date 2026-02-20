-- ═══════════════════════════════════════════════════════════════════════
-- PERFORMANCE OPTIMIZATION: VIEWS AND INDEXES
-- ═══════════════════════════════════════════════════════════════════════
-- Adds database views for common queries and indexes for faster lookups
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 1: INDEXES FOR CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON public.events(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON public.events(status, start_date DESC);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status_published ON public.posts(status, published_at DESC);

-- Speakers table indexes
CREATE INDEX IF NOT EXISTS idx_speakers_is_featured ON public.speakers(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_speakers_display_order ON public.speakers(display_order);

-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_event_id ON public.applications(event_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status_created ON public.applications(status, created_at DESC);

-- Photos table indexes
CREATE INDEX IF NOT EXISTS idx_photos_year ON public.photos(year);
CREATE INDEX IF NOT EXISTS idx_photos_category ON public.photos(category);
CREATE INDEX IF NOT EXISTS idx_photos_is_featured ON public.photos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_photos_year_category ON public.photos(year, category);

-- Schedule items indexes
CREATE INDEX IF NOT EXISTS idx_schedule_items_event_id ON public.schedule_items(event_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_day ON public.schedule_items(day);
CREATE INDEX IF NOT EXISTS idx_schedule_items_start_time ON public.schedule_items(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_items_event_day ON public.schedule_items(event_id, day, start_time);

-- FAQs indexes
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON public.faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_published ON public.faqs(is_published) WHERE is_published = true;

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON public.team_members(display_order);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

-- Sponsors indexes
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON public.sponsors(tier);
CREATE INDEX IF NOT EXISTS idx_sponsors_display_order ON public.sponsors(display_order);
CREATE INDEX IF NOT EXISTS idx_sponsors_is_active ON public.sponsors(is_active) WHERE is_active = true;

-- Subscribers indexes
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers(created_at DESC);

-- Contact submissions indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Venues indexes
CREATE INDEX IF NOT EXISTS idx_venues_slug ON public.venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON public.venues(is_active) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 2: INDEXES FOR REGISTRATION SYSTEM TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON public.user_profiles(auth_id);

-- Registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_user_event ON public.registrations(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON public.registrations(event_id, status);

-- Form templates indexes
CREATE INDEX IF NOT EXISTS idx_form_templates_event_id ON public.form_templates(event_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_is_active ON public.form_templates(is_active) WHERE is_active = true;

-- Form questions indexes
CREATE INDEX IF NOT EXISTS idx_form_questions_template_id ON public.form_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_questions_order ON public.form_questions(question_order);

-- Form responses indexes
CREATE INDEX IF NOT EXISTS idx_form_responses_registration_id ON public.form_responses(registration_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_template_id ON public.form_responses(form_template_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_status ON public.form_responses(status);

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON public.tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON public.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON public.tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_check_in_status ON public.tickets(check_in_status);

-- Review locks indexes
CREATE INDEX IF NOT EXISTS idx_review_locks_registration_id ON public.review_locks(registration_id);
CREATE INDEX IF NOT EXISTS idx_review_locks_reviewer_id ON public.review_locks(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_locks_expires_at ON public.review_locks(expires_at);

-- Email logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON public.email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_registration_id ON public.activity_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 3: INDEXES FOR NOAI TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- NOAI participants indexes
CREATE INDEX IF NOT EXISTS idx_noai_participants_year ON public.noai_participants(year);
CREATE INDEX IF NOT EXISTS idx_noai_participants_role ON public.noai_participants(role);
CREATE INDEX IF NOT EXISTS idx_noai_participants_is_published ON public.noai_participants(is_published) WHERE is_published = true;

-- NOAI FAQs indexes
CREATE INDEX IF NOT EXISTS idx_noai_faqs_category ON public.noai_faqs(category);
CREATE INDEX IF NOT EXISTS idx_noai_faqs_display_order ON public.noai_faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_noai_faqs_is_published ON public.noai_faqs(is_published) WHERE is_published = true;

-- NOAI page sections indexes
CREATE INDEX IF NOT EXISTS idx_noai_page_sections_section_key ON public.noai_page_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_noai_page_sections_is_published ON public.noai_page_sections(is_published) WHERE is_published = true;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 4: DATABASE VIEWS FOR COMMON QUERIES
-- ═══════════════════════════════════════════════════════════════════════

-- View: Upcoming events (published, future start date)
CREATE OR REPLACE VIEW public.v_upcoming_events AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.description,
  e.short_description,
  e.start_date,
  e.end_date,
  e.location,
  e.venue_id,
  e.image_url,
  e.is_featured,
  e.registration_open,
  e.created_at
FROM public.events e
WHERE e.status = 'published'
  AND e.start_date >= CURRENT_DATE
ORDER BY e.start_date ASC;

-- View: Past events (published, past end date)
CREATE OR REPLACE VIEW public.v_past_events AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.description,
  e.short_description,
  e.start_date,
  e.end_date,
  e.location,
  e.venue_id,
  e.image_url,
  e.is_featured,
  e.created_at
FROM public.events e
WHERE e.status = 'published'
  AND e.end_date < CURRENT_DATE
ORDER BY e.start_date DESC;

-- View: Published news/posts
CREATE OR REPLACE VIEW public.v_published_posts AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.excerpt,
  p.content,
  p.category,
  p.featured_image,
  p.author,
  p.published_at,
  p.is_featured,
  p.external_url,
  p.is_external
FROM public.posts p
WHERE p.status = 'published'
  AND p.published_at <= NOW()
ORDER BY p.published_at DESC;

-- View: Featured speakers
CREATE OR REPLACE VIEW public.v_featured_speakers AS
SELECT
  s.id,
  s.name,
  s.title,
  s.company,
  s.bio,
  s.image_url,
  s.linkedin_url,
  s.twitter_url,
  s.website_url,
  s.display_order,
  s.year
FROM public.speakers s
WHERE s.is_featured = true
ORDER BY s.display_order ASC;

-- View: Public gallery photos
CREATE OR REPLACE VIEW public.v_public_gallery AS
SELECT
  p.id,
  p.image_url,
  p.thumbnail_url,
  p.caption,
  p.year,
  p.category,
  p.event_id,
  p.is_featured,
  p.display_order,
  p.media_type
FROM public.photos p
WHERE COALESCE(p.is_published, true) = true
ORDER BY p.year DESC, p.display_order ASC;

-- View: Published FAQs
CREATE OR REPLACE VIEW public.v_published_faqs AS
SELECT
  f.id,
  f.question,
  f.answer,
  f.category,
  f.display_order
FROM public.faqs f
WHERE f.is_published = true
ORDER BY f.category, f.display_order ASC;

-- View: Active team members
CREATE OR REPLACE VIEW public.v_team_members AS
SELECT
  t.id,
  t.name,
  t.role,
  t.title,
  t.bio,
  t.image_url,
  t.linkedin_url,
  t.twitter_url,
  t.display_order
FROM public.team_members t
WHERE COALESCE(t.is_active, true) = true
ORDER BY t.display_order ASC;

-- View: Active sponsors by tier
CREATE OR REPLACE VIEW public.v_active_sponsors AS
SELECT
  s.id,
  s.name,
  s.logo_url,
  s.website_url,
  s.tier,
  s.description,
  s.display_order
FROM public.sponsors s
WHERE s.is_active = true
ORDER BY
  CASE s.tier
    WHEN 'platinum' THEN 1
    WHEN 'gold' THEN 2
    WHEN 'silver' THEN 3
    WHEN 'bronze' THEN 4
    ELSE 5
  END,
  s.display_order ASC;

-- View: Event schedule with speakers
CREATE OR REPLACE VIEW public.v_event_schedule AS
SELECT
  si.id,
  si.event_id,
  si.day,
  si.day_name,
  si.schedule_date,
  si.start_time,
  si.end_time,
  si.title,
  si.description,
  si.location,
  si.session_type,
  si.is_break,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', s.id,
      'name', s.name,
      'title', s.title,
      'company', s.company,
      'image_url', s.image_url
    ))
    FROM public.schedule_speakers ss
    JOIN public.speakers s ON s.id = ss.speaker_id
    WHERE ss.schedule_item_id = si.id),
    '[]'::json
  ) as speakers
FROM public.schedule_items si
ORDER BY si.event_id, si.day, si.start_time;

-- View: Registration summary by event
CREATE OR REPLACE VIEW public.v_registration_summary AS
SELECT
  e.id as event_id,
  e.title as event_title,
  e.start_date,
  COUNT(r.id) as total_registrations,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) as rejected_count,
  COUNT(CASE WHEN r.status = 'waitlisted' THEN 1 END) as waitlisted_count,
  COUNT(DISTINCT t.id) as tickets_issued,
  COUNT(CASE WHEN t.check_in_status = 'checked_in' THEN 1 END) as checked_in_count
FROM public.events e
LEFT JOIN public.registrations r ON r.event_id = e.id
LEFT JOIN public.tickets t ON t.registration_id = r.id
GROUP BY e.id, e.title, e.start_date
ORDER BY e.start_date DESC;

-- View: Application statistics by event
CREATE OR REPLACE VIEW public.v_application_stats AS
SELECT
  e.id as event_id,
  e.title as event_title,
  COUNT(a.id) as total_applications,
  COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN a.status = 'under_review' THEN 1 END) as under_review,
  COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted,
  COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted,
  COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected,
  MIN(a.created_at) as first_application,
  MAX(a.created_at) as last_application
FROM public.events e
LEFT JOIN public.applications a ON a.event_id = e.id
GROUP BY e.id, e.title
ORDER BY e.id DESC;

-- View: NOAI participants by year
CREATE OR REPLACE VIEW public.v_noai_participants AS
SELECT
  p.id,
  p.name,
  p.role,
  p.bio,
  p.image_url,
  p.year,
  p.achievements,
  p.social_links,
  p.display_order
FROM public.noai_participants p
WHERE p.is_published = true
ORDER BY p.year DESC, p.display_order ASC;

-- View: Published NOAI FAQs
CREATE OR REPLACE VIEW public.v_noai_faqs AS
SELECT
  f.id,
  f.question,
  f.answer,
  f.category,
  f.display_order
FROM public.noai_faqs f
WHERE f.is_published = true
ORDER BY f.category, f.display_order ASC;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 5: GRANT ACCESS TO VIEWS
-- ═══════════════════════════════════════════════════════════════════════

-- Grant read access to anon and authenticated roles
GRANT SELECT ON public.v_upcoming_events TO anon, authenticated;
GRANT SELECT ON public.v_past_events TO anon, authenticated;
GRANT SELECT ON public.v_published_posts TO anon, authenticated;
GRANT SELECT ON public.v_featured_speakers TO anon, authenticated;
GRANT SELECT ON public.v_public_gallery TO anon, authenticated;
GRANT SELECT ON public.v_published_faqs TO anon, authenticated;
GRANT SELECT ON public.v_team_members TO anon, authenticated;
GRANT SELECT ON public.v_active_sponsors TO anon, authenticated;
GRANT SELECT ON public.v_event_schedule TO anon, authenticated;
GRANT SELECT ON public.v_noai_participants TO anon, authenticated;
GRANT SELECT ON public.v_noai_faqs TO anon, authenticated;

-- Admin-only views (registration/application stats)
GRANT SELECT ON public.v_registration_summary TO authenticated;
GRANT SELECT ON public.v_application_stats TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 6: ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ═══════════════════════════════════════════════════════════════════════

ANALYZE public.events;
ANALYZE public.posts;
ANALYZE public.speakers;
ANALYZE public.applications;
ANALYZE public.photos;
ANALYZE public.schedule_items;
ANALYZE public.faqs;
ANALYZE public.team_members;
ANALYZE public.sponsors;
ANALYZE public.subscribers;
ANALYZE public.contact_submissions;
