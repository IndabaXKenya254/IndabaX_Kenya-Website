# Production SQL Migrations - IndabaX Kenya Website

This folder contains production-ready SQL migrations to be run on the production Supabase database.

## 🆕 Recent Updates (December 11, 2025)

**🔐 SECURITY FIXES: New Migration Added (45)**:
- **45**: 🔐 **Fix Security Advisories** - Fixes SECURITY DEFINER views, function search_path vulnerabilities, and extension schema

**⚡ PERFORMANCE OPTIMIZATION (November 29, 2025)**:
- **42**: ⚡ **Performance Optimization Indexes** - Comprehensive indexes for all major tables (70-80% faster queries)
- **43**: ⚡ **Additional Performance Indexes** - Specialized indexes for complex queries
- **44**: ⚡ **Rebuild All Indexes** - Complete index rebuild and optimization

**See:** `PERFORMANCE_OPTIMIZATION_README.md` for detailed deployment instructions

**CRITICAL: Previous Updates (November 27, 2025)**:
- **35**: 🚀 **Registration Redesign (Phase 1-5)** - Complete application system overhaul
- **36**: Tickets table enhancements with check-in functionality
- **37**: Reviewer system for paper/application reviews
- **38**: Email verification tokens for user authentication
- **39**: Enhanced email tables with templates and logs
- **40**: Fix tickets foreign key constraint
- **41**: Fix status display issues

**Previous Updates (October 25, 2025)**:
- **28-34**: Public access fixes, tag systems, performance indexes

**Migration Numbering**: All migrations have unique sequential numbers (01-45).

## ⚠️ IMPORTANT - Run Order

Execute these migrations **in order** on your production database:

1. `01_initial_schema.sql` - Creates all database tables, functions, and initial RLS policies
2. `02_fix_rls_policies.sql` - Fixes RLS policies for public form submissions
3. `03_add_unique_constraints.sql` - Adds unique constraints to prevent duplicate submissions
4. `04_fix_admin_roles_rls.sql` - Fixes admin_roles RLS infinite recursion issue
5. `05_setup_storage_buckets.sql` - ✨ Creates Supabase Storage buckets for file uploads
6. `06_update_photos_schema.sql` - Updates photos table schema for gallery functionality
7. `07_phase1_add_missing_columns.sql` - Adds missing columns and indexes to existing tables
8. `08_phase2_tag_system.sql` - Creates tag system (event_tags, post_tags, junction tables)
9. `09_phase3_relationships.sql` - Sets up expertise areas and relationships
10. `10_fix_migration_issues_final.sql` - Fixes migration issues and ensures data consistency
11. `11_add_schedule_speakers_table.sql` - ✨ Creates schedule_speakers junction table
12. `12_add_missing_columns_photos_schedule.sql` - ✨ Adds is_featured (photos), day_name, schedule_date (schedule_items)
13. `13_add_photo_metadata_columns.sql` - ✨ Adds photo_date and uploaded_by columns to photos table
14. `14_expand_session_types.sql` - ✨ Expands session_type constraint to support all conference session types
15. `15_remove_duplicate_schedules.sql` - ✨ Removes duplicate schedule_items (migration script was run twice)
16. `16_performance_indexes.sql` - ⚡ Adds database indexes for performance optimization (50-80% faster queries)
17. `17_create_venues_table.sql` - ✨ Creates venues table with rich content support and event linking
18. `18_create_pricing_tiers_table.sql` - ✨ Creates pricing_tiers table for conference registration passes
19. `19_create_stats_table.sql` - ✨ Creates stats table for homepage statistics/fun facts
20. `20_add_event_registration_fields.sql` - ✨ Adds registration tracking fields to events table
21. `21_add_banner_settings.sql` - ✨ Creates banner_settings for homepage customization
22. `22_expand_event_type_and_status.sql` - ✨ Expands event_type and status enums for more event categories
23. `23_add_venue_images_bucket.sql` - ✨ Creates venue-images storage bucket with RLS policies
24. `24_add_event_weekend_fields.sql` - ✨ Adds weekend configuration fields to events table
25. `25_add_event_dates_array.sql` - ✨ Adds event_dates array for non-consecutive event days
26. `26_add_team_photos_bucket.sql` - ✨ Creates team-photos storage bucket with RLS policies
27. `27_add_team_updated_at.sql` - 🔧 Adds updated_at column and trigger to team_members table
28. `28_fix_public_access_policies.sql` - 🔧 Fixes public access policies for all public-facing tables
29. `29_fix_uploaded_by_column_type.sql` - 🔧 Fixes uploaded_by column type in photos table (TEXT -> UUID)
30. `30_ensure_post_tag_tables_exist.sql` - 🔧 Ensures post_tags and post_post_tags tables exist
31. `31_ensure_event_tag_tables_exist.sql` - 🔧 Ensures event_tags and event_event_tags tables exist
32. `32_fix_tag_relations_rls.sql` - 🔧 Fixes RLS policies for tag junction tables
33. `33_fix_posts_category_constraint.sql` - 🔧 Expands posts category constraint to include blog and event
34. `34_add_settings_indexes.sql` - ⚡ Adds database indexes for settings table performance optimization
35. `35_registration_redesign_phase1_to_5.sql` - 🚀 **CRITICAL** Complete application system redesign
36. `36_tickets_table_enhancements.sql` - ✨ Add check-in functionality to tickets
37. `37_reviewer_system.sql` - ✨ Create reviewer system for paper reviews
38. `38_email_verification_tokens.sql` - 🔐 Email verification system
39. `39_enhance_email_tables.sql` - ✨ Email templates and comprehensive logging
40. `40_fix_tickets_foreign_key.sql` - 🔧 Fix tickets table foreign key constraint
41. `41_fix_status_display.sql` - 🔧 Fix application status display issues
42. `42_performance_optimization_indexes.sql` - ⚡ **PERFORMANCE** Comprehensive indexes for all major tables (70-80% faster queries)
43. `43_additional_performance_indexes.sql` - ⚡ **PERFORMANCE** Additional specialized indexes for complex queries
44. `44_rebuild_all_indexes.sql` - ⚡ **PERFORMANCE** Complete index rebuild and optimization (⚠️ Run during low traffic)
45. `45_fix_security_advisories.sql` - 🔐 **SECURITY** Fix SECURITY DEFINER views, function search_path, and pg_trgm extension schema

**Alternative:** Run `00_complete_migration.sql` - This is a single consolidated file that includes all migrations in order (⚠️ **OUTDATED** - needs to be regenerated with migrations 35-45).

**Performance Optimization:** See `PERFORMANCE_OPTIMIZATION_README.md` for detailed deployment instructions for migrations 42-44.

## Migration Details

### 01_initial_schema.sql
- Creates 15 database tables
- Creates storage buckets
- Sets up RLS policies
- Creates helper functions (is_admin)
- **Status**: ✅ Already run on development

### 02_fix_rls_policies.sql
- Fixes admin policies to use `TO authenticated` instead of `TO public`
- Adds SELECT policies for anonymous users (required for .insert().select())
- **Purpose**: Allows public form submissions without authentication
- **Status**: ✅ Tested on development

### 03_add_unique_constraints.sql
- Adds unique indexes on email + event + application_type
- Adds unique indexes on phone + event + application_type
- **Purpose**: Prevents duplicate registrations and CFP submissions
- **Status**: ✅ Tested on development

### 04_fix_admin_roles_rls.sql
- Fixes infinite recursion in admin_roles RLS policies
- Removes all policies that reference admin_roles in subqueries
- Creates simple SELECT policy: `user_id = auth.uid()`
- Ensures is_admin() function has SECURITY DEFINER
- **Purpose**: Allows admin authentication to work without recursion errors
- **Critical**: Required for admin login functionality
- **Status**: ✅ Tested on development

### 05_setup_storage_buckets.sql ✨
- Creates Supabase Storage buckets for file uploads
- Buckets: `event-images`, `speaker-photos`, `gallery-photos`, `sponsor-logos`, `post-images`, `site-assets`
- Sets up RLS policies for public read, authenticated write
- Configures file size limits and allowed MIME types
- **Purpose**: Enable image and file uploads throughout the application
- **Critical**: Required for all image upload functionality
- **Status**: ✅ Tested on development

### 06_update_photos_schema.sql
- Updates photos table with year, event_id, and metadata columns
- Adds indexes for performance (year, event_id)
- Enables better organization of gallery photos
- **Purpose**: Improve gallery functionality and photo organization
- **Status**: ✅ Tested on development

### 07_phase1_add_missing_columns.sql
- Adds missing columns to existing tables (featured, excerpt, location, etc.)
- Creates indexes for better query performance
- Updates table structures to match application requirements
- **Purpose**: Complete the database schema with all required fields
- **Status**: ✅ Tested on development

### 08_phase2_tag_system.sql
- Creates event_tags and post_tags tables
- Creates junction tables (event_event_tags, post_post_tags)
- Sets up RLS policies for tags
- Enables tagging functionality for events and posts
- **Purpose**: Allow categorization and filtering of content
- **Status**: ✅ Tested on development

### 09_phase3_relationships.sql
- Creates expertise table for speaker expertise areas
- Creates speaker_expertise junction table
- Sets up event_speakers junction table (if not exists)
- Enables many-to-many relationships
- **Purpose**: Link speakers with expertise areas and events
- **Status**: ✅ Tested on development

### 10_fix_migration_issues_final.sql
- Fixes data type mismatches and constraint issues
- Ensures all foreign keys are properly set up
- Resolves migration conflicts and inconsistencies
- **Purpose**: Clean up any issues from previous migrations
- **Status**: ✅ Tested on development

### 11_add_schedule_speakers_table.sql ✨
- Creates schedule_speakers junction table
- Links schedule_items with speakers (many-to-many)
- Sets up RLS policies and indexes
- Migrates data from old speaker_ids array column
- **Purpose**: Fix "Database table not found" error for /api/admin/schedules/
- **Critical**: Required for schedule management functionality
- **Status**: ✅ Tested on development, ✅ Executed on production

### 12_add_missing_columns_photos_schedule.sql ✨
- Adds is_featured column to photos table (BOOLEAN, default false)
- Adds day_name column to schedule_items table (VARCHAR 100)
- Adds schedule_date column to schedule_items table (VARCHAR 100)
- Creates indexes for performance
- **Purpose**: Enable mock data migration script to work correctly
- **Critical**: Required for importing gallery photos and schedule data
- **Status**: ✅ Tested on development

### 13_add_photo_metadata_columns.sql ✨
- Adds photo_date column to photos table (TIMESTAMPTZ, default NOW())
- Adds uploaded_by column to photos table (VARCHAR 255)
- Creates indexes on both columns for filtering and sorting
- Updates existing photos to set photo_date from created_at
- **Purpose**: Track when photos were uploaded and which admin uploaded them
- **Critical**: Required for photo audit trail and admin accountability
- **Status**: ✅ Executed on development

### 14_expand_session_types.sql ✨
- Expands session_type constraint from 5 types to 14 types
- **Old types**: keynote, talk, workshop, break, networking
- **New types added**: panel, registration, track, tutorial, poster, hackathon, social, special, closing
- Drops old constraint and creates new one
- **Purpose**: Support all real-world conference session types
- **Critical**: Required for mock data import and future flexibility
- **Status**: ✅ Updated with 'special' and 'closing' types

### 15_remove_duplicate_schedules.sql ✨
- Removes duplicate schedule_items records
- **Issue**: Mock data migration script was run twice, creating duplicates
- **Before**: 34 schedule items (15 duplicates)
- **After**: 19 unique schedule items
- **Method**: Keeps oldest record (by created_at) for each unique session
- **Uniqueness**: Based on day_number, start_time, end_time, title, location
- **Purpose**: Clean up database after accidental duplicate import
- **Status**: ✅ Executed on development

### 16_performance_indexes.sql ⚡
- Adds database indexes for performance optimization
- **Impact**: 50-80% faster query times on frequently accessed data
- **Indexes Created**: 20+ indexes across all major tables
- **Tables**: events, posts, speakers, faqs, sponsors, photos, team_members, schedule_items, applications, subscribers, contact_submissions
- **Key Indexes**:
  - events(status, event_type), events(start_date)
  - posts(status, published_at), posts(category)
  - speakers(is_featured, display_order)
  - faqs(is_active, category, display_order)
  - sponsors(is_active, tier, display_order)
  - photos(year, display_order)
- **Purpose**: Dramatically improve page load times and reduce database load
- **Status**: ✅ Executed manually on development

### 17_create_venues_table.sql ✨
- Creates venues table for managing conference locations
- Adds venue_id foreign key to events table
- **Features**:
  - Basic info (name, slug, address, city, country, capacity)
  - Rich content fields (description, facilities, getting_there, nearby_amenities) using QuillJS HTML
  - Map integration (embed URL, latitude, longitude)
  - Contact info (phone, email, website)
  - Metadata (is_active, display_order)
- **RLS Policies**:
  - Public can view active venues
  - Admins can manage all venues (using admin_roles table)
- **Indexes**:
  - idx_events_venue_id (for event-venue queries)
  - idx_venues_slug (for URL lookups)
  - idx_venues_is_active (for filtering active venues)
- **Sample Data**: Includes KICC as default venue with full details
- **Purpose**: Enable venue management with rich content and event linking
- **Critical**: Required for venue pages (/venue, /venue/[slug]) and admin venue management
- **Status**: ⏳ Ready for production

### 18_create_pricing_tiers_table.sql ✨
- Creates pricing_tiers table for conference registration passes
- Replaces hardcoded lib/mock-data/pricing.json
- **Features**:
  - Basic info (title, price, currency, period, description)
  - Features and requirements (JSONB arrays for flexible content)
  - Display options (featured flag, badge text, button text/link)
  - Display control (display_order, is_active)
- **RLS Policies**:
  - Public can view active pricing tiers
  - Admins can manage all pricing tiers (using admin_roles table)
- **Indexes**:
  - idx_pricing_tiers_active (for filtering active tiers)
  - idx_pricing_tiers_display_order (for ordering)
  - idx_pricing_tiers_featured (for featured tier queries)
- **Sample Data**: Includes 4 pricing tiers (Student, Academic, Industry, Virtual)
- **Admin Pages**: /admin/pricing - Full CRUD with preview and active/inactive toggles
- **Frontend**: Pricing component fetches from /api/pricing
- **Purpose**: Enable dynamic pricing management from admin panel
- **Status**: ⏳ Ready for production

### 19_create_stats_table.sql ✨
- Creates stats table for homepage statistics/fun facts
- Replaces hardcoded lib/mock-data/stats.json
- **Features**:
  - Basic info (label, value, suffix)
  - Display options (icon class, color hex code)
  - Display control (display_order, is_active)
- **RLS Policies**:
  - Public can view active stats
  - Admins can manage all stats (using admin_roles table)
- **Indexes**:
  - idx_stats_active (for filtering active stats)
  - idx_stats_display_order (for ordering)
- **Sample Data**: Includes 4 stats (Attendees, Speakers, Countries, Years)
- **Admin Pages**: /admin/stats - Full CRUD with preview and active/inactive toggles
- **Frontend**: FunFact component fetches from /api/stats with dynamic colors
- **Purpose**: Enable dynamic statistics management from admin panel
- **Status**: ⏳ Ready for production

### 20_add_event_registration_fields.sql ✨
- Adds registration tracking fields to events table
- **Fields Added**:
  - `registration_url` (TEXT) - External registration link
  - `max_attendees` (INTEGER) - Capacity limit
- **Constraints**:
  - registration_url must be valid HTTP/HTTPS URL or empty
  - max_attendees must be positive number or NULL
- **Purpose**: Enable event registration management with capacity tracking
- **Status**: ✅ Executed on development

### 21_add_banner_settings.sql ✨
- Creates banner_settings table for homepage customization
- **Fields**:
  - Main banner (title, subtitle, image_url, cta_text, cta_link)
  - Display control (is_active)
  - Timestamps (created_at, updated_at)
- **RLS Policies**:
  - Public can view active banners
  - Admins can manage all banners
- **Purpose**: Enable dynamic homepage banner management
- **Status**: ✅ Executed on development

### 22_expand_event_type_and_status.sql ✨
- Expands event_type constraint from 2 to 5 types
- **Old types**: upcoming, past
- **New types added**: workshop, conference, meetup
- Expands status constraint to include: upcoming
- **Purpose**: Support more event categories and statuses
- **Critical**: Required for event categorization
- **Status**: ✅ Executed on development

### 23_add_venue_images_bucket.sql ✨
- Creates venue-images storage bucket for venue photos
- **Features**:
  - Public bucket for venue photos
  - 5MB file size limit
  - Supports JPEG, PNG, WebP, GIF formats
- **RLS Policies**:
  - Admin users can upload, update, and delete venue images
  - Public can view all venue images
- **Bucket Configuration**:
  - Name: 'venue-images'
  - Max size: 5MB
  - Allowed types: image/jpeg, image/png, image/webp, image/gif
- **API Endpoint**: /api/admin/upload/venue-image
- **Purpose**: Enable file upload for venue photos instead of URL input
- **Status**: ✅ Executed on development

### 24_add_event_weekend_fields.sql ✨
- Adds weekend configuration fields to events table
- **Fields Added**:
  - `includes_saturday` (BOOLEAN, default TRUE)
  - `includes_sunday` (BOOLEAN, default TRUE)
- **Purpose**: Enable accurate day count calculations for events
- **Use Case**: Some events may skip weekends or run only on weekdays
- **Status**: ✅ Executed on development

### 25_add_event_dates_array.sql ✨
- Adds event_dates array field to events table
- **Field**: `event_dates` (TEXT ARRAY)
- **Format**: Array of YYYY-MM-DD date strings
- **Example**: ['2026-03-15', '2026-03-17', '2026-03-22']
- **Purpose**: Support non-consecutive event days
- **Use Case**: Events spread across multiple non-consecutive dates
- **Status**: ✅ Executed on development

### 26_add_team_photos_bucket.sql ✨
- Creates team-photos storage bucket for team member photos
- **Features**:
  - Public bucket for accessible team member photos
  - 5MB file size limit
  - Supports JPEG, PNG, and WebP formats
- **RLS Policies**:
  - Admin users can upload, update, and delete team photos
  - Public can view all team photos
- **Bucket Configuration**:
  - Name: 'team-photos'
  - Max size: 5MB
  - Allowed types: image/jpeg, image/png, image/webp
- **API Endpoint**: /api/admin/upload/team-photo - Upload endpoint for team photos
- **Admin Pages**: /admin/team - Uses FileUpload component with drag-and-drop
- **Purpose**: Enable file upload for team member photos instead of URL input
- **Status**: ⏳ Ready for production

### 27_add_team_updated_at.sql 🔧
- Adds updated_at column to team_members table
- **Changes**:
  - Adds updated_at TIMESTAMP WITH TIME ZONE column
  - Sets default value to NOW()
  - Initializes existing rows with created_at value
  - Creates auto-update trigger function
  - Adds BEFORE UPDATE trigger to automatically update timestamp
- **Purpose**: Fix missing updated_at column that API queries expect
- **Impact**: API queries will now succeed without database errors
- **Backward Compatible**: Yes, all existing queries will continue to work
- **Status**: ⏳ Ready for production

### 28_fix_public_access_policies.sql 🔧
- Fixes public access RLS policies for all public-facing tables
- **Changes**:
  - Updates SELECT policies for events, posts, speakers, venues, etc.
  - Ensures anonymous users can read published content
  - Maintains admin-only access for write operations
- **Purpose**: Fix 403 errors on public pages accessing database content
- **Status**: ✅ Executed on development

### 29_fix_uploaded_by_column_type.sql 🔧
- Fixes uploaded_by column type in photos table
- **Changes**:
  - Changes uploaded_by from TEXT to UUID
  - Adds foreign key reference to auth.users table
  - Migrates existing data (converts valid UUIDs, nullifies invalid)
- **Purpose**: Enable proper tracking of who uploaded photos
- **Impact**: Better audit trail and admin accountability
- **Status**: ✅ Executed on development

### 30_ensure_post_tag_tables_exist.sql 🔧
- Ensures post_tags and post_post_tags tables exist
- **Changes**:
  - Creates post_tags table if not exists
  - Creates post_post_tags junction table if not exists
  - Sets up RLS policies for public read, admin write
  - Creates necessary indexes
- **Purpose**: Fix missing tag tables that caused API errors
- **Status**: ✅ Executed on development

### 31_ensure_event_tag_tables_exist.sql 🔧
- Ensures event_tags and event_event_tags tables exist
- **Changes**:
  - Creates event_tags table if not exists
  - Creates event_event_tags junction table if not exists
  - Sets up RLS policies for public read, admin write
  - Creates necessary indexes
- **Purpose**: Fix missing tag tables that caused API errors
- **Status**: ✅ Executed on development

### 32_fix_tag_relations_rls.sql 🔧
- Fixes RLS policies for tag junction tables
- **Changes**:
  - Updates RLS policies for post_post_tags table
  - Updates RLS policies for event_event_tags table
  - Ensures public can read, admins can manage
- **Purpose**: Enable tag filtering on public pages
- **Status**: ✅ Executed on development

### 33_fix_posts_category_constraint.sql 🔧
- Expands posts category constraint to support all categories
- **Changes**:
  - Drops old constraint (news, announcement, article only)
  - Creates new constraint (news, announcement, article, blog, event)
  - Updates existing posts if needed
- **Purpose**: Fix validation errors when creating blog or event posts
- **Critical**: Required for admin to create posts in all categories
- **Status**: ✅ Executed on development

### 34_add_settings_indexes.sql ⚡
- Adds database indexes for settings table performance
- **Indexes Created**:
  - idx_settings_key - Primary lookup index for key-based queries
  - idx_settings_updated_at - Cache invalidation and change tracking
  - idx_settings_updated_by - Admin audit trail queries
- **Impact**: 50-70% faster settings queries, improved page load times
- **Use Cases**:
  - Public settings API (/api/settings) - fetched on every page
  - Metadata generation (SEO title, description, keywords)
  - Navbar and footer settings (logo, social links, contact)
- **Purpose**: Optimize settings queries that run on every page load
- **Status**: ⏳ Ready for production

### 35_registration_redesign_phase1_to_5.sql 🚀 **CRITICAL**
- **Complete registration and application system redesign**
- **This is a CONSOLIDATION file** - Contains Nov 20-27 changes
- **Tables Created**:
  - `user_profiles` - Extended user profiles with roles
  - `registrations` - Master registration records (designed but unused)
  - `form_templates` - Dynamic form builder templates
  - `form_responses` - **ACTIVE TABLE** - All application data stored here
  - `review_locks` - Concurrent review prevention (30-min locks)
  - `activity_logs` - Audit trail for all application actions
  - `email_verification_tokens` - Email verification system
- **Views Created**:
  - `applications_with_locks` - Applications with lock status (queries form_responses)
- **Functions Created**:
  - `cleanup_expired_locks()` - Auto-cleanup expired review locks
  - `is_application_locked()` - Check lock status
- **Enums Created**:
  - `user_role` - applicant, speaker, reviewer, admin
  - `registration_status` - 8-stage workflow
  - `registration_status_v2` - Enhanced status tracking
  - `question_type` - 15 form question types
  - `response_status` - not_started, in_progress, completed
  - `email_status` - pending, sent, delivered, failed, bounced
  - `paper_status` - submitted, under_review, approved, rejected
- **IMPORTANT NOTES**:
  - `form_responses` is the ACTIVE table with all application data
  - `registrations` table exists but is UNUSED (planned for future)
  - View `applications_with_locks` queries `form_responses` (NOT registrations)
  - Review locks use `review_locks.registration_id` → `form_responses.id`
- **RLS Policies**: Authenticated users can view, public can insert
- **Indexes**: 10+ indexes for performance
- **Status**: ✅ Applied to development database
- **Production Impact**: BREAKING - Requires application code update

### 36_tickets_table_enhancements.sql ✨
- Enhances existing tickets table with check-in functionality
- **Columns Added**:
  - `status` - active, checked_in, cancelled, expired
  - `checked_in_at` - Timestamp of check-in
  - `checked_in_by` - Admin who performed check-in
  - `downloaded_at` - When ticket PDF was downloaded
- **Purpose**: Enable QR code check-in at events
- **API Endpoints**: /api/tickets/checkin, /api/tickets/export
- **Status**: ✅ Applied to development database

### 37_reviewer_system.sql ✨
- Creates complete reviewer system for paper/application reviews
- **Tables Created**:
  - `reviewers` - Reviewer profiles with expertise
  - `reviewer_assignments` - Paper/application assignments
- **Views Created**:
  - `reviewer_stats` - Reviewer performance metrics
- **Features**:
  - Reviewer expertise tracking
  - Assignment management
  - Review status tracking
  - Performance analytics
- **Purpose**: Enable peer review workflow for papers and applications
- **Status**: ✅ Applied to development database

### 38_email_verification_tokens.sql 🔐
- Creates email verification token system
- **Table**: `email_verification_tokens`
- **Fields**: email, token, expires_at, verified_at
- **Purpose**: Enable email verification for user registration
- **Expiry**: Tokens expire after configurable time
- **Status**: ✅ Applied to development database

### 39_enhance_email_tables.sql ✨
- Enhances email system with templates and comprehensive logging
- **Tables Enhanced/Created**:
  - `email_templates` - Reusable email templates with QuillJS editor
  - `email_logs` - Comprehensive email delivery tracking
- **Features**:
  - Template variables and substitution
  - Delivery status tracking (pending, sent, delivered, failed, bounced)
  - Email categorization (transactional, marketing, notification)
  - Open and click tracking
  - Error logging
- **Admin Pages**: /admin/email-templates - Full template CRUD
- **Purpose**: Professional email management with audit trail
- **Status**: ✅ Applied to development database

### 45_fix_security_advisories.sql 🔐

- Fixes critical security issues flagged by Supabase database linter
- **Changes**:
  - **SECURITY DEFINER Views** → SECURITY INVOKER:
    - Recreates `applications_with_locks` view with `security_invoker=true`
    - Recreates `reviewer_stats` view with `security_invoker=true`
    - Removes dependency on `auth.users` table (uses `user_profiles` instead)
  - **Function Search Path Protection**:
    - Sets fixed `search_path` on 18 functions to prevent search path injection
    - Functions: ticketing, review locks, role checks, triggers, etc.
  - **Extension Schema Migration**:
    - Moves `pg_trgm` extension from `public` to `extensions` schema
    - Creates `extensions` schema with proper permissions
  - **Verification Queries**: Confirms all fixes were applied successfully
- **Security Impact**:
  - ✅ Eliminates RLS bypass vulnerabilities (SECURITY DEFINER views)
  - ✅ Prevents SQL search path injection attacks
  - ✅ Improves schema isolation for extensions
- **Performance Impact**: Minimal (metadata-only changes)
- **Status**: ✅ Applied to development database (December 11, 2025)
- **Related**: See `SECURITY_ADVISORIES_FIX.md` for detailed documentation

**⚠️ MANUAL STEP REQUIRED**: After running this migration, you MUST enable **Leaked Password Protection** in Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Find **"Leaked Password Protection"**
3. Toggle it **ON**
4. This checks passwords against HaveIBeenPwned.org database

## Pre-Migration Checklist

Before running on production:

- [ ] Backup your production database
- [ ] Verify Supabase project credentials
- [ ] Ensure no active users during migration
- [ ] Review each migration file
- [ ] Test on staging environment (if available)

## Post-Migration Verification

After running migrations:

```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Verify policies exist
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test public form submission
-- (Use API endpoints with Postman/Insomnia)
```

## Rollback Instructions

If you need to rollback migrations, contact the development team. Manual rollback may be required.

## Notes

- All migrations are idempotent where possible (use IF NOT EXISTS)
- RLS policies use permissive mode (default)
- Admin access requires authentication and is_admin() function
- Public forms work for anonymous (anon) users
