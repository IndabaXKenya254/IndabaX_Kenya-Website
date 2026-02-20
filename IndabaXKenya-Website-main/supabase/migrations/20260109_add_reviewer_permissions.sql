-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - REVIEWER PERMISSIONS EXPANSION
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add new permissions to reviewers JSONB column
-- Created: January 9, 2026
-- Purpose: Enable reviewers to have granular permissions for all admin functions

-- ═══════════════════════════════════════════════════════════════════════════
-- EXISTING PERMISSIONS (Already in use)
-- ═══════════════════════════════════════════════════════════════════════════
/*
Current permissions in reviewers.permissions JSONB column:
- canViewApplications: Can view application list and details
- canApprove: Can approve applications
- canReject: Can reject or waitlist applications
- canViewPII: Can view personally identifiable information
- canViewSurveyResponses: Can view survey responses
- canViewPaperSubmissions: Can view paper submissions
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- NEW PERMISSIONS (To be added)
-- ═══════════════════════════════════════════════════════════════════════════
/*
Add these new permissions to reviewers.permissions JSONB column:

- canShortlist: Can shortlist applications and trigger survey sending
- canSendReminders: Can send survey reminder emails to applicants
- canRevoke: Can revoke approvals and invalidate tickets
- canSendEmails: Can send custom emails to applicants
- canWaitlist: Can move applications to waitlist status (included in canReject)

These permissions enable reviewers to perform ALL admin functions on applications
they are assigned to, while maintaining event-based access control.
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- EXAMPLE: Update existing reviewer to have all permissions
-- ═══════════════════════════════════════════════════════════════════════════
/*
To grant a reviewer ALL permissions for their assigned events:

UPDATE reviewers
SET permissions = jsonb_build_object(
  'canViewApplications', true,
  'canViewPII', true,
  'canViewSurveyResponses', true,
  'canViewPaperSubmissions', true,
  'canApprove', true,
  'canReject', true,
  'canWaitlist', true,
  'canShortlist', true,
  'canSendReminders', true,
  'canRevoke', true,
  'canSendEmails', true
)
WHERE user_id = '<user_id>';
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- EXAMPLE: Create reviewer with specific permissions
-- ═══════════════════════════════════════════════════════════════════════════
/*
To create a reviewer with limited permissions (e.g., can only view and approve):

INSERT INTO reviewers (user_id, event_id, permissions)
VALUES (
  '<user_id>',
  '<event_id>',
  jsonb_build_object(
    'canViewApplications', true,
    'canViewPII', false,
    'canApprove', true,
    'canReject', false,
    'canShortlist', false,
    'canSendReminders', false,
    'canRevoke', false,
    'canSendEmails', false
  )
);
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- API ENDPOINTS NOW SUPPORTING REVIEWERS
-- ═══════════════════════════════════════════════════════════════════════════
/*
The following admin APIs now support reviewers with permission checks:

1. GET/PATCH /api/admin/applications/[id]
   - Requires: canViewApplications
   - Purpose: View and update application details

2. POST /api/admin/applications/[id]/decision
   - Requires: canApprove (for approve), canReject (for reject/waitlist)
   - Purpose: Approve, reject, or waitlist applications

3. GET /api/admin/applications/[id]/timeline
   - Requires: canViewApplications
   - Purpose: View application activity history

4. POST /api/admin/applications/[id]/shortlist
   - Requires: canShortlist
   - Purpose: Shortlist application and send survey

5. POST /api/admin/applications/[id]/send-reminder
   - Requires: canSendReminders
   - Purpose: Send survey reminder emails

6. POST /api/admin/applications/[id]/revoke
   - Requires: canRevoke
   - Purpose: Revoke approval and invalidate tickets

7. POST /api/admin/applications/[id]/send-email
   - Requires: canSendEmails
   - Purpose: Send custom emails to applicants

8. GET/POST/DELETE/PATCH /api/admin/applications/[id]/lock
   - Requires: canViewApplications
   - Purpose: Manage review locks to prevent concurrent reviews
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- PERMISSION MATRIX (Recommended Roles)
-- ═══════════════════════════════════════════════════════════════════════════
/*
╔═══════════════════════════╦═══════════╦══════════╦═══════════╦═══════════╗
║ Permission                ║  Viewer   ║ Reviewer ║ Evaluator ║ Full      ║
╠═══════════════════════════╬═══════════╬══════════╬═══════════╬═══════════╣
║ canViewApplications       ║    ✓      ║    ✓     ║     ✓     ║     ✓     ║
║ canViewPII                ║    ✗      ║    ✓     ║     ✓     ║     ✓     ║
║ canViewSurveyResponses    ║    ✗      ║    ✓     ║     ✓     ║     ✓     ║
║ canViewPaperSubmissions   ║    ✗      ║    ✓     ║     ✓     ║     ✓     ║
║ canApprove                ║    ✗      ║    ✗     ║     ✓     ║     ✓     ║
║ canReject                 ║    ✗      ║    ✗     ║     ✓     ║     ✓     ║
║ canWaitlist               ║    ✗      ║    ✗     ║     ✓     ║     ✓     ║
║ canShortlist              ║    ✗      ║    ✗     ║     ✓     ║     ✓     ║
║ canSendReminders          ║    ✗      ║    ✗     ║     ✗     ║     ✓     ║
║ canRevoke                 ║    ✗      ║    ✗     ║     ✗     ║     ✓     ║
║ canSendEmails             ║    ✗      ║    ✗     ║     ✗     ║     ✓     ║
╚═══════════════════════════╩═══════════╩══════════╩═══════════╩═══════════╝

Viewer Role: Can only view applications (read-only access)
Reviewer Role: Can view all application data but cannot make decisions
Evaluator Role: Can view, approve, reject, and shortlist applications
Full Role: Complete access to all reviewer functions
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- NO DATABASE SCHEMA CHANGES REQUIRED
-- ═══════════════════════════════════════════════════════════════════════════
/*
This migration is INFORMATIONAL ONLY.

The reviewers.permissions column is already JSONB, so it can accommodate any
additional permissions without schema changes.

To add permissions to existing reviewers, use the admin panel at:
/admin/reviewers

Or use SQL UPDATE statements as shown in the examples above.
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- TESTING CHECKLIST
-- ═══════════════════════════════════════════════════════════════════════════
/*
After implementing, test each permission:

1. ✓ canViewApplications - View application list and detail pages
2. ✓ canApprove - Approve an application (decision API)
3. ✓ canReject - Reject/waitlist an application (decision API)
4. ✓ canShortlist - Shortlist an application and send survey
5. ✓ canSendReminders - Send survey reminder email
6. ✓ canRevoke - Revoke an approved application
7. ✓ canSendEmails - Send custom email to applicant
8. ✓ Lock management - Acquire, extend, and release locks

Test with reviewers assigned to:
- Single event
- Multiple events
- Global reviewer (all upcoming events)
*/
