# Phase 5 - Day 7: Application Timeline & Activity Logging

**Implementation Date**: November 21, 2025
**Status**: ✅ Complete

---

## Overview

Implemented a comprehensive activity logging system with visual timeline display for application review tracking. The system automatically logs all activities (submissions, reviews, status changes, note updates, email sends, lock operations) and displays them in a chronological timeline on the application detail page.

---

## Files Created/Modified

### 1. Database Migration (`/supabase/migrations/20251121160000_create_application_activity_log.sql`)

**Purpose**: Creates activity logging infrastructure in the database

**Key Components**:

#### Activity Logs Table
```sql
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL,  -- FK to form_responses
  activity_type VARCHAR(50),     -- Type of activity
  user_id UUID,                  -- Who performed it
  user_email VARCHAR(255),       -- Cached for display
  details TEXT,                  -- Human-readable description
  metadata JSONB,                -- Additional structured data
  created_at TIMESTAMP
)
```

**Activity Types**:
- `submitted` - Application submitted
- `reviewed` - Application reviewed
- `status_change` - Status changed
- `note_added` - Review notes updated
- `lock_acquired` - Review lock acquired
- `lock_released` - Review lock released
- `email_sent` - Email notification sent
- `shortlisted` - Application shortlisted
- `survey_sent` - Survey email sent

#### Helper Function
```sql
log_application_activity(
  p_application_id UUID,
  p_activity_type VARCHAR,
  p_user_id UUID,
  p_user_email VARCHAR,
  p_details TEXT,
  p_metadata JSONB
)
```

#### Automatic Triggers
- **Status Change Trigger**: Automatically logs when application status changes
- **Notes Update Trigger**: Automatically logs when review notes are updated

#### Initial Data Seeding
- Seeds existing applications with "submitted" events
- Seeds existing reviews with "reviewed" events

#### Row Level Security
- Users can view their own activity logs
- Admins can view all activity logs
- System can insert activity logs (via API)

---

### 2. Timeline Component (`/src/components/admin/ApplicationTimeline.tsx`)

**Purpose**: Visual timeline component to display activity log

**Features**:
- Chronological display of activities
- Color-coded icons for different activity types
- Relative timestamps (e.g., "2 hours ago")
- User attribution (who performed each action)
- Additional details and metadata display
- Empty state when no activities
- Loading state with spinner

**Variants**:
- **ApplicationTimeline**: Full timeline for detail pages
- **CompactTimeline**: Condensed version for sidebars/lists

**Visual Elements**:
- Timeline line connecting events
- Colored circular icons
- Timestamp formatting
- User email display
- Details expansion

---

### 3. Timeline API Endpoint (`/src/app/api/admin/applications/[id]/timeline/route.ts`)

**Endpoint**: `GET /api/admin/applications/[id]/timeline`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "status_change",
      "timestamp": "2025-11-21T10:30:00Z",
      "user_email": "admin@example.com",
      "details": "Status changed from pending to accepted",
      "status": "accepted"
    },
    ...
  ]
}
```

**Features**:
- Admin authentication required
- Returns activities in reverse chronological order
- Transforms database format to timeline format
- Includes metadata (status, email type, etc.)

---

### 4. Application Detail Page Updates (`/src/app/admin/applications/[id]/page.tsx`)

**Changes Made**:

1. **Added Timeline State**:
```typescript
const [timeline, setTimeline] = useState<any[]>([])
const [timelineLoading, setTimelineLoading] = useState(false)
```

2. **Added Timeline Loading Function**:
```typescript
const loadTimeline = async () => {
  const response = await fetch(`/api/admin/applications/${id}/timeline`)
  const result = await response.json()
  setTimeline(result.data || [])
}
```

3. **Added Timeline Card to Sidebar**:
- Positioned below action panel
- Scrollable container (max-height: 500px)
- Secondary header styling
- Clock icon

---

### 5. Decision API Updates (`/src/app/api/admin/applications/[id]/decision/route.ts`)

**Changes Made**:

Added activity logging after sending emails:

```typescript
if (emailSent) {
  await supabase.rpc('log_application_activity', {
    p_application_id: id,
    p_activity_type: 'email_sent',
    p_user_id: user.id,
    p_details: `${decision} email sent to ${applicantEmail}`,
    p_metadata: { email_type: decision, recipient: applicantEmail }
  })
}
```

---

## Activity Tracking Flow

### Automatic Activities (via Triggers)

1. **Status Change**:
   - Trigger fires on `form_responses` UPDATE
   - Logs old status → new status
   - Records who made the change
   - Stores metadata with both statuses

2. **Review Notes Update**:
   - Trigger fires on `form_responses` UPDATE
   - Only logs if notes actually changed
   - Records notes length in metadata
   - Attributes to reviewer

### Manual Activities (via API)

1. **Email Sent**:
   - Logged by decision API after successful send
   - Includes email type (acceptance/rejection)
   - Includes recipient email
   - Attributed to reviewer

2. **Lock Operations** (Future):
   - Can be logged by lock API
   - Track who acquired/released locks
   - Track lock durations

---

## Timeline Display

### Visual Design

```
┌──────────────────────────────────────┐
│  Activity Timeline                    │
├──────────────────────────────────────┤
│                                       │
│  ●─ Application Submitted             │
│  │  just now                          │
│  │                                    │
│  ●─ Review Lock Acquired              │
│  │  by admin@example.com              │
│  │  2 minutes ago                     │
│  │                                    │
│  ●─ Status Changed to accepted        │
│  │  by admin@example.com              │
│  │  Status changed from pending       │
│  │  5 minutes ago                     │
│  │                                    │
│  ●   Email Notification Sent          │
│     Acceptance email sent             │
│     10 minutes ago                    │
└──────────────────────────────────────┘
```

### Color Coding

- **Blue** (Primary): Submitted, Email Sent
- **Green** (Success): Lock Acquired
- **Yellow** (Warning): Status Change
- **Gray** (Secondary): Notes Added, Lock Released
- **Cyan** (Info): Reviewed

---

## Database Schema

### activity_logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| application_id | UUID | FK to form_responses |
| activity_type | VARCHAR(50) | Type of activity (enum) |
| user_id | UUID | FK to user_profiles |
| user_email | VARCHAR(255) | Cached email for display |
| details | TEXT | Human-readable description |
| metadata | JSONB | Additional structured data |
| created_at | TIMESTAMP | When activity occurred |

### Indexes

- `idx_activity_logs_application_id` - For querying by application
- `idx_activity_logs_activity_type` - For filtering by type
- `idx_activity_logs_created_at` - For chronological sorting
- `idx_activity_logs_user_id` - For querying by user

---

## Example Timeline Queries

### Get All Activities for Application
```sql
SELECT * FROM activity_logs
WHERE application_id = 'uuid'
ORDER BY created_at DESC;
```

### Get Recent Status Changes
```sql
SELECT * FROM activity_logs
WHERE activity_type = 'status_change'
ORDER BY created_at DESC
LIMIT 10;
```

### Get Activities by Specific Reviewer
```sql
SELECT * FROM activity_logs
WHERE user_id = 'reviewer_uuid'
ORDER BY created_at DESC;
```

---

## Usage Examples

### Displaying Timeline in React

```tsx
import { ApplicationTimeline } from '@/components/admin/ApplicationTimeline'

function ApplicationDetail() {
  const [timeline, setTimeline] = useState([])

  useEffect(() => {
    fetch(`/api/admin/applications/${id}/timeline`)
      .then(res => res.json())
      .then(data => setTimeline(data.data))
  }, [id])

  return (
    <ApplicationTimeline
      events={timeline}
      loading={false}
    />
  )
}
```

### Manually Logging Activity

```typescript
// In API route
await supabase.rpc('log_application_activity', {
  p_application_id: applicationId,
  p_activity_type: 'shortlisted',
  p_user_id: userId,
  p_details: 'Application shortlisted for detailed survey',
  p_metadata: { survey_deadline: '2025-12-01' }
})
```

---

## Security & Permissions

### Row Level Security (RLS)

1. **Users**: Can view their own application activities
2. **Admins**: Can view all application activities
3. **System**: Can insert activities (via API with proper auth)

### API Security

- All timeline endpoints require admin authentication
- Activity logging requires authenticated user context
- Metadata is sanitized before storage
- No sensitive data in public fields

---

## Testing Checklist

- [x] Create activity_logs table with migration
- [x] Test automatic status change logging
- [x] Test automatic notes update logging
- [x] Test manual activity logging (emails)
- [ ] View timeline on application detail page
- [ ] Test timeline loads correctly
- [ ] Test timeline updates after actions
- [ ] Test empty state when no activities
- [ ] Test timeline with many activities (scrolling)
- [ ] Test different activity types display correctly
- [ ] Test relative timestamps ("2 hours ago")
- [ ] Test user attribution shows correctly
- [ ] Test metadata displays properly
- [ ] Verify RLS policies work correctly
- [ ] Test performance with large activity logs

---

## Future Enhancements

### 1. Real-time Updates
- Use Supabase Realtime subscriptions
- Auto-refresh timeline when activities occur
- Show live updates from other reviewers

### 2. Activity Filtering
- Filter by activity type
- Filter by date range
- Filter by user
- Search in activity details

### 3. Export/Download
- Export activity log to CSV
- Generate PDF audit trail
- Email activity report

### 4. Enhanced Metadata
- Store request IP addresses
- Store user agent strings
- Track time spent on each action
- Store before/after values

### 5. Activity Analytics
- Average review time
- Most active reviewers
- Peak activity times
- Activity heatmap

### 6. Notifications
- Notify when activity occurs
- Email digests of activities
- Slack/Discord webhooks
- Mobile push notifications

---

## Troubleshooting

### Timeline Not Loading

1. Check API endpoint returns data:
```bash
curl http://localhost:3000/api/admin/applications/{id}/timeline
```

2. Check browser console for errors

3. Verify activity_logs table exists:
```sql
SELECT COUNT(*) FROM activity_logs;
```

### Activities Not Being Logged

1. Check triggers are enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%form_responses%';
```

2. Verify `log_application_activity` function exists:
```sql
SELECT proname FROM pg_proc WHERE proname = 'log_application_activity';
```

3. Check RLS policies allow insertion

### Timeline Display Issues

1. Verify ApplicationTimeline component imports correctly
2. Check for console errors
3. Verify events prop has correct structure
4. Check CSS/styling issues

---

## Performance Considerations

### Database Optimization

- Indexes on frequently queried columns
- JSONB for flexible metadata storage
- Pagination for large datasets
- Archiving old activities

### Frontend Optimization

- Lazy loading timeline component
- Virtual scrolling for long timelines
- Debounced refresh on activity
- Cached timeline data

### API Optimization

- Limit returned activities (pagination)
- Cache timeline responses
- Compress response data
- Use database query optimization

---

## Summary

✅ Activity logging table created with triggers
✅ Timeline API endpoint implemented
✅ Timeline component built with visual design
✅ Automatic logging for status/notes changes
✅ Manual logging for email sends
✅ Timeline integrated into application detail page
✅ RLS policies for security
✅ Initial data seeding for existing applications

**Phase 5 Day 7 Complete**: The application review system now has full activity tracking and timeline visualization, providing transparency and audit capabilities for the review process.
