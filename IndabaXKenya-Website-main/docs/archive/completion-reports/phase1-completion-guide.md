# Phase 1 Completion Guide

**Project:** IndabaX Kenya - Registration System Redesign
**Phase:** Database Migration (Phase 1)
**Status:** Migration Run Complete
**Date:** 2025-11-20

---

## ✅ Completed Steps

- [x] Created migration SQL file with 12 new tables
- [x] Created storage buckets manually (tickets, form-uploads, papers)
- [x] Ran SQL migration successfully

---

## 🔍 Step 1: Verify Migration Results

### Run Verification Script

**File:** `supabase/verify-migration.sql`

1. Open Supabase Dashboard
2. Go to: **SQL Editor**
3. Click: **"New query"**
4. Copy-paste the entire contents of `supabase/verify-migration.sql`
5. Click: **"Run"**

### Expected Results

The verification script will check:

✓ **12 tables created:**
- user_profiles, registrations, form_templates, form_questions
- form_responses, form_answers, review_locks, reviewers
- email_templates, email_logs, tickets, papers

✓ **6 ENUMs created:**
- user_role, registration_status, question_type
- response_status, email_status, paper_status

✓ **~40 indexes created** (for performance)

✓ **3 UNIQUE constraints:**
- registrations (user_id, event_id) - Prevents duplicate registrations
- review_locks (registration_id) - Prevents concurrent reviews
- reviewers (user_id, event_id) - One reviewer per event

✓ **RLS enabled** on all 12 new tables

✓ **~50 RLS policies** for security

✓ **6 storage policies** (tickets, form-uploads, papers)

✓ **3 helper functions:**
- is_admin() - Check if user is admin
- cleanup_expired_locks() - Remove expired locks
- update_updated_at_column() - Auto-update timestamps

✓ **7 triggers** - Auto-update updated_at columns

✓ **Events table modified** - Added initial_template_id, detailed_template_id columns

### What to Look For

**Success Indicators:**
```sql
Migration Status: ✓ SUCCESS - All 12 tables created
ENUMs: ✓ All 6 ENUMs created
RLS Status: ✓ RLS enabled on all 12 tables
Helper Functions: ✓ All 3 functions created
```

**Warning Signs:**
- Missing tables
- RLS not enabled on some tables
- Missing indexes on foreign keys

---

## 📊 Step 2: Run Data Migration

### Before You Begin

**Important Checks:**

1. **Backup existing data** (if not already done)
   ```bash
   # Via Supabase Dashboard: Database > Backups
   # Or download CSV of applications table
   ```

2. **Verify applications table exists**
   ```sql
   SELECT COUNT(*) FROM applications;
   ```

3. **Check for duplicates** (optional)
   ```sql
   SELECT email, COUNT(*) as count
   FROM applications
   GROUP BY email
   HAVING COUNT(*) > 1;
   ```

### Run Migration Script

**File:** `scripts/migrate-applications-to-registrations.ts`

```bash
# Install dependencies if needed
npm install

# Run migration script
tsx scripts/migrate-applications-to-registrations.ts
```

### What the Script Does

1. **Checks** if old `applications` table exists
2. **Fetches** all applications
3. **For each application:**
   - Creates or finds user profile (user_profiles table)
   - Maps old status to new registration_status
   - Creates form_response (with completion timestamps)
   - Creates form_answers (from background + short_answers)
   - Creates registration record (links everything together)
4. **Skips** duplicates (same user + event already registered)
5. **Reports** summary statistics

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║  Data Migration: applications → registrations             ║
╚════════════════════════════════════════════════════════════╝

🔍 Checking for old applications table...
✓ Applications table exists

📥 Fetching applications from old table...
✓ Found 45 applications to migrate

🚀 Starting migration...

═══════════════════════════════════════════════════════════

📝 Migrating: John Doe (john@example.com)
   ✓ Registration created: abc-123-uuid

📝 Migrating: Jane Smith (jane@example.com)
   ℹ️  Created placeholder profile (user must register to access)
   ✓ Registration created: def-456-uuid

...

═══════════════════════════════════════════════════════════

✅ Migration Complete!

📊 Summary:
────────────────────────────────────────────────────────────
   Total applications:      45
   Users created:           30
   Registrations created:   45
   Form responses created:  45
   Form answers created:    120
   Skipped (duplicates):    0
   Errors:                  0
────────────────────────────────────────────────────────────

✓ All applications migrated successfully!
```

### Status Mapping

Old applications had simple status:
- `pending` → `pending`
- `accepted` / `approved` → `approved`
- `rejected` → `rejected`
- `submitted` → `interested`
- `reviewed` → `pending`

---

## 🧪 Step 3: Verify Migrated Data

### Check Registrations Table

```sql
-- Count migrated registrations
SELECT COUNT(*) FROM registrations;

-- Check status distribution
SELECT status, COUNT(*) as count
FROM registrations
GROUP BY status
ORDER BY count DESC;

-- Verify user linking
SELECT
  r.id,
  u.name,
  u.email,
  e.title as event,
  r.status,
  r.registered_at
FROM registrations r
JOIN user_profiles u ON r.user_id = u.id
JOIN events e ON r.event_id = e.id
ORDER BY r.registered_at DESC
LIMIT 10;
```

### Check Form Responses

```sql
-- Count form responses
SELECT COUNT(*) FROM form_responses;

-- Check completion status
SELECT
  fr.id,
  u.name,
  fr.status,
  fr.started_at,
  fr.completed_at
FROM form_responses fr
JOIN user_profiles u ON fr.user_id = u.id
LIMIT 10;
```

### Check Form Answers

```sql
-- Count answers
SELECT COUNT(*) FROM form_answers;

-- Sample answers
SELECT
  fa.id,
  fa.text_answer,
  u.name as user
FROM form_answers fa
JOIN form_responses fr ON fa.response_id = fr.id
JOIN user_profiles u ON fr.user_id = u.id
LIMIT 20;
```

### Verify No Duplicates

```sql
-- This should return 0 rows (UNIQUE constraint prevents duplicates)
SELECT user_id, event_id, COUNT(*) as count
FROM registrations
GROUP BY user_id, event_id
HAVING COUNT(*) > 1;
```

---

## 🎯 Step 4: Test New System

### Test 1: User Profile Creation

**Test via Supabase Dashboard or SQL:**

```sql
-- Insert test user profile
INSERT INTO user_profiles (email, name, role)
VALUES ('test@example.com', 'Test User', 'applicant')
RETURNING id;
```

**Expected:** User created successfully

### Test 2: Registration with Duplicate Prevention

```sql
-- Try to create duplicate registration (should fail)
INSERT INTO registrations (user_id, event_id, status)
VALUES (
  'existing-user-id',
  'existing-event-id',
  'interested'
);
```

**Expected:** `ERROR: duplicate key value violates unique constraint "unique_user_event"`

### Test 3: Review Lock

```sql
-- Create lock
INSERT INTO review_locks (registration_id, locked_by, expires_at)
VALUES (
  'test-registration-id',
  'test-admin-id',
  NOW() + INTERVAL '30 minutes'
);

-- Try to create duplicate lock (should fail)
INSERT INTO review_locks (registration_id, locked_by, expires_at)
VALUES (
  'test-registration-id',
  'another-admin-id',
  NOW() + INTERVAL '30 minutes'
);
```

**Expected:** `ERROR: duplicate key value violates unique constraint "review_locks_registration_id_key"`

### Test 4: RLS Policies

**Test as authenticated user:**

```javascript
// Should only see own profile
const { data, error } = await supabase
  .from('user_profiles')
  .select('*');

// Should only show current user's profile
console.log(data); // Only 1 row
```

**Test as admin:**

```javascript
// Should see all profiles
const { data, error } = await supabase
  .from('user_profiles')
  .select('*');

// Should show all users
console.log(data); // Multiple rows
```

---

## 📋 Step 5: Cleanup Old System

### DO NOT DELETE YET!

Keep the old `applications` table until:

1. ✅ All data verified in new system
2. ✅ Registration flow tested end-to-end
3. ✅ Admin review system tested
4. ✅ Client approves new system
5. ✅ Production deployment successful

### When Ready to Archive

```sql
-- Rename table (don't delete)
ALTER TABLE applications RENAME TO applications_archived;

-- Add comment
COMMENT ON TABLE applications_archived IS
  '[ARCHIVED 2025-XX-XX] Replaced by registrations table. Keep for reference.';

-- Remove from production backups (optional)
-- But keep in one secure backup location
```

---

## 🔧 Troubleshooting

### Migration Script Fails

**Error:** "Missing Supabase credentials"
```bash
# Check .env.local has:
NEXT_PUBLIC_SUPABASE_URL=https://klnspdwlybpwkznzezzd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Error:** "Applications table not found"
```sql
-- Check table exists
SELECT * FROM applications LIMIT 1;
```

**Error:** "Duplicate key violation"
- Migration was already run
- Check registrations table for existing data
- Script automatically skips duplicates

### Data Looks Wrong

**Missing users:**
- Check if auth users exist: `supabase.auth.admin.listUsers()`
- Placeholder profiles created for emails without auth accounts
- Users must register to access their accounts

**Wrong event linked:**
- If application had no event_id, script uses latest event
- Verify with: `SELECT event_id, COUNT(*) FROM registrations GROUP BY event_id`

### RLS Policies Blocking Access

**Can't view data in Supabase Dashboard:**
- Dashboard uses service role (bypasses RLS) - should work
- If using regular client, RLS will block access
- Use service role key for admin operations

---

## ✅ Completion Checklist

Phase 1 is complete when:

- [ ] Verification script shows all green checkmarks
- [ ] Data migration script completes with 0 errors
- [ ] All existing applications migrated to registrations
- [ ] Duplicate prevention tested and working
- [ ] RLS policies tested and working
- [ ] Old applications table kept (not deleted)
- [ ] Migration documented in migration-log.md

---

## 🚀 Next Phase

**Phase 2: Authentication Extension**

Now that the database is ready, we'll:

1. Create user registration flow (email + password)
2. Implement email verification
3. Build user dashboard
4. Add middleware for route protection

**Start when ready!**

---

## 📚 Reference Files

- **Migration SQL:** `supabase/migrations/20251120000000_registration_redesign.sql`
- **Verification Script:** `supabase/verify-migration.sql`
- **Data Migration:** `scripts/migrate-applications-to-registrations.ts`
- **Storage Guide:** `docs/storage-buckets-setup.md`
- **Main Log:** `docs/migration-log.md`

---

**End of Phase 1 Completion Guide**
