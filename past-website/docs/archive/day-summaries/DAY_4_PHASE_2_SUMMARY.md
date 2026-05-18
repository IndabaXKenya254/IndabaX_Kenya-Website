# Day 4 Phase 2 - Content Management APIs - COMPLETE

**Status**: ✅ Complete
**Date**: October 23, 2025
**Phase**: Admin Panel Backend - Content Management

---

## Overview

Implemented comprehensive content management APIs for the admin panel. All endpoints are protected by admin authentication middleware and include proper validation, error handling, and pagination.

---

## Validation Schemas Created

**File**: `lib/validations/admin.ts`

All validation schemas use Zod for type-safe validation:

1. **Posts**: `createPostSchema`, `updatePostSchema`
2. **Events**: `createEventSchema`, `updateEventSchema`
3. **Speakers**: `createSpeakerSchema`, `updateSpeakerSchema`
4. **Sponsors**: `createSponsorSchema`, `updateSponsorSchema`
5. **FAQs**: `createFaqSchema`, `updateFaqSchema`
6. **Settings**: `updateSettingSchema`
7. **Gallery Photos**: `createPhotoSchema`, `updatePhotoSchema`

---

## Endpoints Implemented

### 1. Posts Management

#### `GET /api/admin/posts`
- **Purpose**: List all posts (including drafts)
- **Query Parameters**:
  - `status`: 'draft' | 'published' (optional)
  - `category`: 'news' | 'announcement' | 'article' (optional)
  - `limit`: number (default: 50, max: 200)
  - `offset`: number (default: 0)
- **Returns**: Array of posts with pagination headers

#### `POST /api/admin/posts`
- **Purpose**: Create new post
- **Request Body**:
  - `slug`: string (required, lowercase, hyphens only)
  - `title`: string (required)
  - `excerpt`: string (optional)
  - `content`: string (required, min 10 chars)
  - `featured_image`: URL (optional)
  - `category`: 'news' | 'announcement' | 'article' (optional)
  - `status`: 'draft' | 'published' (default: draft)
  - `published_at`: ISO datetime (optional)
- **Features**:
  - Auto-sets `published_at` when status is 'published'
  - Auto-sets `author_id` from authenticated user
  - Duplicate slug detection

#### `GET /api/admin/posts/[id]`
- **Purpose**: Get single post by ID
- **Returns**: Post object

#### `PATCH /api/admin/posts/[id]`
- **Purpose**: Update post
- **Request Body**: All fields optional
- **Features**:
  - Auto-sets `published_at` when changing status to 'published'
  - Duplicate slug detection

#### `DELETE /api/admin/posts/[id]`
- **Purpose**: Delete post
- **Returns**: Success message

---

### 2. Events Management

#### `GET /api/admin/events`
- **Purpose**: List all events
- **Query Parameters**:
  - `status`: 'draft' | 'published' | 'archived' (optional)
  - `event_type`: 'upcoming' | 'past' (optional)
  - `limit`: number (default: 50, max: 200)
  - `offset`: number (default: 0)
- **Returns**: Array of events ordered by start_date descending

#### `POST /api/admin/events`
- **Purpose**: Create new event
- **Request Body**:
  - `slug`: string (required, lowercase, hyphens only)
  - `title`: string (required)
  - `description`: string (optional)
  - `start_date`: YYYY-MM-DD (required)
  - `end_date`: YYYY-MM-DD (optional)
  - `location`: string (optional)
  - `venue`: string (optional)
  - `featured_image`: URL (optional)
  - `status`: 'draft' | 'published' | 'archived' (default: draft)
  - `event_type`: 'upcoming' | 'past' (default: upcoming)
  - `is_featured`: boolean (default: false)
  - `venue_details`: object (optional, JSONB)
- **Features**:
  - Duplicate slug detection
  - JSONB support for venue_details

#### `GET /api/admin/events/[id]`
- **Purpose**: Get single event by ID
- **Returns**: Event object

#### `PATCH /api/admin/events/[id]`
- **Purpose**: Update event
- **Request Body**: All fields optional
- **Features**: Duplicate slug detection

#### `DELETE /api/admin/events/[id]`
- **Purpose**: Delete event
- **Returns**: Success message

---

### 3. Speakers Management

#### `GET /api/admin/speakers`
- **Purpose**: List all speakers
- **Query Parameters**:
  - `is_featured`: 'true' | 'false' (optional)
  - `limit`: number (default: 50, max: 200)
  - `offset`: number (default: 0)
- **Returns**: Array of speakers ordered by display_order, then name

#### `POST /api/admin/speakers`
- **Purpose**: Create new speaker
- **Request Body**:
  - `name`: string (required)
  - `title`: string (optional)
  - `organization`: string (optional)
  - `photo_url`: URL (optional)
  - `bio_short`: string (max 500 chars, optional)
  - `bio_full`: string (optional)
  - `linkedin_url`: URL (optional)
  - `twitter_url`: URL (optional)
  - `website_url`: URL (optional)
  - `is_featured`: boolean (default: false)
  - `display_order`: number (default: 0)

#### `GET /api/admin/speakers/[id]`
- **Purpose**: Get single speaker by ID

#### `PATCH /api/admin/speakers/[id]`
- **Purpose**: Update speaker
- **Request Body**: All fields optional

#### `DELETE /api/admin/speakers/[id]`
- **Purpose**: Delete speaker

---

### 4. Sponsors Management

#### `GET /api/admin/sponsors`
- **Purpose**: List all sponsors
- **Query Parameters**:
  - `tier`: 'platinum' | 'gold' | 'silver' | 'bronze' (optional)
  - `is_active`: 'true' | 'false' (optional)
  - `limit`: number (default: 50, max: 200)
  - `offset`: number (default: 0)
- **Returns**: Array of sponsors ordered by display_order, then name

#### `POST /api/admin/sponsors`
- **Purpose**: Create new sponsor
- **Request Body**:
  - `name`: string (required)
  - `logo_url`: URL (required)
  - `website_url`: URL (optional)
  - `tier`: 'platinum' | 'gold' | 'silver' | 'bronze' (required)
  - `display_order`: number (default: 0)
  - `is_active`: boolean (default: true)

#### `GET /api/admin/sponsors/[id]`
- **Purpose**: Get single sponsor by ID

#### `PATCH /api/admin/sponsors/[id]`
- **Purpose**: Update sponsor
- **Request Body**: All fields optional

#### `DELETE /api/admin/sponsors/[id]`
- **Purpose**: Delete sponsor

---

### 5. FAQs Management

#### `GET /api/admin/faqs`
- **Purpose**: List all FAQs
- **Query Parameters**:
  - `category`: 'registration' | 'venue' | 'schedule' | 'speakers' | 'general' (optional)
  - `is_active`: 'true' | 'false' (optional)
  - `limit`: number (default: 50, max: 200)
  - `offset`: number (default: 0)
- **Returns**: Array of FAQs ordered by display_order

#### `POST /api/admin/faqs`
- **Purpose**: Create new FAQ
- **Request Body**:
  - `question`: string (required, min 5 chars, max 500)
  - `answer`: string (required, min 10 chars)
  - `category`: 'registration' | 'venue' | 'schedule' | 'speakers' | 'general' (optional)
  - `display_order`: number (default: 0)
  - `is_active`: boolean (default: true)

#### `GET /api/admin/faqs/[id]`
- **Purpose**: Get single FAQ by ID

#### `PATCH /api/admin/faqs/[id]`
- **Purpose**: Update FAQ
- **Request Body**: All fields optional

#### `DELETE /api/admin/faqs/[id]`
- **Purpose**: Delete FAQ

---

### 6. Settings Management

#### `GET /api/admin/settings`
- **Purpose**: List all settings
- **Returns**: Array of settings ordered by key

#### `GET /api/admin/settings/[key]`
- **Purpose**: Get single setting by key
- **Returns**: Setting object

#### `PATCH /api/admin/settings/[key]`
- **Purpose**: Update setting value
- **Request Body**:
  - `value`: object (required, any valid JSON)
  - `description`: string (optional, max 500 chars)
- **Example**:
```json
{
  "value": {
    "enabled": true,
    "title": "Register for IndabaX Kenya 2025",
    "message": "Early bird registration ends soon!"
  }
}
```

**Note**: Settings are not created/deleted via API - they're predefined in the database.

---

### 7. Gallery Photos Management

#### `GET /api/admin/photos`
- **Purpose**: List all gallery photos
- **Query Parameters**:
  - `year`: number (e.g., 2023, 2024)
  - `event_id`: uuid (optional)
  - `is_featured`: 'true' | 'false' (optional)
  - `limit`: number (default: 50, max: 200)
  - `offset`: number (default: 0)
- **Returns**: Array of photos ordered by year desc, display_order, created_at

#### `POST /api/admin/photos`
- **Purpose**: Create new photo
- **Request Body**:
  - `url`: URL (required)
  - `title`: string (optional, max 255)
  - `description`: string (optional, max 1000)
  - `year`: number (required, 2000-2100)
  - `event_id`: uuid (optional)
  - `is_featured`: boolean (default: false)
  - `display_order`: number (default: 0)

#### `GET /api/admin/photos/[id]`
- **Purpose**: Get single photo by ID

#### `PATCH /api/admin/photos/[id]`
- **Purpose**: Update photo
- **Request Body**: All fields optional

#### `DELETE /api/admin/photos/[id]`
- **Purpose**: Delete photo

---

### 8. Subscribers Export

#### `GET /api/admin/subscribers/export`
- **Purpose**: Export subscribers list
- **Query Parameters**:
  - `format`: 'csv' | 'json' (default: csv)
- **Returns**:
  - CSV file download with email and subscribed_at columns
  - OR JSON array if format=json
- **File naming**: `indabax-subscribers-YYYY-MM-DD.csv`

---

## Common Features

All endpoints include:

1. **Authentication**: Protected by `requireAdmin()` middleware
2. **Validation**: Zod schema validation with detailed error messages
3. **Error Handling**: Consistent error responses via `lib/api-errors.ts`
4. **Pagination**: Support for limit/offset with X-Total-Count header
5. **Type Safety**: Full TypeScript support with API types
6. **Logging**: Console errors for debugging

---

## Files Created

### API Routes (22 files)
1. `src/app/api/admin/posts/route.ts`
2. `src/app/api/admin/posts/[id]/route.ts`
3. `src/app/api/admin/events/route.ts`
4. `src/app/api/admin/events/[id]/route.ts`
5. `src/app/api/admin/speakers/route.ts`
6. `src/app/api/admin/speakers/[id]/route.ts`
7. `src/app/api/admin/sponsors/route.ts`
8. `src/app/api/admin/sponsors/[id]/route.ts`
9. `src/app/api/admin/faqs/route.ts`
10. `src/app/api/admin/faqs/[id]/route.ts`
11. `src/app/api/admin/settings/route.ts`
12. `src/app/api/admin/settings/[key]/route.ts`
13. `src/app/api/admin/photos/route.ts`
14. `src/app/api/admin/photos/[id]/route.ts`
15. `src/app/api/admin/subscribers/export/route.ts`

### Validation Schemas
16. `lib/validations/admin.ts` (updated with photo schemas)

---

## Testing Checklist

Before committing, test the following:

### Posts
- [ ] GET /api/admin/posts (list)
- [ ] GET /api/admin/posts?status=draft
- [ ] GET /api/admin/posts?category=news
- [ ] POST /api/admin/posts (create)
- [ ] GET /api/admin/posts/[id] (get single)
- [ ] PATCH /api/admin/posts/[id] (update)
- [ ] DELETE /api/admin/posts/[id] (delete)

### Events
- [ ] GET /api/admin/events (list)
- [ ] GET /api/admin/events?status=published
- [ ] GET /api/admin/events?event_type=upcoming
- [ ] POST /api/admin/events (create)
- [ ] GET /api/admin/events/[id] (get single)
- [ ] PATCH /api/admin/events/[id] (update)
- [ ] DELETE /api/admin/events/[id] (delete)

### Speakers
- [ ] GET /api/admin/speakers (list)
- [ ] POST /api/admin/speakers (create)
- [ ] PATCH /api/admin/speakers/[id] (update)
- [ ] DELETE /api/admin/speakers/[id] (delete)

### Sponsors
- [ ] GET /api/admin/sponsors (list)
- [ ] POST /api/admin/sponsors (create)
- [ ] PATCH /api/admin/sponsors/[id] (update)
- [ ] DELETE /api/admin/sponsors/[id] (delete)

### FAQs
- [ ] GET /api/admin/faqs (list)
- [ ] POST /api/admin/faqs (create)
- [ ] PATCH /api/admin/faqs/[id] (update)
- [ ] DELETE /api/admin/faqs/[id] (delete)

### Settings
- [ ] GET /api/admin/settings (list)
- [ ] GET /api/admin/settings/[key] (get single)
- [ ] PATCH /api/admin/settings/[key] (update)

### Photos
- [ ] GET /api/admin/photos (list)
- [ ] GET /api/admin/photos?year=2024
- [ ] POST /api/admin/photos (create)
- [ ] PATCH /api/admin/photos/[id] (update)
- [ ] DELETE /api/admin/photos/[id] (delete)

### Subscribers
- [ ] GET /api/admin/subscribers/export (CSV)
- [ ] GET /api/admin/subscribers/export?format=json

---

## Next Steps

1. **Test All Endpoints**: Use Postman/Insomnia to test each endpoint
2. **Verify Authentication**: Ensure all endpoints require admin auth
3. **Check Validation**: Test invalid inputs to verify error handling
4. **Test Pagination**: Verify limit/offset works correctly
5. **Commit Changes**: Create git commit for Day 4 Phase 2

---

## Notes

- All endpoints follow RESTful conventions
- Consistent response format across all endpoints
- Duplicate slug detection for posts and events
- Auto-publish logic for posts (sets published_at)
- Settings use key-based access instead of ID
- Subscribers export supports both CSV and JSON formats
- Gallery photos organized by year
- Display order fields for controlling presentation order

---

**Phase Complete**: Ready for testing and commit
