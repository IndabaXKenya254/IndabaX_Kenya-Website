# Registration System Redesign - Migration Log

**Project:** IndabaX Kenya Website
**Branch:** feature/registration-redesign
**Started:** 2025-11-20
**Status:** Phase 0 - Pre-Development Setup

---

## Phase 0: Pre-Development Setup

**Started:** 2025-11-20
**Status:** ✅ In Progress

### Completed Tasks

- [x] Read INTEGRATION_PLAN.md completely
- [x] Read DATABASE_SCHEMA.md completely
- [x] Verified Node.js version: v22.19.0 (✅ Meets requirement of 20+)
- [x] Verified npm version: 10.9.3
- [x] Verified all dependencies installed
- [x] Checked .env.local configuration (✅ Supabase credentials present)
- [x] Documented current database schema
- [x] Created new git branch: `feature/registration-redesign`
- [x] Created docs/migration-log.md

### Pending Tasks

- [ ] Test current website runs locally (`npm run dev`)
- [ ] Backup current Supabase database
- [ ] Export existing applications data to CSV
- [ ] Make initial commit on new branch
- [ ] List all affected API routes
- [ ] List all affected pages

---

## Current System Analysis

### Environment

**Node.js:** v22.19.0
**npm:** 10.9.3
**Next.js:** 14.1.3
**React:** 18
**Supabase Project:** klnspdwlybpwkznzezzd

### Dependencies Already Installed

Key dependencies that are already available:
- @supabase/supabase-js (2.75.0)
- @supabase/ssr (0.7.0)
- @tanstack/react-query (5.90.5)
- @tanstack/react-table (8.21.3)
- react-hook-form (7.65.0)
- react-quill (2.0.0)
- zod (4.1.12)
- @hookform/resolvers (5.2.2)
- aos (2.3.4)

### Dependencies to Install (Future Phases)

For Phase 3 (Form Builder):
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install nanoid lodash date-fns
```

For Phase 8 (Ticket Generation):
```bash
npm install @react-pdf/renderer qrcode.react
```

For Phase 10 (Analytics):
```bash
npm install recharts
```

---

## Current Database Schema

### Existing Tables

Based on migration files in `supabase/migrations/`:

1. **events** - Event information (conferences, workshops)
   - Fields: id, slug, title, description, start_date, end_date, location, venue, featured_image, status, event_type, is_featured, venue_details (JSONB), created_at, updated_at
   - Status: draft | published | archived
   - Event type: upcoming | past

2. **speakers** - Event speakers and presenters
   - Fields: id, name, title, organization, photo_url, bio_short, bio_full, linkedin_url, twitter_url, website_url, is_featured, display_order, created_at, updated_at

3. **posts** - News, announcements, and articles
   - Fields: id, slug, title, excerpt, content, featured_image, author_id, status, category, published_at, created_at, updated_at
   - Status: draft | published
   - Category: news | announcement | article

4. **applications** - User applications (WILL BE REPLACED)
   - Current simple structure
   - Will be migrated to new `registrations` table

5. **subscribers** - Newsletter subscribers
   - Email subscriptions

6. **photos** - Gallery images
   - With metadata columns

7. **settings** - Site settings
   - Key-value pairs for site configuration

8. **admins** - Admin users
   - Admin authentication records

9. **event_speakers** - Many-to-many relationship
   - Links events to speakers

10. **tags** - Tag system
    - For categorizing content

11. **venues** - Venue information
    - Venue details for events

12. **pricing_tiers** - Pricing information
    - Event pricing (if applicable)

13. **stats** - Statistics tracking
    - Analytics data

14. **schedule_items** - Event schedule
    - Event agenda/schedule

15. **contact_submissions** - Contact form submissions
    - Messages from contact form

### Storage Buckets

- `event-images` - Event featured images
- `speaker-photos` - Speaker profile photos
- `gallery-photos` - Gallery images
- `venue-images` - Venue photos

---

## API Routes Analysis

### Current API Routes

Located in `src/app/api/`:

1. **`/api/applications/registration/route.ts`** ⚠️ WILL BE AFFECTED
   - Current: Simple application submission
   - Future: Multi-stage registration flow

2. **`/api/applications/call-for-papers/route.ts`** ⚠️ WILL BE AFFECTED
   - Current: Paper submission
   - Future: Integrated with registration system

3. **`/api/events/route.ts`** ⚠️ MINOR CHANGES
   - Will need template assignment fields

4. **`/api/events/[slug]/route.ts`** ⚠️ MINOR CHANGES
   - Will return template information

5. **`/api/posts/route.ts`** ✅ NO CHANGES
   - Keep as is

6. **`/api/posts/[slug]/route.ts`** ✅ NO CHANGES
   - Keep as is

7. **`/api/speakers/route.ts`** ✅ NO CHANGES
   - Keep as is

8. **`/api/gallery/route.ts`** ✅ NO CHANGES
   - Keep as is

9. **`/api/settings/route.ts`** ✅ NO CHANGES
   - Keep as is

10. **`/api/settings/[key]/route.ts`** ✅ NO CHANGES
    - Keep as is

11. **`/api/pricing/route.ts`** ✅ NO CHANGES
    - Keep as is

12. **`/api/sponsors/route.ts`** ✅ NO CHANGES
    - Keep as is

13. **`/api/team/route.ts`** ✅ NO CHANGES
    - Keep as is

14. **`/api/contact/route.ts`** ✅ NO CHANGES
    - Keep as is

15. **`/api/subscribe/route.ts`** ✅ NO CHANGES
    - Keep as is

16. **`/api/schedule-items/route.ts`** ✅ NO CHANGES
    - Keep as is

### New API Routes to Create

**Phase 2 (Authentication):**
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Email verification
- `GET /api/auth/session` - Get current session

**Phase 3 (Form Builder):**
- `GET /api/forms/templates` - List templates
- `POST /api/forms/templates` - Create template
- `GET /api/forms/templates/[id]` - Get template
- `PATCH /api/forms/templates/[id]` - Update template
- `DELETE /api/forms/templates/[id]` - Delete template
- `POST /api/forms/templates/[id]/duplicate` - Duplicate template

**Phase 4 (Registration):**
- `POST /api/registrations/show-interest` - Initial registration
- `GET /api/registrations/[id]` - Get registration
- `PATCH /api/registrations/[id]` - Update registration
- `POST /api/forms/responses` - Create response
- `PATCH /api/forms/responses/[id]` - Update response (auto-save)
- `POST /api/forms/submit` - Submit completed form

**Phase 5 (Admin Review):**
- `POST /api/reviews/lock` - Lock application for review
- `DELETE /api/reviews/lock/[id]` - Unlock application
- `PATCH /api/registrations/[id]/shortlist` - Shortlist user
- `GET /api/registrations/[id]/responses` - Get all responses
- `PATCH /api/registrations/[id]/approve` - Approve application
- `PATCH /api/registrations/[id]/reject` - Reject application

**Phase 6 (Survey):**
- `GET /api/forms/responses/[token]` - Get response by token
- `POST /api/forms/responses/[id]/submit` - Submit survey
- `PATCH /api/forms/responses/[id]/extend-deadline` - Extend deadline

**Phase 7 (Email):**
- `GET /api/emails/templates` - List email templates
- `POST /api/emails/templates` - Create email template
- `PATCH /api/emails/templates/[id]` - Update email template
- `DELETE /api/emails/templates/[id]` - Delete email template
- `POST /api/emails/send` - Send email
- `POST /api/emails/bulk` - Send bulk emails
- `GET /api/emails/logs` - Get email logs

**Phase 8 (Tickets):**
- `POST /api/tickets/generate` - Generate ticket
- `GET /api/tickets/[id]` - Get ticket
- `GET /api/tickets/[id]/download` - Download ticket PDF

**Phase 9 (Reviewers):**
- `GET /api/reviewers` - List reviewers
- `POST /api/reviewers` - Add reviewer
- `PATCH /api/reviewers/[id]` - Update reviewer permissions
- `DELETE /api/reviewers/[id]` - Remove reviewer
- `GET /api/reviewers/my-events` - Get reviewer's assigned events

**Phase 10 (Analytics):**
- `GET /api/analytics/funnel/[eventId]` - Application funnel data
- `GET /api/analytics/timeline/[eventId]` - Submission timeline data
- `GET /api/analytics/reviewers/[eventId]` - Reviewer performance data
- `GET /api/analytics/compare?eventIds=[]` - Event comparison data
- `GET /api/analytics/submissions/[eventId]` - Submission tracking data
- `GET /api/analytics/export/applications/[eventId]` - Export applications CSV
- `GET /api/analytics/export/responses/[eventId]` - Export responses CSV
- `GET /api/analytics/export/emails/[eventId]` - Export email logs CSV
- `GET /api/analytics/export/reviewers/[eventId]` - Export reviewer data CSV

**Total New Routes:** ~40+

---

## Pages Analysis

### Current Pages

Located in `src/app/`:

1. **`/page.tsx`** - Home page ✅ NO CHANGES

2. **`/about-us/page.tsx`** ✅ NO CHANGES

3. **`/contact/page.tsx`** ✅ NO CHANGES

4. **`/contact-us/page.tsx`** ✅ NO CHANGES

5. **`/events/page.tsx`** ⚠️ MINOR CHANGES
   - May need to show registration status

6. **`/events/[slug]/page.tsx`** ⚠️ WILL BE AFFECTED
   - Will show "Register" button linking to new flow

7. **`/gallery/page.tsx`** ✅ NO CHANGES

8. **`/speakers/page.tsx`** ✅ NO CHANGES

9. **`/speakers/[id]/page.tsx`** ✅ NO CHANGES

10. **`/news/page.tsx`** ✅ NO CHANGES

11. **`/news/[slug]/page.tsx`** ✅ NO CHANGES

12. **`/schedule/page.tsx`** ✅ NO CHANGES

13. **`/sponsors/page.tsx`** ✅ NO CHANGES

14. **`/register/page.tsx`** ⚠️ WILL BE REPLACED
    - Current: Simple registration form
    - Future: Dynamic form based on template

15. **`/admin/*`** ⚠️ MULTIPLE PAGES AFFECTED
    - `/admin/dashboard/page.tsx` - Minor updates
    - `/admin/applications/page.tsx` - MAJOR CHANGES
    - `/admin/applications/[id]/page.tsx` - MAJOR CHANGES (if exists)
    - `/admin/events/page.tsx` - Minor updates (template assignment)
    - All other admin pages: NO CHANGES

### New Pages to Create

**Phase 2 (Authentication):**
- `/register/page.tsx` - Update existing or create new user registration
- `/login/page.tsx` - Update existing login (if needed)
- `/verify-email/page.tsx` - Email verification page
- `/dashboard/page.tsx` - User dashboard

**Phase 3 (Form Builder - Admin):**
- `/admin/templates/page.tsx` - Template list
- `/admin/templates/new/page.tsx` - Create template
- `/admin/templates/[id]/edit/page.tsx` - Edit template
- `/admin/templates/[id]/preview/page.tsx` - Preview template

**Phase 4 (Registration):**
- `/events/[id]/register/page.tsx` - Event registration with dynamic form
- `/events/[id]/register/success/page.tsx` - Registration confirmation

**Phase 6 (Survey):**
- `/survey/[token]/page.tsx` - Survey completion page
- `/survey/[token]/complete/page.tsx` - Survey completion confirmation

**Phase 7 (Email - Admin):**
- `/admin/emails/templates/page.tsx` - Email template list
- `/admin/emails/templates/new/page.tsx` - Create email template
- `/admin/emails/templates/[id]/edit/page.tsx` - Edit email template
- `/admin/emails/compose/page.tsx` - Compose email
- `/admin/emails/logs/page.tsx` - Email logs

**Phase 8 (Tickets):**
- `/tickets/[id]/page.tsx` - Ticket view/download

**Phase 9 (Reviewers):**
- `/admin/events/[id]/reviewers/page.tsx` - Manage reviewers for event
- `/reviewer/dashboard/page.tsx` - Reviewer dashboard
- `/reviewer/events/[id]/applications/page.tsx` - Reviewer application list

**Phase 10 (Analytics):**
- `/admin/analytics/page.tsx` - Overall analytics
- `/admin/events/[id]/analytics/page.tsx` - Per-event analytics
- `/admin/analytics/compare/page.tsx` - Event comparison

**Total New Pages:** ~25+

---

## Database Changes Summary

### Tables to Add (12 new tables)

1. **user_profiles** - Extend Supabase Auth users
2. **registrations** - Replace `applications` table
3. **form_templates** - Form template definitions
4. **form_questions** - Questions within templates
5. **form_responses** - User responses to forms
6. **form_answers** - Individual answers
7. **review_locks** - Prevent concurrent reviews
8. **reviewers** - Reviewer assignments
9. **email_templates** - Email template storage
10. **email_logs** - Email sending history
11. **tickets** - Generated tickets
12. **papers** - Paper submissions (if doesn't exist)

### Tables to Modify

- **events** - Add `initial_template_id`, `detailed_template_id` columns

### Tables to Keep As-Is

- speakers
- posts
- subscribers
- photos
- settings
- admins
- event_speakers
- tags
- venues
- pricing_tiers
- stats
- schedule_items
- contact_submissions

### Tables to Deprecate (Don't Delete Yet)

- **applications** - Mark as deprecated, migrate data to `registrations`

---

## Migration Strategy

### Phase 1: Database Migration

1. **Create migration file:** `supabase/migrations/20251120000000_registration_redesign.sql`
2. **Add all 12 new tables** with proper constraints
3. **Add UNIQUE constraints** for conflict prevention:
   - `UNIQUE(user_id, event_id)` on registrations
   - `UNIQUE(registration_id)` on review_locks
   - `UNIQUE(user_id, event_id)` on reviewers
4. **Add indexes** on foreign keys and frequently queried columns
5. **Create RLS policies** for all new tables
6. **Add columns to events table** (initial_template_id, detailed_template_id)
7. **Migrate data** from applications to registrations
8. **Mark applications table** as deprecated (add comment)

### Data Migration Script

Location: `scripts/migrate-applications-to-registrations.ts`

```typescript
// Pseudocode:
// 1. Read all records from applications table
// 2. For each application:
//    a. Create user_profile if doesn't exist
//    b. Create registration record
//    c. Create form_response record (initial)
//    d. Create form_answers for each field
//    e. Link registration to form_response
// 3. Verify migration (count records)
// 4. Log any errors
```

---

## Risk Assessment

### High Risk

- Data migration from `applications` to `registrations`
  - **Mitigation:** Backup database before migration, test on staging first
- Breaking existing admin application review flow
  - **Mitigation:** Keep old API routes active during transition, use feature flags

### Medium Risk

- User confusion with new registration flow
  - **Mitigation:** Clear UI/UX, help text, email instructions
- Email delivery issues
  - **Mitigation:** Test email sending thoroughly, have fallback SMTP

### Low Risk

- Performance with large number of form questions
  - **Mitigation:** Proper indexing, pagination, lazy loading

---

## Rollback Plan

If critical issues arise:

1. **Database:** Revert migration (keep backup)
2. **Code:** Toggle feature flag to use old system
3. **Data:** Restore from backup if needed

### Feature Flags

Add to `.env.local`:
```
NEXT_PUBLIC_USE_NEW_REGISTRATION=false # Toggle to true when ready
```

Use in code:
```typescript
const useNewSystem = process.env.NEXT_PUBLIC_USE_NEW_REGISTRATION === 'true';
```

---

## Testing Checklist

### Phase 0 Testing (Pre-Development)

- [ ] Website runs locally without errors
- [ ] Can access admin panel
- [ ] Can view events
- [ ] Can view applications (old system)
- [ ] Supabase connection works
- [ ] Can query database

### Phase 1 Testing (Database)

- [ ] Migration runs without errors
- [ ] All new tables created
- [ ] All indexes created
- [ ] All RLS policies active
- [ ] Data migrated successfully
- [ ] No data loss
- [ ] Old system still works

---

## Next Steps

1. Complete Phase 0 tasks:
   - [ ] Test website locally
   - [ ] Backup database
   - [ ] Export applications data
   - [ ] Make initial commit

2. Begin Phase 1:
   - [ ] Create migration SQL file
   - [ ] Test migration on staging
   - [ ] Run migration on development
   - [ ] Verify all tables created

---

## Change Log

### 2025-11-20

**Phase 0 Started**
- Created git branch: `feature/registration-redesign`
- Verified environment setup
- Documented current system
- Created migration log

---

**End of Migration Log**

---

## Phase 1: Database Migration

**Started:** 2025-11-20
**Status:** ✅ Migration File Created

### Day 1-2: Migration File Creation - COMPLETE ✅

**File Created:** `supabase/migrations/20251120000000_registration_redesign.sql`

**Migration File Contents:**

#### Section 1: ENUMs (6 total)
- `user_role` - applicant | speaker | reviewer | admin
- `registration_status` - 8 statuses (interested → approved/rejected)
- `question_type` - 15 question types (Google Forms style)
- `response_status` - not_started | in_progress | completed
- `email_status` - pending | sent | delivered | failed | bounced
- `paper_status` - submitted | under_review | approved | rejected

#### Section 2: New Tables (12 total)

1. **user_profiles** - Extends Supabase Auth users
   - Links to auth.users(id)
   - Fields: email, name, phone, organization, role, avatar, bio, is_new_user, is_active
   - Timestamps: created_at, updated_at, last_login_at

2. **registrations** - Replaces applications table
   - UNIQUE constraint: (user_id, event_id) - Prevents duplicate registrations
   - Status tracking for multi-stage workflow
   - References: initial_form_response_id, detailed_form_response_id, paper_id, ticket_id
   - Review tracking: reviewed_by, review_notes, reviewed_at
   - Shortlist tracking: shortlisted_by, shortlisted_at
   - Decision tracking: approved_by, rejected_by, decision_at, decision_notes

3. **form_templates** - Reusable form templates
   - Fields: name, description, is_locked, locked_to_event_id, usage_type
   - Settings JSONB: validityPeriodDays, autoSave, allowResume, showProgress
   - Usage types: initial_interest | detailed_survey | paper_submission | custom

4. **form_questions** - Questions within templates
   - Type: One of 15 question types
   - Fields: title, description, is_required, order_index
   - Config JSONB: Type-specific configuration (options, validation, etc.)
   - Validation rules JSONB: email, url, number, length, regex
   - Conditional logic JSONB: Show/hide based on other answers (future feature)

5. **form_responses** - User responses to forms
   - Status: not_started | in_progress | completed
   - Auto-save support: last_saved_at timestamp
   - Access token for survey links: /survey/[token]
   - Deadline tracking: deadline_at
   - Time tracking: started_at, completed_at, time_to_complete_seconds

6. **form_answers** - Individual answers to questions
   - Multiple answer types: text_answer, number_answer, date_answer, json_answer, file_answer
   - Supports all 15 question types

7. **review_locks** - Prevent concurrent reviews
   - UNIQUE constraint: registration_id - Only one lock per registration
   - Fields: locked_by, locked_at, expires_at (30 minutes)
   - Conflict prevention mechanism

8. **reviewers** - Reviewer assignments to events
   - UNIQUE constraint: (user_id, event_id) - One assignment per user per event
   - Permissions JSONB: canViewApplications, canApprove, canReject, canViewPII, etc.
   - Activity tracking: applications_reviewed, last_active_at

9. **email_templates** - Reusable email templates
   - Fields: name, subject, body (rich HTML from QuillJS)
   - Type: verification | shortlist | approval | rejection | survey_reminder | custom
   - Variables array: {{name}}, {{email}}, {{event_name}}, etc.

10. **email_logs** - Track all sent emails
    - Fields: from_email, to_email, cc_emails, bcc_emails, subject, body
    - Status tracking: pending | sent | delivered | failed | bounced
    - Error tracking: error_message, attempts
    - Timestamps: sent_at, delivered_at, created_at

11. **tickets** - Generated event tickets
    - UNIQUE ticket_number: Format EVENT-001234
    - QR code data: JSON encoded {ticketId, userId, eventId}
    - PDF URL: Stored in Supabase Storage (tickets/[eventId]/[ticketId].pdf)
    - Status: is_valid (can be invalidated)

12. **papers** - Paper submissions
    - Fields: title, abstract, keywords (array)
    - File storage: paper_url, supplementary_files (JSONB)
    - Status: submitted | under_review | approved | rejected
    - Review tracking: reviewed_by, review_notes, reviewed_at

#### Section 3: Foreign Key Constraints
- Added circular reference constraints (after all tables created)
- registrations → form_responses (initial + detailed)
- registrations → papers
- registrations → tickets

#### Section 4: Modify Existing Tables
- **events table** - Added columns:
  - `initial_template_id` - Template for initial interest form
  - `detailed_template_id` - Template for detailed survey (post-shortlist)
- **applications table** - Marked as deprecated (comment added)

#### Section 5: Indexes (~40 total)
Created indexes on:
- All foreign keys
- Frequently queried columns (email, status, timestamps)
- UNIQUE constraints (access_token, ticket_number)
- Composite indexes (template_id + order_index)

Performance-optimized queries for:
- User profile lookups
- Registration filtering by status, event, user
- Form template searches
- Response access by token
- Review lock expiration cleanup
- Email log filtering
- Ticket lookups

#### Section 6: Storage Buckets (3 total)
1. **tickets** - Private (PDF tickets, only owner + admins)
2. **form-uploads** - Private (User file uploads from forms)
3. **papers** - Private (Paper PDFs, only owner + admins)

#### Section 7: Row Level Security (RLS)
- Enabled RLS on all 12 new tables
- Total policies: ~50

#### Section 8: RLS Policies (~50 total)

**user_profiles policies:**
- Users can view/update own profile
- Admins can view all profiles
- Public can create profiles (registration)

**registrations policies:**
- Users can view/create own registrations
- Admins can view/update all registrations
- Reviewers can view assigned registrations (based on permissions)

**form_templates policies:**
- Public can view templates (for rendering forms)
- Admins can create/update/delete templates

**form_questions policies:**
- Public can view questions
- Admins can manage questions

**form_responses policies:**
- Users can view/create/update own responses (until completed)
- Admins can view/update all responses (extend deadline, etc.)

**form_answers policies:**
- Users can view/create/update own answers (until completed)
- Admins can view all answers

**review_locks policies:**
- Admins/reviewers can view/create locks
- Lock owner can delete own lock
- Admins can delete any lock

**reviewers policies:**
- Admins can manage reviewers
- Reviewers can view own assignments

**email_templates policies:**
- Admins can manage email templates

**email_logs policies:**
- Admins can view email logs
- System (service role) can insert logs

**tickets policies:**
- Users can view own tickets
- Admins can view all tickets
- System (service role) can create tickets

**papers policies:**
- Users can view/create/update own papers
- Admins can view/update all papers (review)

#### Section 9: Storage Policies
- **tickets bucket** - Users can view own, system can upload
- **form-uploads bucket** - Users can view/upload own files
- **papers bucket** - Users can view/upload own papers
- All buckets: Admins have full access

#### Section 10: Helper Functions (3 total)

1. **is_admin()** - Check if current user is admin
   - Returns boolean
   - Used in RLS policies
   - SECURITY DEFINER for elevated privileges

2. **cleanup_expired_locks()** - Remove expired review locks
   - Returns count of deleted locks
   - Should be called periodically via cron
   - Deletes locks where expires_at < NOW()

3. **update_updated_at_column()** - Trigger function
   - Automatically updates updated_at timestamp
   - Applied to 7 tables via triggers

#### Triggers (7 total)
Auto-update `updated_at` on:
- user_profiles
- registrations
- form_templates
- form_answers
- reviewers
- email_templates
- papers

### Migration File Statistics

**Total Lines:** ~1,400
**Total Tables Created:** 12
**Total Indexes:** ~40
**Total RLS Policies:** ~50
**Storage Buckets:** 3
**Helper Functions:** 3
**Triggers:** 7
**ENUMs:** 6

### Next Steps

1. **Review Migration File** - Verify all SQL syntax is correct
2. **Backup Current Database** - Create backup before running migration
3. **Test on Staging** - Run migration on development/staging environment
4. **Verify Tables Created** - Check all tables, indexes, policies exist
5. **Create Data Migration Script** - Migrate data from applications to registrations

---

### Change Log

**2025-11-20 - Phase 1 Day 1-2**
- Created comprehensive SQL migration file
- All 12 tables defined with complete schemas
- All indexes, constraints, RLS policies included
- Storage buckets and policies configured
- Helper functions and triggers created
- Ready for testing

