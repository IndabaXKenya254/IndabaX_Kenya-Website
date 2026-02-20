# Phase 4 Testing Guide - Registration Flow

## ✅ Configuration Status

All email configuration variables are set correctly:
- ✅ SMTP_HOST: server72.web-hosting.com
- ✅ SMTP_PORT: 465
- ✅ SMTP_APPLICATIONS_PASS: Configured
- ✅ SMTP_ACCOUNTS_PASS: Configured

**Email Accounts:**
1. `applications@deeplearningindabaxkenya.com` - For event registrations
2. `accounts@deeplearningindabaxkenya.com` - For system notifications

---

## 🧪 Testing Checklist

### 1. Email Configuration Test (Admin Only)

**Test SMTP connectivity for both accounts:**

```bash
# Method 1: Using curl (GET request)
curl http://localhost:3003/api/test-email \
  -H "Cookie: your-admin-session-cookie"

# Method 2: Using curl (POST request - sends actual test email)
curl -X POST http://localhost:3003/api/test-email \
  -H "Content-Type: application/json" \
  -H "Cookie: your-admin-session-cookie" \
  -d '{
    "email": "your-test-email@example.com",
    "accountType": "applications"
  }'
```

**Expected Response (GET):**
```json
{
  "success": true,
  "data": {
    "host": "server72.web-hosting.com",
    "port": "465",
    "accounts": [
      {
        "type": "applications",
        "email": "applications@deeplearningindabaxkenya.com",
        "configured": true
      },
      {
        "type": "accounts",
        "email": "accounts@deeplearningindabaxkenya.com",
        "configured": true
      }
    ],
    "tests": {
      "applications": {
        "success": true,
        "message": "SMTP configuration is valid...",
        "account": "applications@deeplearningindabaxkenya.com"
      },
      "accounts": {
        "success": true,
        "message": "SMTP configuration is valid...",
        "account": "accounts@deeplearningindabaxkenya.com"
      }
    }
  }
}
```

---

### 2. Template Assignment to Events

**Steps:**
1. Navigate to: `http://localhost:3003/admin/events`
2. Click on an existing event or create a new one
3. Scroll to "Registration Configuration" section
4. Enable registration toggle
5. Set registration deadline (optional)
6. Select "Initial Interest Form" template
7. Select "Detailed Survey Form" template (optional)
8. Click "Save Event"

**Expected Behavior:**
- ✅ Templates load in dropdown
- ✅ Only templates with matching `usage_type` appear
- ✅ Save succeeds without errors
- ✅ Event page shows assigned templates

---

### 3. User Registration Flow (End-to-End)

#### Step 1: Create Test Event with Template

**Database Setup:**
```sql
-- Verify event has templates assigned
SELECT
  id,
  title,
  registration_enabled,
  registration_deadline,
  initial_template_id,
  detailed_template_id
FROM events
WHERE registration_enabled = true
LIMIT 1;
```

#### Step 2: Access Registration Page

Navigate to: `http://localhost:3003/events/{event-id}/register`

**Expected Behavior:**
- ✅ Form loads with all questions from template
- ✅ Progress bar shows 0%
- ✅ All 15 question types render correctly
- ✅ Required fields marked with asterisk (*)

#### Step 3: Test Auto-Save

**Actions:**
1. Fill in email field
2. Answer 1-2 questions
3. Wait 3 seconds
4. Check browser console for "Auto-saving..." message
5. Check Network tab for POST request to `/api/forms/responses`

**Expected Behavior:**
- ✅ "Saving..." indicator appears
- ✅ "Last saved X seconds ago" message appears
- ✅ API returns success with `is_complete: false`
- ✅ Resume token saved to localStorage

**Verify in Database:**
```sql
SELECT
  id,
  respondent_email,
  respondent_name,
  status,
  completion_percentage,
  is_complete,
  resume_token,
  last_saved_at
FROM form_responses
WHERE respondent_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: `status = 'in_progress'`, `is_complete = false`

#### Step 4: Test Resume Functionality

**Actions:**
1. Close browser tab (or navigate away)
2. Return to registration page: `http://localhost:3003/events/{event-id}/register`
3. Enter same email address

**Expected Behavior:**
- ✅ Previous responses auto-populated
- ✅ Progress bar shows previous progress
- ✅ Can continue from where left off

#### Step 5: Test Form Validation

**Actions:**
1. Skip required fields
2. Click "Submit"

**Expected Behavior:**
- ✅ Error messages appear under required fields
- ✅ Page scrolls to first error
- ✅ Form does not submit
- ✅ Error count shown at top

#### Step 6: Complete Submission

**Actions:**
1. Fill all required fields
2. Click "Submit"

**Expected Behavior:**
- ✅ "Submitting..." indicator appears
- ✅ API call to `/api/forms/responses` with `is_complete: true`
- ✅ Success page appears
- ✅ Confirmation email queued

**Verify in Database:**
```sql
SELECT
  id,
  respondent_email,
  status,
  completion_percentage,
  is_complete,
  completed_at
FROM form_responses
WHERE respondent_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: `status = 'completed'`, `is_complete = true`, `completion_percentage = 100`

#### Step 7: Test Duplicate Prevention

**Actions:**
1. Try to register again with same email for same event
2. Navigate to registration page
3. Fill form and submit

**Expected Behavior:**
- ✅ API returns 400 error
- ✅ Error message: "You have already submitted a response for this event"
- ✅ Form does not create duplicate entry

---

### 4. Email Confirmation Test

#### Check Email Delivery

**What to Check:**
1. Email received at test address
2. Subject: "Registration Confirmed - {Event Title}"
3. From: "IndabaX Kenya Applications <applications@deeplearningindabaxkenya.com>"
4. HTML formatting displays correctly
5. All event details correct:
   - Event title
   - Event date
   - Event location
   - Event URL
   - Response ID
   - Submission timestamp

**Email Template Checklist:**
- ✅ Header with IndabaX Kenya logo/branding
- ✅ Success icon (checkmark)
- ✅ Personalized greeting with recipient name
- ✅ Event details card with all information
- ✅ "View Event Details" button (working link)
- ✅ Next steps section
- ✅ Footer with contact information
- ✅ Mobile-responsive design

**Plain Text Fallback:**
- ✅ All information readable without HTML
- ✅ Links displayed as full URLs

---

### 5. Question Type Rendering Test

Test each of the 15 question types:

| # | Question Type | Test Actions | Expected Behavior |
|---|---------------|--------------|-------------------|
| 1 | Short Text | Type text | Single-line input, maxLength enforced |
| 2 | Long Text | Type paragraph | Multi-line textarea, maxLength enforced |
| 3 | Email | Type email | Email validation, invalid format shows error |
| 4 | Number | Type number | Number input, min/max enforced |
| 5 | URL | Type URL | URL validation, invalid format shows error |
| 6 | Phone | Type phone | Phone validation, format help text |
| 7 | Date | Select date | Date picker, min/max dates enforced |
| 8 | Time | Select time | Time picker, 12/24 hour format |
| 9 | Single Choice | Select option | Radio buttons, only one selectable |
| 10 | Multiple Choice | Select options | Checkboxes, multiple selectable, min/max enforced |
| 11 | Dropdown | Select from list | Dropdown menu, search if >5 options |
| 12 | File Upload | Upload file | File size/type validation, progress bar |
| 13 | Linear Scale | Select rating | Radio buttons 1-N, labels at ends |
| 14 | Matrix | Select for each row | Grid layout, one per row |
| 15 | Section | N/A | Heading displayed, no input required |

---

### 6. API Endpoint Tests

#### POST /api/forms/responses (Create/Update Response)

**Test Case 1: Create Draft**
```bash
curl -X POST http://localhost:3003/api/forms/responses \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "uuid-here",
    "event_id": "uuid-here",
    "response_type": "initial_interest",
    "respondent_email": "test@example.com",
    "respondent_name": "Test User",
    "responses": {"question-id": "answer"},
    "is_complete": false
  }'
```

Expected: 200, `status: "in_progress"`, `resume_token` returned

**Test Case 2: Complete Submission**
```bash
# Same as above but with is_complete: true
```

Expected: 201, `status: "completed"`, email queued

**Test Case 3: Duplicate Submission**
```bash
# Submit again with same email/event
```

Expected: 400, error code "ALREADY_SUBMITTED"

#### GET /api/forms/responses (Retrieve Response)

**Test Case 1: By Email**
```bash
curl "http://localhost:3003/api/forms/responses?event_id=uuid&email=test@example.com"
```

Expected: 200, response data or null

**Test Case 2: By Resume Token**
```bash
curl "http://localhost:3003/api/forms/responses?event_id=uuid&resume_token=token-here"
```

Expected: 200, response data or null

---

### 7. Edge Cases to Test

#### Registration Deadline

**Setup:**
```sql
UPDATE events
SET registration_deadline = NOW() - INTERVAL '1 day'
WHERE id = 'event-id';
```

**Test:** Try to register

**Expected:** 400 error, "Registration deadline has passed"

#### Registration Disabled

**Setup:**
```sql
UPDATE events
SET registration_enabled = false
WHERE id = 'event-id';
```

**Test:** Try to register

**Expected:** 400 error, "Registration is not enabled for this event"

#### Missing Template

**Setup:**
```sql
UPDATE events
SET initial_template_id = NULL
WHERE id = 'event-id';
```

**Test:** Navigate to registration page

**Expected:** Error page, "No registration form configured"

#### Invalid Resume Token

**Test:** Add invalid resume token to URL query

**Expected:** Form starts fresh (no auto-population)

#### Network Failure During Auto-Save

**Test:** Throttle network, trigger auto-save

**Expected:** Error indicator appears, retry attempted

---

## 🔍 Debug Checklist

If something doesn't work:

1. **Check Server Logs:**
   ```bash
   # Server should be running on http://localhost:3003
   # Check terminal for error messages
   ```

2. **Check Browser Console:**
   - Look for JavaScript errors
   - Check Network tab for failed API calls
   - Verify localStorage for resume_token

3. **Check Database:**
   ```sql
   -- Check form_responses table
   SELECT * FROM form_responses
   ORDER BY created_at DESC
   LIMIT 5;

   -- Check events have templates
   SELECT id, title, initial_template_id, detailed_template_id
   FROM events
   WHERE registration_enabled = true;
   ```

4. **Check Email Configuration:**
   ```bash
   node scripts/test-email-config.js
   ```

5. **Verify Environment Variables:**
   ```bash
   # Check .env.local has all required variables
   cat .env.local | grep SMTP
   ```

---

## 🎯 Success Criteria

Phase 4 is complete when:

- ✅ Email configuration verified (both accounts)
- ✅ Templates can be assigned to events
- ✅ Registration page loads with form
- ✅ All 15 question types render correctly
- ✅ Auto-save works (3 second delay)
- ✅ Form validation works
- ✅ Complete submission succeeds
- ✅ Confirmation email received
- ✅ Duplicate submissions prevented
- ✅ Resume functionality works
- ✅ Edge cases handled gracefully

---

## 📞 Support

If you encounter issues:

1. Check this testing guide
2. Review server logs
3. Verify database schema matches migration files
4. Check SMTP credentials in .env.local
5. Test with simple curl commands first

---

**Last Updated:** 2025-11-20
**Phase:** 4 - Registration Flow Redesign
**Status:** Ready for Testing
