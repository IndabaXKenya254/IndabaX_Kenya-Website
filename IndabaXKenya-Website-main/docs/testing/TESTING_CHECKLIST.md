# Testing & Validation Checklist
## Phase 2 Backend - Complete Testing Strategy

**Purpose:** Systematic validation of all backend functionality

**Approach:** Manual testing with documented test cases

**Decision Reference:** CRITICAL_DECISIONS.md → Testing Strategy: Manual + Checklist

**Date:** October 20, 2025

---

## 📋 TESTING OVERVIEW

| Category | Test Cases | Status |
|----------|------------|--------|
| **Database** | 12 | ⏳ Pending |
| **Public APIs** | 18 | ⏳ Pending |
| **Form APIs** | 15 | ⏳ Pending |
| **Email System** | 9 | ⏳ Pending |
| **Authentication** | 12 | ⏳ Pending |
| **Admin APIs** | 30 | ⏳ Pending |
| **File Uploads** | 8 | ⏳ Pending |
| **Security (RLS)** | 15 | ⏳ Pending |
| **Frontend Integration** | 20 | ⏳ Pending |
| **Performance** | 8 | ⏳ Pending |
| **TOTAL** | **147** | **0%** |

---

## 🗄️ DATABASE TESTS

### Test 1.1: Schema Validation
**When:** After Day 1 - Database setup

- [ ] All 15 tables exist
  ```sql
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
  -- Expected: 15
  ```

- [ ] Table: events
  ```sql
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'events';
  -- Expected columns: id, slug, title, description, start_date, end_date, location, venue, featured_image, status, event_type, is_featured, venue_details, created_at, updated_at
  ```

- [ ] Table: posts
- [ ] Table: speakers
- [ ] Table: event_speakers
- [ ] Table: applications
- [ ] Table: subscribers
- [ ] Table: photos
- [ ] Table: sponsors
- [ ] Table: team_members
- [ ] Table: schedule_items
- [ ] Table: faqs
- [ ] Table: contact_submissions
- [ ] Table: settings
- [ ] Table: static_content
- [ ] Table: admin_roles

---

### Test 1.2: Indexes Validation

- [ ] Events indexes created
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'events';
  -- Expected: idx_events_status, idx_events_start_date, idx_events_slug, idx_events_featured
  ```

- [ ] Posts indexes created
- [ ] All 45+ indexes created

---

### Test 1.3: RLS Enabled

- [ ] RLS enabled on all tables
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  -- All should show 't' (true)
  ```

---

### Test 1.4: Seed Data

- [ ] Events seed data
  ```sql
  SELECT * FROM events WHERE slug = 'indabax-kenya-2026';
  -- Expected: 1 row
  ```

- [ ] Speakers seed data
  ```sql
  SELECT COUNT(*) FROM speakers;
  -- Expected: 2
  ```

- [ ] Posts seed data
  ```sql
  SELECT COUNT(*) FROM posts WHERE status = 'published';
  -- Expected: 1
  ```

- [ ] FAQs seed data
  ```sql
  SELECT COUNT(*) FROM faqs WHERE is_active = true;
  -- Expected: 3
  ```

- [ ] Settings seed data
  ```sql
  SELECT key FROM settings;
  -- Expected: popup, site_info
  ```

---

### Test 1.5: Storage Buckets

- [ ] Bucket: event-images (public)
  - Visit: https://pqndsvfoobctutaeyleq.supabase.co/storage/v1/object/public/event-images/
  - Should be accessible without auth

- [ ] Bucket: speaker-photos (public)
- [ ] Bucket: gallery-photos (public)
- [ ] Bucket: sponsor-logos (public)
- [ ] Bucket: team-photos (public)
- [ ] Bucket: post-images (public)
- [ ] Bucket: uploads (private)
  - Should return 403 without auth

---

### Test 1.6: Admin User

- [ ] Admin user exists
  ```sql
  SELECT email FROM auth.users WHERE email = 'admin@indabaxkenya.org';
  -- Expected: 1 row
  ```

- [ ] Admin role assigned
  ```sql
  SELECT role FROM admin_roles
  JOIN auth.users ON admin_roles.user_id = auth.users.id
  WHERE auth.users.email = 'admin@indabaxkenya.org';
  -- Expected: super_admin
  ```

---

### Test 1.7: Functions

- [ ] is_admin() function exists
  ```sql
  SELECT is_admin();
  -- Expected: false (when not logged in)
  ```

- [ ] update_updated_at_column() function exists

---

## 🌐 PUBLIC API TESTS

### Test 2.1: Events API

#### GET /api/events
- [ ] Returns all published events
  ```bash
  curl http://localhost:3000/api/events
  ```
  Expected:
  ```json
  {
    "success": true,
    "data": [...],
    "count": 1
  }
  ```

- [ ] Filter by type: upcoming
  ```bash
  curl "http://localhost:3000/api/events?type=upcoming"
  ```

- [ ] Filter by type: past
  ```bash
  curl "http://localhost:3000/api/events?type=past"
  ```

- [ ] Limit parameter works
  ```bash
  curl "http://localhost:3000/api/events?limit=5"
  ```

- [ ] Draft events not returned
  ```sql
  -- First create draft event
  INSERT INTO events (slug, title, description, start_date, status)
  VALUES ('draft-event', 'Draft Event', 'Test', '2026-01-01', 'draft');
  ```
  ```bash
  curl http://localhost:3000/api/events
  -- Should NOT include draft-event
  ```

#### GET /api/events/[slug]
- [ ] Returns single published event
  ```bash
  curl http://localhost:3000/api/events/indabax-kenya-2026
  ```
  Expected:
  ```json
  {
    "success": true,
    "data": {
      "id": "...",
      "slug": "indabax-kenya-2026",
      "title": "IndabaX Kenya 2026",
      "event_speakers": [...],
      "schedule_items": [...]
    }
  }
  ```

- [ ] Returns 404 for non-existent event
  ```bash
  curl http://localhost:3000/api/events/non-existent
  # Expected: 404 with error code NOT_FOUND
  ```

- [ ] Returns 404 for draft event
  ```bash
  curl http://localhost:3000/api/events/draft-event
  # Expected: 404
  ```

---

### Test 2.2: Posts API

#### GET /api/posts
- [ ] Returns published posts
  ```bash
  curl http://localhost:3000/api/posts
  ```

- [ ] Pagination works
  ```bash
  curl "http://localhost:3000/api/posts?limit=5&offset=0"
  ```

- [ ] Category filter works
  ```bash
  curl "http://localhost:3000/api/posts?category=announcement"
  ```

- [ ] Posts ordered by published_at descending

- [ ] Draft posts not returned

- [ ] Returns count and pagination info

#### GET /api/posts/[slug]
- [ ] Returns single published post
  ```bash
  curl http://localhost:3000/api/posts/welcome-indabax-2026
  ```

- [ ] Returns 404 for non-existent post

---

### Test 2.3: Speakers API

#### GET /api/speakers
- [ ] Returns all speakers
  ```bash
  curl http://localhost:3000/api/speakers
  # Expected: 2 speakers from seed data
  ```

- [ ] Featured filter works
  ```bash
  curl "http://localhost:3000/api/speakers?featured=true"
  ```

- [ ] Speakers ordered by display_order

---

### Test 2.4: Gallery API

#### GET /api/gallery
- [ ] Returns photos grouped by year
  ```bash
  curl http://localhost:3000/api/gallery
  ```
  Expected:
  ```json
  {
    "success": true,
    "data": {
      "2024": [...],
      "2023": [...]
    }
  }
  ```

- [ ] Year filter works
  ```bash
  curl "http://localhost:3000/api/gallery?year=2024"
  ```

---

### Test 2.5: FAQs API

#### GET /api/faqs
- [ ] Returns active FAQs
  ```bash
  curl http://localhost:3000/api/faqs
  # Expected: 3 FAQs from seed data
  ```

- [ ] Category filter works
  ```bash
  curl "http://localhost:3000/api/faqs?category=registration"
  ```

- [ ] Inactive FAQs not returned

- [ ] Ordered by category and display_order

---

### Test 2.6: Schedule API

#### GET /api/schedule
- [ ] Returns schedule items
  ```bash
  curl http://localhost:3000/api/schedule
  ```

- [ ] Event filter works
  ```bash
  curl "http://localhost:3000/api/schedule?event_id=EVENT_UUID"
  ```

- [ ] Grouped by day_number

---

### Test 2.7: Sponsors API

#### GET /api/sponsors
- [ ] Returns active sponsors
  ```bash
  curl http://localhost:3000/api/sponsors
  ```

- [ ] Grouped by tier (platinum, gold, silver, bronze)

- [ ] Inactive sponsors not returned

---

### Test 2.8: Settings API

#### GET /api/settings/popup
- [ ] Returns popup settings
  ```bash
  curl http://localhost:3000/api/settings/popup
  ```
  Expected:
  ```json
  {
    "success": true,
    "data": {
      "enabled": true,
      "title": "Register for IndabaX Kenya 2026",
      "content": "...",
      "buttonText": "Register Now",
      "buttonLink": "/register",
      "delay": 3
    }
  }
  ```

---

## 📝 FORM API TESTS

### Test 3.1: Application Submission

#### POST /api/applications - Valid Registration
- [ ] Registration submission successful
  ```bash
  curl -X POST http://localhost:3000/api/applications \
    -H "Content-Type: application/json" \
    -d '{
      "application_type": "registration",
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+254700000000",
      "organization": "Test Org",
      "country": "Kenya",
      "ticket_type": "general"
    }'
  ```
  Expected:
  ```json
  {
    "success": true,
    "data": {...},
    "message": "Application submitted successfully"
  }
  ```

- [ ] Data saved to database
  ```sql
  SELECT * FROM applications WHERE email = 'test@example.com';
  ```

- [ ] Status defaults to 'pending'

#### POST /api/applications - Valid Call for Papers
- [ ] CfP submission successful
  ```bash
  curl -X POST http://localhost:3000/api/applications \
    -H "Content-Type: application/json" \
    -d '{
      "application_type": "call_for_papers",
      "name": "Test Speaker",
      "email": "speaker@example.com",
      "presentation_type": "talk",
      "presentation_title": "AI in Agriculture",
      "abstract": "This talk explores...",
      "bio": "Speaker bio..."
    }'
  ```

#### Validation Tests
- [ ] Missing name returns error
  ```bash
  curl -X POST http://localhost:3000/api/applications \
    -H "Content-Type: application/json" \
    -d '{"application_type": "registration", "email": "test@example.com"}'
  ```
  Expected: 400 with field error

- [ ] Missing email returns error

- [ ] Invalid email format returns error
  ```bash
  curl -X POST http://localhost:3000/api/applications \
    -H "Content-Type: application/json" \
    -d '{
      "application_type": "registration",
      "name": "Test",
      "email": "invalid-email"
    }'
  ```

- [ ] Missing application_type returns error

---

### Test 3.2: Newsletter Subscription

#### POST /api/subscribe - Valid Subscription
- [ ] New subscription successful
  ```bash
  curl -X POST http://localhost:3000/api/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email": "subscriber@example.com"}'
  ```
  Expected: 201 with success message

- [ ] Data saved to database
  ```sql
  SELECT * FROM subscribers WHERE email = 'subscriber@example.com';
  ```

- [ ] Status defaults to 'active'

#### Duplicate Email Tests
- [ ] Duplicate active subscription returns error
  ```bash
  # Submit same email twice
  curl -X POST http://localhost:3000/api/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email": "subscriber@example.com"}'
  ```
  Expected: 409 with ALREADY_SUBSCRIBED error

- [ ] Reactivating unsubscribed email works
  ```sql
  -- First unsubscribe
  UPDATE subscribers SET status = 'unsubscribed' WHERE email = 'subscriber@example.com';
  ```
  ```bash
  # Then resubscribe
  curl -X POST http://localhost:3000/api/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email": "subscriber@example.com"}'
  ```
  Expected: Success with reactivation message

#### Validation Tests
- [ ] Missing email returns error

- [ ] Invalid email format returns error
  ```bash
  curl -X POST http://localhost:3000/api/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email": "not-an-email"}'
  ```

---

### Test 3.3: Contact Form

#### POST /api/contact - Valid Submission
- [ ] Contact submission successful
  ```bash
  curl -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Jane Doe",
      "email": "jane@example.com",
      "subject": "Question about event",
      "message": "When does registration open?"
    }'
  ```
  Expected: 201 with success message

- [ ] Data saved to database
  ```sql
  SELECT * FROM contact_submissions WHERE email = 'jane@example.com';
  ```

- [ ] Status defaults to 'new'

#### Validation Tests
- [ ] Missing name returns error
- [ ] Missing email returns error
- [ ] Missing message returns error
- [ ] Invalid email format returns error

---

## 📧 EMAIL TESTS

### Test 4.1: Email Configuration
- [ ] Resend API key configured in .env.local
- [ ] ADMIN_EMAIL configured
- [ ] Resend package installed

---

### Test 4.2: Application Confirmation Emails

#### Registration Confirmation
- [ ] Email sent after registration
  - Submit registration via POST /api/applications
  - Check email inbox for confirmation
  - Verify email contains:
    - [ ] Applicant name
    - [ ] Application type
    - [ ] Submission timestamp
    - [ ] Next steps information

#### Call for Papers Confirmation
- [ ] Email sent after CfP submission
  - Submit CfP via POST /api/applications
  - Check email inbox
  - Verify email contains review timeline

---

### Test 4.3: Subscription Welcome Email
- [ ] Email sent after subscription
  - Submit email via POST /api/subscribe
  - Check inbox for welcome email
  - Verify email contains:
    - [ ] Welcome message
    - [ ] What to expect
    - [ ] Unsubscribe link

---

### Test 4.4: Contact Form Notification
- [ ] Admin notification sent
  - Submit contact form via POST /api/contact
  - Check admin email inbox
  - Verify email contains:
    - [ ] Sender name and email
    - [ ] Subject
    - [ ] Message content
    - [ ] Submission timestamp
    - [ ] Link to admin panel

---

### Test 4.5: Email Deliverability
- [ ] Emails not in spam folder
- [ ] Resend dashboard shows successful delivery
- [ ] Email templates render correctly (HTML)
- [ ] Links in emails are clickable
- [ ] Images in emails load (if any)

---

### Test 4.6: Email Error Handling
- [ ] Invalid email address handled gracefully
  ```bash
  # Submit with invalid email
  curl -X POST http://localhost:3000/api/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email": "invalid@@example.com"}'
  ```
  - Should return validation error before sending

- [ ] Email send failure doesn't break API
  - Temporarily break Resend API key
  - Submit form
  - Should still save to database
  - Should log error

---

## 🔒 AUTHENTICATION TESTS

### Test 5.1: Login Page
- [ ] Login page accessible at /admin/login
- [ ] Login form renders correctly
- [ ] Email field present
- [ ] Password field present
- [ ] Submit button present

---

### Test 5.2: Login Functionality

#### Valid Admin Login
- [ ] Login with valid admin credentials
  - Email: admin@indabaxkenya.org
  - Password: [admin password]
  - Expected: Redirect to /admin/dashboard

- [ ] Session created
  - Check browser cookies for supabase auth token

#### Invalid Credentials
- [ ] Login with wrong password
  - Expected: Error message displayed

- [ ] Login with non-existent email
  - Expected: Error message displayed

#### Non-Admin User
- [ ] Create regular user (not admin)
  ```sql
  -- Create user via Supabase Auth UI
  -- Do NOT add to admin_roles table
  ```

- [ ] Login with regular user credentials
  - Expected: Error "Access denied. You do not have admin privileges."

- [ ] User logged out automatically

---

### Test 5.3: Protected Routes

#### Unauthenticated Access
- [ ] Visit /admin/dashboard without login
  - Expected: Redirect to /admin/login

- [ ] Visit /admin/events without login
  - Expected: Redirect to /admin/login

#### Authenticated Access
- [ ] Login as admin
- [ ] Visit /admin/dashboard
  - Expected: Dashboard loads

- [ ] Visit /admin/events
  - Expected: Events page loads

---

### Test 5.4: Logout Functionality
- [ ] Logout button present in admin panel
- [ ] Click logout
  - Expected: Redirect to /admin/login
  - Session cleared
  - Cookies removed

- [ ] After logout, cannot access /admin/dashboard
  - Expected: Redirect to /admin/login

---

### Test 5.5: Auth Helper Functions

#### getCurrentUser()
- [ ] Returns user when logged in
  ```typescript
  const user = await getCurrentUser()
  // Should return user object
  ```

- [ ] Returns null when not logged in

#### getAdminRole()
- [ ] Returns role for admin user
  ```typescript
  const role = await getAdminRole(userId)
  // Should return {role: 'super_admin', permissions: {}}
  ```

- [ ] Returns null for regular user

#### requireAdmin()
- [ ] Returns user and role when admin
- [ ] Throws error when not logged in
- [ ] Throws error when not admin

---

## 🛠️ ADMIN API TESTS

### Test 6.1: Events Management

#### GET /api/admin/events
- [ ] Returns all events (including drafts)
  ```bash
  curl http://localhost:3000/api/admin/events \
    -H "Authorization: Bearer [admin-token]"
  ```

#### POST /api/admin/events
- [ ] Create new event
  ```bash
  curl -X POST http://localhost:3000/api/admin/events \
    -H "Authorization: Bearer [admin-token]" \
    -H "Content-Type: application/json" \
    -d '{
      "slug": "test-event",
      "title": "Test Event",
      "description": "Test",
      "start_date": "2026-06-01",
      "status": "draft"
    }'
  ```

- [ ] Validation: Missing required fields returns error
- [ ] Validation: Duplicate slug returns error

#### PUT /api/admin/events/[id]
- [ ] Update existing event
- [ ] Returns 404 for non-existent event

#### DELETE /api/admin/events/[id]
- [ ] Delete event
- [ ] Event removed from database
- [ ] Related records handled (cascade or prevent)

---

### Test 6.2: Posts Management
Similar tests as events for:
- [ ] GET /api/admin/posts
- [ ] POST /api/admin/posts
- [ ] PUT /api/admin/posts/[id]
- [ ] DELETE /api/admin/posts/[id]

---

### Test 6.3: Speakers Management
- [ ] GET /api/admin/speakers
- [ ] POST /api/admin/speakers
- [ ] PUT /api/admin/speakers/[id]
- [ ] DELETE /api/admin/speakers/[id]

---

### Test 6.4: Applications Review

#### GET /api/admin/applications
- [ ] Returns all applications
- [ ] Filter by status (pending/accepted/rejected)
- [ ] Filter by type (registration/call_for_papers)
- [ ] Pagination works

#### PUT /api/admin/applications/[id]
- [ ] Update application status
  ```bash
  curl -X PUT http://localhost:3000/api/admin/applications/[id] \
    -H "Authorization: Bearer [admin-token]" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "accepted",
      "admin_notes": "Great application!"
    }'
  ```

- [ ] reviewed_at timestamp set
- [ ] reviewed_by set to current admin user

---

### Test 6.5: File Upload

#### POST /api/admin/upload
- [ ] Upload valid image (JPG)
  ```bash
  curl -X POST http://localhost:3000/api/admin/upload \
    -H "Authorization: Bearer [admin-token]" \
    -F "file=@test-image.jpg" \
    -F "bucket=event-images"
  ```
  Expected:
  ```json
  {
    "success": true,
    "url": "https://pqndsvfoobctutaeyleq.supabase.co/storage/v1/object/public/event-images/..."
  }
  ```

- [ ] Upload valid image (PNG)
- [ ] Upload valid PDF
- [ ] Upload to different buckets

#### Validation
- [ ] File too large returns error (>5MB for images)
- [ ] Invalid file type returns error
- [ ] Missing file returns error
- [ ] Unauthenticated request returns 401

---

## 🔐 SECURITY (RLS) TESTS

### Test 7.1: Public Read Access

#### As Unauthenticated User
- [ ] Can read published events
  ```sql
  -- Execute as anonymous user (no auth.uid())
  SELECT * FROM events WHERE status = 'published';
  -- Should work
  ```

- [ ] Cannot read draft events
  ```sql
  SELECT * FROM events WHERE status = 'draft';
  -- Should return empty (RLS blocks)
  ```

- [ ] Can read published posts
- [ ] Can read all speakers
- [ ] Can read active FAQs
- [ ] Can read active sponsors

---

### Test 7.2: Public Insert Access

#### As Unauthenticated User
- [ ] Can insert into applications
  ```sql
  INSERT INTO applications (application_type, name, email)
  VALUES ('registration', 'Test', 'test@example.com');
  -- Should work
  ```

- [ ] Can insert into subscribers
- [ ] Can insert into contact_submissions

- [ ] Cannot insert into events
  ```sql
  INSERT INTO events (slug, title, start_date)
  VALUES ('hack-attempt', 'Hacked', '2026-01-01');
  -- Should fail (RLS blocks)
  ```

- [ ] Cannot insert into posts
- [ ] Cannot insert into speakers

---

### Test 7.3: Admin Full Access

#### As Authenticated Admin User
- [ ] Can read all events (including drafts)
  ```sql
  -- Execute as admin user
  SELECT * FROM events;
  -- Should return all events
  ```

- [ ] Can insert events
- [ ] Can update events
- [ ] Can delete events
- [ ] Can read all applications
- [ ] Can update application status
- [ ] Full CRUD access to all tables

---

### Test 7.4: Admin Role Protection

#### As Regular Authenticated User (Non-Admin)
- [ ] Cannot read admin data
  ```sql
  -- Execute as non-admin authenticated user
  SELECT * FROM events WHERE status = 'draft';
  -- Should return empty (RLS blocks)
  ```

- [ ] Cannot insert events
- [ ] Cannot update events
- [ ] Cannot delete events

---

### Test 7.5: Storage Bucket Policies

#### Public Buckets
- [ ] Unauthenticated can read
  ```bash
  curl https://pqndsvfoobctutaeyleq.supabase.co/storage/v1/object/public/event-images/test.jpg
  # Should return image
  ```

- [ ] Unauthenticated cannot upload
  ```bash
  curl -X POST https://pqndsvfoobctutaeyleq.supabase.co/storage/v1/object/event-images/hack.jpg \
    -F "file=@test.jpg"
  # Should return 401
  ```

#### Private Buckets
- [ ] Unauthenticated cannot read
  ```bash
  curl https://pqndsvfoobctutaeyleq.supabase.co/storage/v1/object/uploads/private.pdf
  # Should return 403
  ```

- [ ] Admin can upload
- [ ] Admin can read

---

## 🎨 FRONTEND INTEGRATION TESTS

### Test 8.1: Home Page
- [ ] Visit http://localhost:3000
- [ ] Featured event loads from API
- [ ] Speakers section loads from API
- [ ] Newsletter subscription works
- [ ] Registration popup appears (if enabled in settings)
- [ ] No console errors
- [ ] Page loads within 2 seconds

---

### Test 8.2: Events Page
- [ ] Visit /events
- [ ] Upcoming events displayed
- [ ] Past events displayed
- [ ] Events sorted by date
- [ ] Click event → Redirects to event detail page
- [ ] Event detail page loads with:
  - [ ] Event information
  - [ ] Speakers list
  - [ ] Schedule (if available)
  - [ ] Registration button

---

### Test 8.3: News Page
- [ ] Visit /news
- [ ] Published posts displayed
- [ ] Posts sorted by published_at descending
- [ ] Pagination works
- [ ] Category filter works
- [ ] Click post → Redirects to post detail page
- [ ] Post detail renders HTML content correctly

---

### Test 8.4: Speakers Page
- [ ] Visit /speakers
- [ ] All speakers displayed
- [ ] Flip card animation works
- [ ] LinkedIn links work
- [ ] Photos load correctly

---

### Test 8.5: Gallery Page
- [ ] Visit /gallery
- [ ] Photos displayed grouped by year
- [ ] Year filter works
- [ ] Image lightbox works
- [ ] Download button works
- [ ] Images lazy load

---

### Test 8.6: Registration Form
- [ ] Visit /register
- [ ] Form renders correctly
- [ ] All fields present
- [ ] Submit valid data → Success message
- [ ] Submit invalid data → Error messages displayed
- [ ] Form resets after success
- [ ] Confirmation email received

---

### Test 8.7: Call for Papers Form
- [ ] Visit /submit
- [ ] Form renders correctly
- [ ] File upload works
- [ ] Submit valid data → Success message
- [ ] Confirmation email received

---

### Test 8.8: Contact Page
- [ ] Visit /contact
- [ ] Contact form works
- [ ] Contact information displayed correctly
- [ ] Map embedded (if applicable)
- [ ] Social links work

---

### Test 8.9: Admin Panel UI

#### Dashboard
- [ ] Visit /admin/dashboard (logged in)
- [ ] Stats cards display correct counts
- [ ] Recent activity shown
- [ ] Navigation sidebar works

#### Events Management
- [ ] List view shows all events
- [ ] Create event form works
- [ ] Edit event form works
- [ ] Delete confirmation modal works
- [ ] Rich text editor works for description
- [ ] Image upload works

#### Applications Review
- [ ] List view shows all applications
- [ ] Filter by status works
- [ ] Filter by type works
- [ ] Pagination works
- [ ] View application details
- [ ] Update status works
- [ ] Add admin notes works

---

## ⚡ PERFORMANCE TESTS

### Test 9.1: API Response Times
- [ ] GET /api/events responds in <500ms
- [ ] GET /api/posts responds in <500ms
- [ ] GET /api/speakers responds in <500ms
- [ ] POST /api/applications responds in <1000ms
- [ ] GET /api/gallery responds in <1000ms (may have many images)

---

### Test 9.2: Database Query Performance
- [ ] Events query with 100 events <200ms
- [ ] Posts query with pagination <200ms
- [ ] Gallery grouped by year <300ms

---

### Test 9.3: Page Load Times
- [ ] Home page loads in <2s (Lighthouse Performance >80)
- [ ] Events page loads in <2s
- [ ] Gallery page loads in <3s (image-heavy)

---

### Test 9.4: File Upload Performance
- [ ] 1MB image uploads in <3s
- [ ] 5MB image uploads in <10s

---

### Test 9.5: Concurrent Requests
- [ ] 10 simultaneous API requests handled correctly
- [ ] No 429 rate limit errors (yet - no rate limiting implemented)

---

### Test 9.6: Bundle Size
- [ ] Build output shows bundle sizes
  ```bash
  npm run build
  ```
- [ ] Main bundle <500KB
- [ ] No duplicate dependencies

---

## 🔍 EDGE CASES & ERROR SCENARIOS

### Test 10.1: Network Errors
- [ ] API returns error when database is down
- [ ] Frontend shows user-friendly error message
- [ ] Forms show error when submission fails

---

### Test 10.2: Invalid Data
- [ ] SQL injection attempts blocked
  ```bash
  curl -X POST http://localhost:3000/api/applications \
    -H "Content-Type: application/json" \
    -d '{"name": "Test", "email": "test@example.com'; DROP TABLE applications;--"}'
  # Should not drop table
  ```

- [ ] XSS attempts sanitized
  ```bash
  curl -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name": "<script>alert(1)</script>", "email": "test@example.com", "message": "test"}'
  # Script tags should be escaped in database
  ```

---

### Test 10.3: Race Conditions
- [ ] Duplicate slug detection works under concurrent inserts
- [ ] Duplicate email subscription handled correctly

---

## 📊 FINAL ACCEPTANCE TEST

Run this complete end-to-end test before deployment:

### End-to-End User Journey

1. **Public User**
   - [ ] Visit homepage
   - [ ] View upcoming events
   - [ ] Read news post
   - [ ] View speakers
   - [ ] Browse gallery
   - [ ] Register for event
   - [ ] Receive confirmation email
   - [ ] Subscribe to newsletter
   - [ ] Receive welcome email
   - [ ] Submit contact form

2. **Admin User**
   - [ ] Login to admin panel
   - [ ] View dashboard stats
   - [ ] Create new event
   - [ ] Upload event image
   - [ ] Create new post
   - [ ] Add speaker
   - [ ] Upload speaker photo
   - [ ] Review application
   - [ ] Accept application
   - [ ] View contact submissions
   - [ ] Update popup settings
   - [ ] Logout

3. **Verification**
   - [ ] All data persisted correctly
   - [ ] All emails sent
   - [ ] No console errors
   - [ ] No network errors
   - [ ] No broken links
   - [ ] Mobile responsive
   - [ ] Cross-browser compatible (Chrome, Firefox, Safari)

---

## 🎯 TESTING SUMMARY

**Total Test Cases:** 147

**Categories:**
- Database: 12 tests
- Public APIs: 18 tests
- Form APIs: 15 tests
- Email: 9 tests
- Authentication: 12 tests
- Admin APIs: 30 tests
- File Uploads: 8 tests
- Security (RLS): 15 tests
- Frontend Integration: 20 tests
- Performance: 8 tests

**Status Tracking:**

Update after each testing session:

- [ ] Day 1: Database tests (0/12)
- [ ] Day 2: Public API tests (0/18)
- [ ] Day 3: Form API tests (0/15)
- [ ] Day 4: Email tests (0/9)
- [ ] Days 5-7: Auth tests (0/12)
- [ ] Days 8-14: Admin API tests (0/30)
- [ ] Day 10: File upload tests (0/8)
- [ ] Week 2: RLS tests (0/15)
- [ ] Week 3: Frontend tests (0/20)
- [ ] Week 4: Performance tests (0/8)

**Overall:** 0/147 (0%)

---

## 📝 BUG TRACKING

When bugs are found during testing, document here:

### Bug Template
```
**Bug #:** [Number]
**Found:** [Date]
**Category:** [Database/API/Frontend/etc]
**Severity:** [Critical/High/Medium/Low]
**Description:** [What's wrong]
**Steps to Reproduce:**
1.
2.
3.
**Expected:** [What should happen]
**Actual:** [What actually happens]
**Status:** [Open/In Progress/Fixed]
**Fixed:** [Date]
```

---

**Status:** ✅ CHECKLIST COMPLETE - Ready for testing
**Usage:** Mark checkboxes as tests are performed
**Update:** After each testing session
