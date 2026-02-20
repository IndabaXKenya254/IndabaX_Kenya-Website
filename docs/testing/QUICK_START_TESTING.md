# 🚀 QUICK START: 5-Minute Testing

**Goal:** Get testing in 5 minutes without reading 100 pages of documentation

---

## STEP 1: Start Dev Server (1 min)

```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website
npm run dev
```

**Wait for:** "ready - started server on 0.0.0.0:3000"

---

## STEP 2: Create Test Data (2 min)

**Open:** https://supabase.com/dashboard/project/klnspdwlybpwkznzezzd/editor

**Click:** SQL Editor → New Query

**Paste & Run:**
```sql
-- Create test event
INSERT INTO events (id, title, slug, start_date, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Event 2025',
  'test-event-2025',
  '2025-12-01',
  'upcoming'
)
ON CONFLICT (id) DO NOTHING;

-- Create 5 test applications
INSERT INTO form_responses (
  id, event_id, respondent_name, respondent_email,
  status_v2, survey_deadline_days, completion_percentage
)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Alice Test', 'alice.test@example.com', 'interested', 7, 100),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bob Test', 'bob.test@example.com', 'interested', 7, 100),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Charlie Test', 'charlie.test@example.com', 'interested', 7, 100),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Diana Test', 'diana.test@example.com', 'interested', 7, 100),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Eve Test', 'eve.test@example.com', 'interested', 7, 100)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT respondent_name, respondent_email, status_v2
FROM form_responses
WHERE respondent_email LIKE '%.test@example.com';
```

**Expected:** 5 rows returned (Alice, Bob, Charlie, Diana, Eve)

---

## STEP 3: Login & Test (2 min)

### 3A. Login as Admin
1. **Go to:** http://localhost:3000/admin/login
2. **Login** with your admin credentials
3. **Should redirect to:** http://localhost:3000/admin/dashboard

### 3B. Test Single Shortlist
1. **Click:** "Applications" in sidebar
2. **Click:** "Alice Test" (first application)
3. **Look for:** Green "You have the lock" alert at top
4. **Scroll to:** "Quick Actions" section
5. **Click:** "Shortlist & Send Survey" button (blue button)
6. **In dialog, click:** "OK"
7. **Expected:** Success alert "Application Shortlisted!"
8. **Expected:** Status badge changes to "Survey Sent"

### 3C. Test Bulk Shortlist
1. **Go back to:** Applications list
2. **Check boxes:** Select Bob, Charlie, Diana (3 applications)
3. **Look for:** "3 application(s) selected" message at top
4. **Click:** "Shortlist Selected (3)" button
5. **In dialog, click:** "OK"
6. **Expected:** Success alert "Shortlisted 3 of 3 applications"
7. **Expected:** All 3 show "Survey Sent" status

---

## ✅ SUCCESS CRITERIA

**You're done when:**
- ✅ Single shortlist works (Alice → Survey Sent)
- ✅ Bulk shortlist works (Bob, Charlie, Diana → Survey Sent)
- ✅ Success alerts appear
- ✅ Status badges update

---

## 🐛 TROUBLESHOOTING

### "Shortlist button not visible"
```bash
# You're on the old page. Use the new one:
cd src/app/admin/applications/[id]
mv page.tsx page_old.tsx
mv page_with_lock.tsx page.tsx
# Restart: Ctrl+C, then npm run dev
```

### "Bulk shortlist button not visible"
```bash
# You're on the old applications list. Use the new one:
cd src/app/admin/applications
mv page.tsx page_old.tsx
mv page_v2.tsx page.tsx
# Restart: Ctrl+C, then npm run dev
```

### "Application not found"
```sql
-- Re-run the test data SQL from Step 2
```

### "Button is disabled"
- Wait 2-3 seconds for lock to acquire
- Look for green "You have the lock" alert
- If still disabled, refresh page

---

## 📚 FULL TESTING GUIDE

For comprehensive testing (10 test cases, email verification, performance tests):
- **Read:** `/docs/PHASE_5_DAY5_TESTING_GUIDE.md`
- **Time:** 30-45 minutes

---

**That's it! You're testing in 5 minutes.** 🎉
