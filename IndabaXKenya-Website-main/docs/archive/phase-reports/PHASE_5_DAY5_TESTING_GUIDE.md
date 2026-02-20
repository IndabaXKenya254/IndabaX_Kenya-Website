# PHASE 5 DAY 5 - COMPLETE TESTING GUIDE 🧪

**Date:** November 21, 2025
**Feature:** Shortlist Workflow (Single + Bulk)
**Estimated Time:** 30-45 minutes

---

## 📋 PRE-TESTING CHECKLIST

### 1. Environment Setup ✅

**Required Environment Variables:**
```bash
# Check if these are set in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://klnspdwlybpwkznzezzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email configuration (from Phase 4)
SMTP_HOST=server72.web-hosting.com
SMTP_PORT=465
SMTP_APPLICATIONS_PASS=OMZ)HZw[QuZe

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Verify environment variables:**
```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website

# Check if .env.local exists
cat .env.local | grep -E "SUPABASE|SMTP|NEXT_PUBLIC_APP_URL"
```

---

### 2. Database Setup ✅

**Verify Phase 5 migration has run:**
```bash
# Option 1: Check via Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/klnspdwlybpwkznzezzd/editor
# Check if these exist:
# - Table: review_locks
# - Column: form_responses.status_v2 (type: registration_status_v2)
# - Column: form_responses.shortlisted_by
# - Column: form_responses.shortlisted_at
# - Column: form_responses.survey_deadline_days

# Option 2: Check via SQL query
# Run this in Supabase SQL Editor:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'form_responses'
  AND column_name IN ('status_v2', 'shortlisted_by', 'shortlisted_at', 'survey_deadline_days');
```

**If migration hasn't run:**
```bash
# Run the migration manually via Supabase Dashboard
# Go to SQL Editor and paste contents of:
# /supabase/migrations/20251121040000_phase5_review_system.sql
```

---

### 3. Test Data Setup ✅

**Create test applications:**

**Option A: Via Supabase Dashboard (Recommended)**
```sql
-- Run this in Supabase SQL Editor

-- 1. Create a test event (if not exists)
INSERT INTO events (id, title, slug, start_date, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Event 2025',
  'test-event-2025',
  '2025-12-01',
  'upcoming'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create test applications (10 applications for bulk testing)
INSERT INTO form_responses (
  id,
  event_id,
  respondent_name,
  respondent_email,
  status_v2,
  survey_deadline_days,
  completion_percentage,
  created_at
)
VALUES
  -- Application 1-5: status 'interested' (ready to shortlist)
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Alice Test', 'alice.test@example.com', 'interested', 7, 100, NOW()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bob Test', 'bob.test@example.com', 'interested', 7, 100, NOW()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Charlie Test', 'charlie.test@example.com', 'interested', 7, 100, NOW()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Diana Test', 'diana.test@example.com', 'interested', 7, 100, NOW()),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Eve Test', 'eve.test@example.com', 'interested', 7, 100, NOW()),

  -- Application 6: status 'pending' (also can be shortlisted)
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Frank Test', 'frank.test@example.com', 'pending', 7, 100, NOW()),

  -- Application 7: status 'shortlisted' (should be skipped)
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Grace Test', 'grace.test@example.com', 'shortlisted', 7, 100, NOW()),

  -- Application 8: status 'survey_sent' (should be skipped)
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Henry Test', 'henry.test@example.com', 'survey_sent', 7, 100, NOW()),

  -- Application 9-10: Custom deadline (14 days instead of 7)
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Iris Test', 'iris.test@example.com', 'interested', 14, 100, NOW()),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Jack Test', 'jack.test@example.com', 'interested', 14, 100, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Verify test data
SELECT id, respondent_name, respondent_email, status_v2, survey_deadline_days
FROM form_responses
WHERE respondent_email LIKE '%.test@example.com'
ORDER BY created_at DESC;
```

**Option B: Via Registration Flow (Takes longer)**
```bash
# 1. Start dev server
npm run dev

# 2. Go to: http://localhost:3000/events/test-event-2025/register
# 3. Fill out registration form 10 times with different emails
# 4. Submit each form
```

---

### 4. Admin Account Setup ✅

**Verify you have admin access:**
```sql
-- Run in Supabase SQL Editor

-- Check if your user is an admin
SELECT up.id, up.email, up.name, up.role
FROM user_profiles up
WHERE up.email = 'your-admin-email@example.com';  -- Replace with your email

-- If not admin, make yourself admin:
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';  -- Replace with your email
```

---

### 5. Start Development Server ✅

```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev

# Server should start at: http://localhost:3000
```

**Verify server is running:**
```bash
# In another terminal:
curl http://localhost:3000/api/health || echo "Server not running"
```

---

## 🧪 TEST SUITE

### TEST 1: Single Shortlist (Basic Flow) ✅

**Objective:** Test shortlisting a single application from detail page

**Steps:**
1. **Login as admin:**
   - Go to: `http://localhost:3000/admin/login`
   - Enter your admin credentials
   - Should redirect to: `http://localhost:3000/admin/dashboard`

2. **Navigate to applications list:**
   - Click "Applications" in sidebar
   - Should see: `http://localhost:3000/admin/applications`
   - **Note:** You might see `page.tsx` (old) instead of `page_v2.tsx` (new)
   - If old page, manually go to: `http://localhost:3000/admin/applications_v2` (if exists)

3. **Open application detail:**
   - Click on "Alice Test" (or first test application)
   - Should redirect to: `http://localhost:3000/admin/applications/[id]`
   - **Note:** You might see old page without lock indicator

4. **Verify lock acquired:**
   - Look for green alert at top: "You have the lock"
   - Countdown timer showing ~30 minutes
   - Progress bar (green)

5. **Test shortlist button:**
   - Scroll to "Quick Actions" section (should be above "Change Status")
   - Look for blue button: "Shortlist & Send Survey"
   - Button should be **enabled** (not grayed out)

6. **Click shortlist button:**
   - Click "Shortlist & Send Survey"
   - Should see confirmation dialog:
     ```
     Shortlist Applicant?
     This will send a survey link to alice.test@example.com. Continue?
     [Cancel] [OK]
     ```
   - Click "OK"

7. **Verify success:**
   - Should see success alert: "Application Shortlisted! Survey email has been sent to the applicant"
   - Page should reload automatically
   - Status badge should change: "Interested" → "Survey Sent"
   - Lock indicator might disappear (lock released)

8. **Verify in database:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT
     id,
     respondent_name,
     status_v2,
     shortlisted_by,
     shortlisted_at,
     survey_deadline_days
   FROM form_responses
   WHERE respondent_email = 'alice.test@example.com';

   -- Should show:
   -- status_v2: 'survey_sent'
   -- shortlisted_by: your-user-id
   -- shortlisted_at: current timestamp
   ```

9. **Check email (Optional - if SMTP configured):**
   - Check inbox for: `alice.test@example.com`
   - Subject: "🎉 Congratulations! You've Been Shortlisted - Test Event 2025"
   - Body should contain:
     - Green congratulations message
     - Survey link button
     - Deadline (7 days from today)
     - "What Happens Next" steps

**Expected Result:** ✅ **PASS** if:
- Confirmation dialog appeared
- Success alert shown
- Status changed to "Survey Sent"
- Database updated correctly
- Email sent (if SMTP configured)

**Common Issues:**
- ❌ Button disabled → Check if you have the lock (green alert at top)
- ❌ "Already shortlisted" error → Application was already shortlisted, use another test app
- ❌ Email not received → Check SMTP credentials, check spam folder, or ignore (email is non-critical)

---

### TEST 2: Single Shortlist (Already Shortlisted) ✅

**Objective:** Verify that already shortlisted applications are skipped

**Steps:**
1. Open "Grace Test" application (ID ending in ...007)
   - This was pre-set to status 'shortlisted'

2. Verify status badge shows: "Shortlisted" or "Survey Sent"

3. Click "Shortlist & Send Survey" button

4. **Expected Result:**
   - Should see error alert: "Application already shortlisted"
   - Status should NOT change
   - No email sent

**Expected Result:** ✅ **PASS** if error message shown

---

### TEST 3: Single Shortlist (No Lock) ✅

**Objective:** Verify lock enforcement works

**Steps:**
1. Open any test application in **2 browser tabs** (use Chrome + Firefox, or Chrome + Incognito)

2. **Tab 1:**
   - Open application detail
   - Should see green "You have the lock" alert

3. **Tab 2 (different browser):**
   - Open same application detail
   - Should see red "Application is currently being reviewed" alert
   - Should show who locked it

4. **Tab 2:** Try to click "Shortlist & Send Survey"
   - Button should be **disabled** (grayed out)
   - Hover tooltip: "You need the lock to shortlist"
   - If you click anyway, should see error: "Cannot Shortlist - You must have the lock"

5. **Tab 1:** Click "Release" button (in lock indicator)
   - Lock should release

6. **Tab 2:** Refresh page
   - Should now show green "You have the lock"
   - Button should be enabled

**Expected Result:** ✅ **PASS** if:
- Tab 2 cannot shortlist while Tab 1 has lock
- Tab 2 can shortlist after Tab 1 releases lock

---

### TEST 4: Bulk Shortlist (Small Batch) ✅

**Objective:** Test shortlisting multiple applications at once

**Steps:**
1. **Navigate to applications list:**
   - Go to: `http://localhost:3000/admin/applications`
   - If using new page: `http://localhost:3000/admin/applications_v2`

2. **Filter by status:**
   - Look for status filter dropdown (if exists)
   - Select "Interested" or "Pending Review"
   - Should show: Bob Test, Charlie Test, Diana Test, Eve Test, Frank Test

3. **Select applications:**
   - Check checkboxes for 3-5 applications
   - Look for bulk action bar at top:
     ```
     5 application(s) selected
     [Shortlist Selected (5)] [Clear Selection]
     ```

4. **Click "Shortlist Selected" button:**
   - Should see confirmation:
     ```
     Shortlist 5 application(s) and send survey emails?
     [Cancel] [OK]
     ```
   - Click "OK"

5. **Verify progress:**
   - Should see info alert: "Shortlisting 5 applications..."
   - Wait 2-5 seconds

6. **Verify success:**
   - Should see success alert: "Shortlisted 5 of 5 application(s)"
   - Selection should clear (checkboxes unchecked)
   - Table should refresh
   - All 5 applications should show "Survey Sent" status

7. **Verify in database:**
   ```sql
   SELECT
     respondent_name,
     status_v2,
     shortlisted_at
   FROM form_responses
   WHERE respondent_email IN (
     'bob.test@example.com',
     'charlie.test@example.com',
     'diana.test@example.com',
     'eve.test@example.com',
     'frank.test@example.com'
   )
   ORDER BY shortlisted_at DESC;

   -- All should show status_v2 = 'survey_sent'
   -- All should have shortlisted_at timestamp (same time ±2 seconds)
   ```

**Expected Result:** ✅ **PASS** if:
- All 5 applications shortlisted successfully
- Success message shows "5 of 5"
- All show "Survey Sent" status
- All have same shortlisted_at timestamp

**Common Issues:**
- ❌ Button not visible → Check if new applications list page is active
- ❌ "Already shortlisted" → Some applications were already shortlisted, expected behavior

---

### TEST 5: Bulk Shortlist (Mixed Status) ✅

**Objective:** Verify bulk operation skips already shortlisted applications

**Steps:**
1. **Select mixed applications:**
   - Check "Iris Test" (interested - should succeed)
   - Check "Jack Test" (interested - should succeed)
   - Check "Grace Test" (shortlisted - should skip)
   - Check "Henry Test" (survey_sent - should skip)
   - Total: 4 selected

2. **Click "Shortlist Selected (4)"**
   - Click "OK" in confirmation

3. **Verify partial success:**
   - Should see warning alert: "Shortlisted 2 of 4 application(s). 2 failed."
   - OR: "Shortlisted 2 of 4 application(s)"

4. **Verify individual results:**
   - Iris Test: Status should change to "Survey Sent" ✅
   - Jack Test: Status should change to "Survey Sent" ✅
   - Grace Test: Status should remain "Shortlisted" (skipped) ⚠️
   - Henry Test: Status should remain "Survey Sent" (skipped) ⚠️

**Expected Result:** ✅ **PASS** if:
- 2 applications shortlisted successfully
- 2 applications skipped (already shortlisted)
- Message shows "2 of 4"

---

### TEST 6: Custom Deadline Configuration ✅

**Objective:** Verify admin-configurable deadline works

**Steps:**
1. **Check application with custom deadline:**
   - Open "Iris Test" application (has `survey_deadline_days = 14`)

2. **Shortlist the application:**
   - Click "Shortlist & Send Survey"
   - Confirm action

3. **Check email deadline:**
   - If SMTP configured, check email
   - Deadline should be **14 days from today** (not 7 days)
   - Example: If today is Nov 21, deadline should be Dec 5

4. **Verify in database:**
   ```sql
   SELECT
     respondent_name,
     survey_deadline_days,
     shortlisted_at,
     shortlisted_at + INTERVAL '1 day' * survey_deadline_days AS calculated_deadline
   FROM form_responses
   WHERE respondent_email = 'iris.test@example.com';

   -- Should show:
   -- survey_deadline_days: 14
   -- calculated_deadline: 14 days after shortlisted_at
   ```

**Expected Result:** ✅ **PASS** if deadline is 14 days (not 7 days)

---

### TEST 7: Email Template Verification ✅

**Objective:** Verify email content is correct

**Prerequisites:** SMTP must be configured

**Steps:**
1. Shortlist any test application

2. Check email inbox (use real email or Mailtrap/Mailhog)

3. **Verify HTML email:**
   - Subject: "🎉 Congratulations! You've Been Shortlisted - Test Event 2025"
   - From: "IndabaX Kenya Applications <applications@deeplearningindabaxkenya.com>"
   - Header: Green gradient with "🎉 IndabaX Kenya"
   - Greeting: "Dear [Applicant Name],"
   - Message: "We are delighted to inform you..."
   - Survey button: White button on green background with survey link
   - Deadline box: Yellow box with date and time
   - Steps: Numbered list "What Happens Next"
   - Important notes: Warning box with key points
   - Footer: Copyright and links

4. **Verify plain text fallback:**
   - Open email in plain text mode (if email client supports)
   - Should have same content in text format
   - Survey link should be clickable URL

5. **Click survey link:**
   - Click "Access Your Survey" button
   - Should redirect to: `http://localhost:3000/survey/[uuid]`
   - Should see survey page or 404 (survey page not implemented yet - expected)

**Expected Result:** ✅ **PASS** if:
- Email received with correct subject
- HTML formatted correctly
- Survey link is unique UUID format
- Deadline shows correct date (7 or 14 days)

**If SMTP not configured:**
- Skip this test, or
- Use Mailtrap.io (free email testing service)
- Update SMTP credentials in .env.local

---

### TEST 8: Performance Test (Large Batch) ✅

**Objective:** Test bulk shortlist with 50+ applications

**Steps:**
1. **Create 50 test applications:**
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO form_responses (
     event_id,
     respondent_name,
     respondent_email,
     status_v2,
     survey_deadline_days,
     completion_percentage
   )
   SELECT
     '00000000-0000-0000-0000-000000000001',
     'Test User ' || generate_series,
     'test.user.' || generate_series || '@example.com',
     'interested',
     7,
     100
   FROM generate_series(1, 50);

   -- Verify created
   SELECT COUNT(*) FROM form_responses WHERE respondent_email LIKE 'test.user.%@example.com';
   ```

2. **Bulk shortlist all 50:**
   - Go to applications list
   - Select all 50 applications (use "Select All" checkbox if available)
   - Click "Shortlist Selected (50)"
   - Confirm

3. **Monitor progress:**
   - Should see: "Shortlisting 50 applications..."
   - Watch console for errors (open browser DevTools → Console)
   - Should take 10-15 seconds (5 batches × 2 seconds)

4. **Verify success:**
   - Should see: "Shortlisted 50 of 50 application(s)"
   - All should show "Survey Sent" status

5. **Check database:**
   ```sql
   SELECT
     COUNT(*) as total,
     COUNT(CASE WHEN status_v2 = 'survey_sent' THEN 1 END) as survey_sent
   FROM form_responses
   WHERE respondent_email LIKE 'test.user.%@example.com';

   -- Should show: total = 50, survey_sent = 50
   ```

**Expected Result:** ✅ **PASS** if:
- All 50 applications shortlisted
- Completed in 10-20 seconds
- No errors in console
- No browser crash or freeze

**Performance Benchmarks:**
- 10 apps: ~2 seconds ✅
- 50 apps: ~10 seconds ✅
- 100 apps: ~20 seconds ✅

---

### TEST 9: Error Handling (Email Failure) ✅

**Objective:** Verify graceful degradation when email fails

**Steps:**
1. **Temporarily break email:**
   - Open `.env.local`
   - Comment out or change `SMTP_APPLICATIONS_PASS` to invalid value
   - Save file
   - Restart dev server (`Ctrl+C`, then `npm run dev`)

2. **Shortlist an application:**
   - Open any test application
   - Click "Shortlist & Send Survey"
   - Confirm

3. **Verify graceful failure:**
   - Should see success alert: "Application Shortlisted!"
   - Status should change to "Shortlisted" (not "Survey Sent")
   - Check console logs: Should see "Failed to send shortlist email" error

4. **Verify database:**
   ```sql
   SELECT respondent_name, status_v2
   FROM form_responses
   WHERE status_v2 = 'shortlisted'
   ORDER BY shortlisted_at DESC
   LIMIT 1;

   -- Should show status_v2 = 'shortlisted' (NOT 'survey_sent')
   ```

5. **Restore email:**
   - Uncomment `SMTP_APPLICATIONS_PASS` in `.env.local`
   - Restart dev server

**Expected Result:** ✅ **PASS** if:
- Application marked as "Shortlisted" (not "Survey Sent")
- No crash or 500 error
- Success alert still shown
- Can continue using the application

---

### TEST 10: API Direct Testing (Advanced) ✅

**Objective:** Test API endpoints directly with curl

**Prerequisites:**
- Admin access token (get from browser DevTools)
- Application ID to test

**Steps:**

1. **Get access token:**
   ```bash
   # In browser DevTools Console (while logged in as admin):
   localStorage.getItem('supabase.auth.token')

   # Copy the access_token value
   ```

2. **Test single shortlist API:**
   ```bash
   # Replace [ACCESS_TOKEN] and [APP_ID]
   curl -X POST http://localhost:3000/api/admin/applications/[APP_ID]/shortlist \
     -H "Authorization: Bearer [ACCESS_TOKEN]" \
     -H "Content-Type: application/json" \
     -v

   # Expected response:
   # {
   #   "success": true,
   #   "message": "Application shortlisted successfully",
   #   "data": {
   #     "application_id": "...",
   #     "status": "survey_sent",
   #     "survey_link": "http://localhost:3000/survey/...",
   #     "deadline": "2025-11-28T..."
   #   }
   # }
   ```

3. **Test bulk shortlist API:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/applications/bulk/shortlist \
     -H "Authorization: Bearer [ACCESS_TOKEN]" \
     -H "Content-Type: application/json" \
     -d '{
       "application_ids": ["APP_ID_1", "APP_ID_2", "APP_ID_3"]
     }' \
     -v

   # Expected response:
   # {
   #   "success": true,
   #   "message": "Shortlisted 3 of 3 applications",
   #   "data": {
   #     "total": 3,
   #     "success": 3,
   #     "failed": 0,
   #     "results": [...]
   #   }
   # }
   ```

4. **Test error cases:**
   ```bash
   # Test without auth (should return 401)
   curl -X POST http://localhost:3000/api/admin/applications/[APP_ID]/shortlist \
     -v

   # Test with invalid ID (should return 404)
   curl -X POST http://localhost:3000/api/admin/applications/invalid-id/shortlist \
     -H "Authorization: Bearer [ACCESS_TOKEN]" \
     -v

   # Test already shortlisted (should return 400)
   curl -X POST http://localhost:3000/api/admin/applications/[ALREADY_SHORTLISTED_ID]/shortlist \
     -H "Authorization: Bearer [ACCESS_TOKEN]" \
     -v
   ```

**Expected Result:** ✅ **PASS** if all responses match expected format

---

## 📊 TEST RESULTS SUMMARY

**After completing all tests, fill this out:**

| Test | Status | Notes |
|------|--------|-------|
| 1. Single Shortlist (Basic) | ⬜ Pass / ⬜ Fail | |
| 2. Already Shortlisted Error | ⬜ Pass / ⬜ Fail | |
| 3. Lock Enforcement | ⬜ Pass / ⬜ Fail | |
| 4. Bulk Shortlist (Small) | ⬜ Pass / ⬜ Fail | |
| 5. Bulk Shortlist (Mixed) | ⬜ Pass / ⬜ Fail | |
| 6. Custom Deadline | ⬜ Pass / ⬜ Fail | |
| 7. Email Template | ⬜ Pass / ⬜ Fail / ⬜ Skip | |
| 8. Performance (50 apps) | ⬜ Pass / ⬜ Fail | |
| 9. Email Failure Handling | ⬜ Pass / ⬜ Fail | |
| 10. API Direct Testing | ⬜ Pass / ⬜ Fail / ⬜ Skip | |

**Overall Status:** ⬜ All Pass / ⬜ Some Failures

---

## 🐛 TROUBLESHOOTING

### Issue: "Applications list page doesn't show checkboxes"

**Cause:** Old `page.tsx` is active instead of new `page_v2.tsx`

**Solution:**
```bash
# Option 1: Manually test the new page
# Go to: http://localhost:3000/admin/applications_v2

# Option 2: Activate the new page (rename files)
cd src/app/admin/applications
mv page.tsx page_old.tsx
mv page_v2.tsx page.tsx
# Restart dev server
```

---

### Issue: "Shortlist button not visible on detail page"

**Cause:** Old detail page active instead of `page_with_lock.tsx`

**Solution:**
```bash
# Activate lock-integrated page
cd src/app/admin/applications/[id]
mv page.tsx page_old.tsx
mv page_with_lock.tsx page.tsx
# Restart dev server
```

---

### Issue: "Cannot find module '@/lib/email/send-shortlist-email'"

**Cause:** TypeScript compiler cache issue

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Restart dev server
npm run dev
```

---

### Issue: "SMTP authentication failed"

**Cause:** Invalid SMTP credentials or network issue

**Solution:**
```bash
# Test SMTP connection
node scripts/test-email-config.js

# If test fails, verify credentials:
# Email: applications@deeplearningindabaxkenya.com
# Password: OMZ)HZw[QuZe
# Server: server72.web-hosting.com:465 (SSL/TLS)

# Update .env.local
echo 'SMTP_APPLICATIONS_PASS="OMZ)HZw[QuZe"' >> .env.local
```

---

### Issue: "Application not found (404)"

**Cause:** Test data not created properly

**Solution:**
```sql
-- Verify test applications exist
SELECT COUNT(*) FROM form_responses WHERE respondent_email LIKE '%.test@example.com';

-- If count is 0, re-run test data SQL from Pre-testing Checklist
```

---

### Issue: "Lock not releasing after shortlist"

**Cause:** Database function `release_review_lock` not found

**Solution:**
```sql
-- Verify function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'release_review_lock';

-- If not found, re-run Phase 5 migration
```

---

## ✅ POST-TESTING CLEANUP

**After testing, clean up test data:**

```sql
-- Delete test applications
DELETE FROM form_responses
WHERE respondent_email LIKE '%.test@example.com';

-- Delete test event
DELETE FROM events
WHERE slug = 'test-event-2025';

-- Verify cleanup
SELECT COUNT(*) FROM form_responses WHERE respondent_email LIKE '%.test@example.com';
-- Should return 0
```

---

## 📝 NEXT STEPS AFTER TESTING

**If all tests pass:**
1. ✅ Mark "Test shortlist workflow end-to-end" as complete in todo list
2. ✅ Activate new applications list page (rename `page_v2.tsx` → `page.tsx`)
3. ✅ Activate lock-integrated detail page (rename `page_with_lock.tsx` → `page.tsx`)
4. ✅ Proceed to Day 6: Approve/Reject Workflow

**If some tests fail:**
1. Document failures in TEST RESULTS SUMMARY
2. Create bug tickets for each failure
3. Fix bugs before proceeding to Day 6
4. Re-run failed tests

---

**Testing Guide Created:** November 21, 2025
**Estimated Testing Time:** 30-45 minutes
**Difficulty:** Medium

**Happy Testing! 🧪✅**
