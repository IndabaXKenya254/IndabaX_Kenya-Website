# Production Deployment Guide - IndabaX Kenya Website

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Create production Supabase project
- [ ] Note down project URL and keys
- [ ] Update production `.env` file with credentials
- [ ] Verify production domain/URL

### 2. Database Backup
- [ ] Backup existing production data (if any)
- [ ] Download backup locally
- [ ] Test backup restoration (optional but recommended)

### 3. Migration Preparation
- [ ] Review all migration files in `prodsql/` folder
- [ ] Verify migration order: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11
- [ ] Read README.md for migration details
- [ ] ⚠️ **11 migrations must be run in sequence**

## Deployment Steps

### Step 1: Run Database Migrations

**Option A: Run Individual Migrations (Recommended)**

1. Open Supabase Dashboard → SQL Editor
2. Run migrations in order (copy/paste each file and execute):

```sql
-- 01: Initial Schema
-- Copy and paste contents of 01_initial_schema.sql
-- Execute and verify "Success"

-- 02: Fix RLS Policies
-- Copy and paste contents of 02_fix_rls_policies.sql
-- Execute and verify "Success"

-- 03: Add Unique Constraints
-- Copy and paste contents of 03_add_unique_constraints.sql
-- Execute and verify "Success"

-- 04: Fix Admin Roles RLS
-- Copy and paste contents of 04_fix_admin_roles_rls.sql
-- Execute and verify "Success"

-- 05: Setup Storage Buckets ✨
-- Copy and paste contents of 05_setup_storage_buckets.sql
-- Execute and verify "Success"
-- CRITICAL: Required for all image uploads

-- 06: Update Photos Schema
-- Copy and paste contents of 06_update_photos_schema.sql
-- Execute and verify "Success"

-- 07: Phase 1 - Add Missing Columns
-- Copy and paste contents of 07_phase1_add_missing_columns.sql
-- Execute and verify "Success"

-- 08: Phase 2 - Tag System
-- Copy and paste contents of 08_phase2_tag_system.sql
-- Execute and verify "Success"

-- 09: Phase 3 - Relationships
-- Copy and paste contents of 09_phase3_relationships.sql
-- Execute and verify "Success"

-- 10: Fix Migration Issues
-- Copy and paste contents of 10_fix_migration_issues_final.sql
-- Execute and verify "Success"

-- 11: Add Schedule Speakers Table ✨
-- Copy and paste contents of 11_add_schedule_speakers_table.sql
-- Execute and verify "Success"
-- CRITICAL: Required for schedule management
```

**Option B: Use Supabase CLI** (if available)

```bash
# Initialize Supabase
supabase init

# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

### Step 2: Verify Migrations

Run verification queries in SQL Editor:

```sql
-- 1. Check all tables exist (should return 15 tables)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Check policies exist for form tables
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'contact_submissions', 'subscribers')
ORDER BY tablename, policyname;

-- Expected results:
-- - Admin policies should have roles: {authenticated}
-- - Public INSERT policies should have roles: {anon,authenticated}
-- - Public SELECT policies should have roles: {anon,authenticated}

-- 4. Verify unique constraints
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'applications'
  AND indexname LIKE '%unique%';
```

### Step 3: Create Admin User

**Part A: Create Auth User**

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" (manually)
3. Enter:
   - Email: `admin@indabaxkenya.org`
   - Password: (choose a strong password)
   - Auto Confirm User: ✅ Yes
4. Click "Create User"
5. **Copy the User ID (UUID)** from the users list

**Part B: Add to admin_roles Table**

Run this SQL in Supabase SQL Editor:

```sql
-- Insert a super admin user
INSERT INTO public.admin_roles (user_id, role)
VALUES (
  'PASTE_USER_UUID_HERE',  -- Paste the UUID from Step 3A
  'super_admin'
);
```

**Part C: Verify**

```sql
-- Check admin was created
SELECT
  ar.user_id,
  ar.role,
  au.email
FROM public.admin_roles ar
JOIN auth.users au ON ar.user_id = au.id;
```

Expected result: Should show your admin user with email and role.

### Step 4: Configure Storage Buckets

In Supabase Dashboard → Storage:

1. Verify buckets exist:
   - `event-images`
   - `speaker-photos`
   - `gallery-photos`
   - `post-images`
   - `sponsor-logos`
   - `documents`
   - `avatars`

2. Configure public access for:
   - `event-images` → Public
   - `speaker-photos` → Public
   - `gallery-photos` → Public
   - `sponsor-logos` → Public

3. Keep private:
   - `documents` → Authenticated only
   - `avatars` → Authenticated only

### Step 5: Deploy Next.js Application

```bash
# Build the application
npm run build

# Test production build locally
npm start

# Deploy to Vercel (or your hosting provider)
vercel --prod

# Or manual deployment
# Upload build files to your hosting provider
```

### Step 6: Update Environment Variables

On your hosting platform (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 7: Test API Endpoints

Use Postman/Insomnia to test all endpoints:

```bash
# Base URL
https://your-production-domain.com

# Test public endpoints (no auth required)
POST /api/subscribe
POST /api/applications/registration
POST /api/applications/call-for-papers
POST /api/contact

GET /api/events
GET /api/speakers
GET /api/faqs
GET /api/sponsors
GET /api/gallery
GET /api/posts

# Test admin authentication
POST /api/auth/login
{
  "email": "admin@indabaxkenya.org",
  "password": "your_admin_password"
}

GET /api/auth/session

# Test protected admin endpoints
GET /api/admin/applications
PATCH /api/admin/applications/[id]

POST /api/auth/logout
```

### Step 8: Populate Initial Data

1. **Events**: Add upcoming IndabaX Kenya events
2. **Speakers**: Add keynote speakers
3. **FAQs**: Add frequently asked questions
4. **Sponsors**: Add sponsor logos and information
5. **Posts**: Add news/announcements
6. **Settings**: Configure site settings

## Post-Deployment Checklist

- [ ] All 13 API endpoints working
- [ ] Form submissions working (registration, CFP, contact, newsletter)
- [ ] Duplicate detection working (try submitting twice)
- [ ] Public content visible (events, speakers, FAQs, sponsors, gallery)
- [ ] Admin user can login
- [ ] Storage buckets accessible
- [ ] Production domain configured
- [ ] SSL certificate active
- [ ] Analytics tracking (if configured)

## Rollback Plan

If issues occur:

1. **Database Issues**:
   - Restore from backup
   - Re-run specific migration that failed
   - Check Supabase logs for errors

2. **Application Issues**:
   - Revert to previous Vercel deployment
   - Check application logs
   - Verify environment variables

3. **Emergency Contacts**:
   - Development team
   - Supabase support
   - Hosting provider support

## Monitoring

After deployment, monitor:

- Supabase Dashboard → Logs
- Application error tracking (Sentry, etc.)
- Form submission success rates
- API response times
- Database query performance

## Troubleshooting

### Issue: RLS policy errors on form submission

**Solution**: Verify policies exist and have correct roles:

```sql
SELECT tablename, policyname, roles
FROM pg_policies
WHERE tablename IN ('applications', 'contact_submissions', 'subscribers');
```

### Issue: Duplicate submissions not being detected

**Solution**: Verify unique indexes exist:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'applications' AND indexname LIKE '%unique%';
```

### Issue: Cannot connect to Supabase

**Solution**: Verify environment variables and Supabase project status

## Support

For issues during deployment:
- Check Supabase documentation
- Review migration logs
- Contact development team
- Supabase community support

## Success Criteria

Deployment is successful when:
✅ All migrations completed without errors
✅ All API endpoints return expected responses
✅ Forms can be submitted by anonymous users
✅ Duplicate submissions are rejected
✅ Admin can access protected resources
✅ Public can view published content
