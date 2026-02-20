# Running the Database Migration - Step by Step Guide

**File:** `supabase/migrations/20251020_initial_schema.sql`

**Lines:** 748 lines

**Time Required:** ~5 minutes

---

## 📋 WHAT THIS MIGRATION DOES

✅ Creates 15 database tables
✅ Creates 45+ indexes for performance
✅ Enables Row Level Security on all tables
✅ Creates 30+ RLS policies for security
✅ Inserts seed data (1 event, 2 speakers, 1 post, 3 FAQs, 2 settings)
✅ Sets up triggers for auto-updating timestamps

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Click on your project: **pqndsvfoobctutaeyleq**
3. Navigate to: **SQL Editor** (left sidebar)

### Step 2: Open the Migration File

In your local terminal:
```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website
cat supabase/migrations/20251020_initial_schema.sql
```

**OR** open the file in your code editor and select all (Ctrl+A / Cmd+A)

### Step 3: Copy the Migration SQL

Copy the **entire contents** of the file (all 748 lines)

### Step 4: Paste into SQL Editor

1. In Supabase Dashboard → SQL Editor
2. Click "+ New query" button
3. Paste the entire SQL migration
4. **Optional:** Name the query "Initial Schema Migration" for reference

### Step 5: Run the Migration

1. Click the **"RUN"** button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for execution (~10-30 seconds)
3. Watch for the success message

### Step 6: Verify Success

You should see output similar to:
```
Success. No rows returned
NOTICE: Migration complete! Created 15 tables.
```

---

## ✅ VALIDATION QUERIES

After running the migration, verify everything worked:

### 1. Count Tables Created
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```
**Expected:** 15

### 2. List All Tables
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
**Expected:** admin_roles, applications, contact_submissions, event_speakers, events, faqs, photos, posts, schedule_items, settings, speakers, sponsors, static_content, subscribers, team_members

### 3. Verify RLS Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
**Expected:** All tables show `t` (true) for rowsecurity

### 4. Count Indexes
```sql
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public';
```
**Expected:** ~45-50 indexes

### 5. Check Seed Data

**Events:**
```sql
SELECT slug, title, status FROM events;
```
**Expected:** 1 row (indabax-kenya-2026)

**Speakers:**
```sql
SELECT name, organization FROM speakers;
```
**Expected:** 2 rows (Dr. Jane Mwangi, Prof. James Odhiambo)

**Posts:**
```sql
SELECT slug, title, status FROM posts;
```
**Expected:** 1 row (welcome-indabax-2026)

**FAQs:**
```sql
SELECT COUNT(*) FROM faqs WHERE is_active = true;
```
**Expected:** 3

**Settings:**
```sql
SELECT key FROM settings;
```
**Expected:** 2 rows (popup, site_info)

**Sponsors:**
```sql
SELECT name, tier FROM sponsors WHERE is_active = true;
```
**Expected:** 2 rows (DeepLearning.AI - platinum, Google Research - gold)

### 6. Test is_admin() Function
```sql
SELECT is_admin();
```
**Expected:** false (you're not logged in yet)

---

## 🔍 DETAILED VERIFICATION

### Check Events Table Structure
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
**Expected:** ~30 policies

### Verify Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```
**Expected:** 7 triggers (update_*_updated_at)

---

## ❌ TROUBLESHOOTING

### Error: "relation already exists"
**Cause:** Tables were partially created before
**Solution:** Run rollback first (see below), then re-run migration

### Error: "permission denied"
**Cause:** Using anon key instead of service role
**Solution:** You're in SQL Editor with full access - this shouldn't happen

### Error: "function auth.uid() does not exist"
**Cause:** Running in wrong database or auth schema missing
**Solution:** Verify you're in the correct Supabase project

### Warning: "NOTICE: relation does not exist, skipping"
**Cause:** DROP TABLE IF EXISTS in rollback (safe to ignore)
**Solution:** Continue with migration

---

## 🔄 ROLLBACK (If Needed)

If migration fails and you need to start over:

```sql
-- Drop all tables (cascade removes dependencies)
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

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS is_admin();
```

Then re-run the migration from Step 1.

---

## 📊 EXPECTED OUTCOME

After successful migration:

| Item | Expected | Status |
|------|----------|--------|
| Tables Created | 15 | ⏳ |
| Indexes Created | ~45 | ⏳ |
| RLS Enabled | All tables | ⏳ |
| RLS Policies | ~30 | ⏳ |
| Seed Events | 1 | ⏳ |
| Seed Speakers | 2 | ⏳ |
| Seed Posts | 1 | ⏳ |
| Seed FAQs | 3 | ⏳ |
| Seed Settings | 2 | ⏳ |
| Seed Sponsors | 2 | ⏳ |
| Functions | 2 | ⏳ |
| Triggers | 7 | ⏳ |

---

## ✅ COMPLETION CHECKLIST

After running migration, verify:

- [ ] No errors in SQL Editor output
- [ ] "NOTICE: Migration complete! Created 15 tables." message shown
- [ ] All validation queries return expected counts
- [ ] Seed data visible in tables
- [ ] RLS enabled on all tables
- [ ] is_admin() function works

---

## 🎯 NEXT STEPS

Once migration is complete:

1. ✅ Mark "Run migration" as complete
2. ➡️ Move to: Create storage buckets
3. ➡️ Then: Create admin user
4. ➡️ Finally: Test entire setup

---

**Ready to run?** Open Supabase Dashboard and follow the steps above!

**Estimated Time:** 5 minutes
**Difficulty:** Easy (copy-paste operation)
**Reversible:** Yes (rollback available)
