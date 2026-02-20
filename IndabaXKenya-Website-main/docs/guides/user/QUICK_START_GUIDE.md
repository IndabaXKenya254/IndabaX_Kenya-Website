# 🚀 QUICK START GUIDE - IndabaX Kenya Website

**Complete setup guide for getting the database, API, and mock data migration running.**

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Create Admin User](#create-admin-user)
5. [Run Data Migration](#run-data-migration)
6. [Verify Everything Works](#verify-everything-works)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

---

## ✅ PREREQUISITES

Before starting, ensure you have:

- ✅ **Node.js 18+** installed (`node --version`)
- ✅ **npm** or **yarn** installed
- ✅ **Supabase account** (free tier works)
- ✅ **Supabase project** created (or access to existing project)
- ✅ **Git** installed (optional, for version control)

---

## 🔧 INITIAL SETUP

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd indabax-kenya-website

# Install all dependencies
npm install

# This will install:
# - Next.js, React, TypeScript
# - Supabase client
# - Zod (validation)
# - tsx (for running TypeScript scripts)
# - All other dependencies
```

### Step 2: Configure Environment Variables

Create `.env.local` file in the project root:

```bash
# Copy example (if exists)
cp .env.example .env.local

# Or create new file
touch .env.local
```

Add the following variables to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these values:**

1. Go to your Supabase project dashboard
2. Click on **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANT:** Never commit `.env.local` to git! It's in `.gitignore` by default.

---

## 🗄️ DATABASE SETUP

### Step 1: Execute Database Migrations

You need to run 3 SQL migration files in order. Go to your Supabase Dashboard:

1. Open **SQL Editor**
2. Click **New Query**
3. Copy and paste each migration file
4. Click **Run**

#### Migration 1: Add Missing Columns

**File:** `supabase/migrations/20251023_phase1_add_missing_columns.sql`

```bash
# Open this file and copy its contents
cat supabase/migrations/20251023_phase1_add_missing_columns.sql
```

Paste into Supabase SQL Editor and run. You should see:
```
✅ Phase 1 Complete: 8 columns added
```

#### Migration 2: Create Tag System

**File:** `supabase/migrations/20251023_phase2_tag_system.sql`

```bash
cat supabase/migrations/20251023_phase2_tag_system.sql
```

Paste and run. You should see:
```
✅ Phase 2 Complete: 4 tables created, 44 tags seeded
```

#### Migration 3: Create Relationships

**File:** `supabase/migrations/20251023_phase3_relationships.sql`

```bash
cat supabase/migrations/20251023_phase3_relationships.sql
```

Paste and run. You should see:
```
✅ Phase 3 Complete: 3 tables created, 60+ expertise areas seeded
```

### Step 2: Verify Tables Created

In Supabase Dashboard, go to **Table Editor**. You should see:

**Original Tables:**
- events
- posts
- speakers
- sponsors
- photos
- faqs
- profiles
- (other existing tables)

**New Tables (from migrations):**
- event_tags
- event_tag_relations
- post_tags
- post_tag_relations
- event_speakers
- speaker_expertise
- speaker_expertise_relations

**Total:** 14+ tables

---

## 👤 CREATE ADMIN USER

You need at least one admin user to run the migration script (for post authorship).

### Method 1: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - **Email:** your-email@example.com
   - **Password:** Choose a secure password
   - **Auto Confirm User:** ✅ Check this
4. Click **Create User**

5. Go to **SQL Editor** and run:

```sql
-- Make the user an admin
UPDATE profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

### Method 2: Via SQL Only

```sql
-- If profiles table has insert policy for authenticated users:
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@indabax-kenya.org',
  crypt('your-secure-password', gen_salt('bf')),
  NOW()
);

-- Then make them admin
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@indabax-kenya.org';
```

### Verify Admin User Exists

```sql
-- Run this query
SELECT id, email, is_admin
FROM profiles
WHERE is_admin = true;
```

You should see at least one row with `is_admin = true`.

---

## 📦 RUN DATA MIGRATION

Now that the database is set up and you have an admin user, you can import the mock data.

### Step 1: Run Migration Script

```bash
npm run migrate:mock-data
```

### Step 2: Watch the Output

You should see detailed progress:

```
═══════════════════════════════════════════════════════════════════════
  INDABAX KENYA - MOCK DATA MIGRATION
═══════════════════════════════════════════════════════════════════════

📂 Mock data directory: /path/to/lib/mock-data
🔗 Supabase URL: https://your-project.supabase.co

⏳ Starting migration...

📢 Migrating speakers...
  ✓ Imported: Dr. Amina Wanjiru
  ✓ Imported: Prof. David Odhiambo
  ✓ Imported: Dr. Zainab Abiola
  ... (17 more)
✅ Speakers migrated: 20/20

🎉 Migrating events...
  ✓ Imported: IndabaX Kenya 2026
  ✓ Imported: NOAI Pre-Conference Workshop
  ✓ Imported: AI for Healthcare Symposium
  ... (3 more)
✅ Events migrated: 6/6

📝 Migrating posts...
  ✓ Imported: IndabaX Kenya 2026 Registration Now Open!
  ✓ Imported: Announcing Our 2026 Keynote Speakers
  ... (8 more)
✅ Posts migrated: 10/10

📷 Migrating photos...
✅ Photos migrated: 30/30

❓ Migrating FAQs...
✅ FAQs migrated: 15/15

🤝 Migrating sponsors...
  ✓ Imported: Deep Learning Indaba
  ✓ Imported: Google
  ✓ Imported: Microsoft
  ... (5 more)
✅ Sponsors migrated: 8/8

═══════════════════════════════════════════════════════════════════════
  MIGRATION COMPLETE
═══════════════════════════════════════════════════════════════════════

📊 Summary:
   Event Tags Created: 27
   Post Tags Created: 17
   Expertise Areas Created: 60
   Speakers: 20
   Events: 6
   Posts: 10
   Photos: 30
   FAQs: 15
   Sponsors: 8

⏱️  Duration: 12.34s

✅ No errors!

═══════════════════════════════════════════════════════════════════════
```

### Step 3: Verify Import Success

If you see "No errors!" - great! Your data is imported.

If you see errors, check the [Troubleshooting](#troubleshooting) section below.

---

## ✅ VERIFY EVERYTHING WORKS

### 1. Check Database Tables

Go to Supabase Dashboard → **Table Editor**:

**Check Speakers Table:**
- Should have ~20 records
- Check one record has `country`, `bio_short`, etc.

**Check Events Table:**
- Should have ~6 records
- Check fields like `excerpt`, `start_date`, `is_featured`

**Check event_tag_relations Table:**
- Should have multiple records
- Each record links an event to a tag

**Check speaker_expertise_relations Table:**
- Should have multiple records
- Each record links a speaker to expertise area

### 2. Test API Endpoints (Optional)

If you want to verify the API works:

```bash
# Start the dev server
npm run dev

# In another terminal, test an endpoint
curl http://localhost:3000/api/admin/events
# Should return: {"success":false,"error":"Unauthorized"} (expected - needs auth)
```

### 3. Check Tag Tables

**Event Tags:**
```sql
SELECT COUNT(*) FROM event_tags;
-- Should return ~27
```

**Post Tags:**
```sql
SELECT COUNT(*) FROM post_tags;
-- Should return ~17
```

**Speaker Expertise:**
```sql
SELECT COUNT(*) FROM speaker_expertise;
-- Should return ~60+
```

---

## 🐛 TROUBLESHOOTING

### Error: "Missing environment variables"

**Problem:** `.env.local` not found or variables not set.

**Solution:**
```bash
# Check file exists
ls -la .env.local

# Check contents
cat .env.local

# Make sure these are set:
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

### Error: "No admin user found"

**Problem:** No user with `is_admin = true` in database.

**Solution:**
```sql
-- Create admin user
UPDATE profiles
SET is_admin = true
WHERE email = 'your-email@example.com';

-- Verify
SELECT * FROM profiles WHERE is_admin = true;
```

### Error: "Failed to insert speaker/event/post"

**Problem:** Database migrations not executed or constraint violation.

**Solution:**
1. Check all 3 migrations were executed
2. Check error message for specific issue
3. Look for duplicate slugs or missing columns

### Error: "relation does not exist"

**Problem:** Migration tables not created.

**Solution:**
- Re-run the migration SQL files in order
- Check Supabase SQL Editor for errors
- Verify you're in the right project

### Error: "permission denied"

**Problem:** RLS policies blocking access.

**Solution:**
- Script uses service role key which should bypass RLS
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key, not anon key
- Check Supabase Dashboard → Settings → API

### Migration runs but with errors

**Problem:** Some records failed to import.

**Solution:**
- Check the error list at the end of migration output
- Common issues:
  - Duplicate slugs (already exists)
  - Missing required fields
  - Invalid data format
- Fix data in mock JSON files and re-run

---

## 🎯 NEXT STEPS

### Immediate (Testing):

1. **Explore the data** in Supabase Dashboard
2. **Test API endpoints** (requires authentication)
3. **Verify relationships** are correctly linked

### Short-term (Development):

4. **Admin UI Integration:**
   - Add tag selectors to event/post forms
   - Add speaker selectors to event forms
   - Add expertise selectors to speaker forms

5. **Frontend Updates:**
   - Switch from mock data to API calls
   - Display tags on event/post cards
   - Show speaker expertise badges

6. **Authentication Setup:**
   - Configure Supabase Auth in the app
   - Set up admin login flow
   - Protect admin routes

### Medium-term (Production):

7. **Deploy to Vercel/Netlify**
8. **Run migrations on production database**
9. **Configure production environment variables**
10. **Test end-to-end**

---

## 📚 DOCUMENTATION REFERENCE

For more details, see:

- **`MOCK_DATA_VALIDATION_REPORT.md`** - Initial analysis
- **`PHASE4_API_UPDATES.md`** - API endpoints documentation
- **`PHASE5_INDIVIDUAL_ENDPOINTS.md`** - Individual record APIs
- **`PHASE6_TAG_MANAGEMENT.md`** - Tag management APIs
- **`PHASE7_DATA_MIGRATION.md`** - Migration script details
- **`scripts/README.md`** - Migration script usage
- **`API_MIGRATION_COMPLETE.md`** - Complete overview

---

## 🎉 SUCCESS!

If you've reached this point with no errors:

✅ Database is set up with all necessary tables
✅ Mock data is imported
✅ Relationships are created
✅ API endpoints are ready
✅ You're ready to build the admin UI!

**Total time:** ~30-45 minutes (including reading)

---

## 💡 TIPS

1. **Backup First:** Before running migrations in production, backup your database
2. **Test Locally:** Test everything on a development database first
3. **Version Control:** Commit your changes after each phase
4. **Environment Variables:** Never commit `.env.local` to git
5. **Service Role Key:** Keep this secret - it has full database access

---

## 🆘 NEED HELP?

If you encounter issues not covered in troubleshooting:

1. Check Supabase logs: Dashboard → Logs
2. Review migration error messages
3. Verify environment variables
4. Check database constraints
5. Review phase documentation for details

---

**Last Updated:** 2025-10-23
**Version:** 1.0
**Status:** ✅ Production Ready
