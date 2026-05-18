# API Specification
## IndabaX Kenya - Complete API Documentation

**Version:** 1.0

**Base URL:** `https://indabaxkenya.org` (production) / `http://localhost:3000` (development)

**Date:** October 20, 2025

---

## 📋 TABLE OF CONTENTS

1. [Authentication](#authentication)
2. [Public Endpoints](#public-endpoints)
3. [Form Submission Endpoints](#form-submission-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Data Models](#data-models)

---

## 🔒 AUTHENTICATION

### Admin Endpoints
All admin endpoints require authentication via Supabase Auth.

**Authentication Method:** Session-based (cookies)

**Login:**
```typescript
// Client-side
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@indabaxkenya.org',
  password: 'password'
})
```

**Protected Routes:**
All routes under `/api/admin/*` require:
1. Valid Supabase session
2. User exists in `admin_roles` table

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## 🌐 PUBLIC ENDPOINTS

### Events

#### GET /api/events
**Description:** List all published events

**Query Parameters:**
- `type` (optional): Filter by event type
  - Values: `upcoming` | `past`
- `limit` (optional): Maximum number of results (default: 100)
  - Type: number
  - Range: 1-100

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/events?type=upcoming&limit=10"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "indabax-kenya-2026",
      "title": "IndabaX Kenya 2026",
      "description": "Join us for the premier AI conference...",
      "start_date": "2026-03-15",
      "end_date": "2026-03-17",
      "location": "Nairobi, Kenya",
      "venue": "KICC",
      "featured_image": "https://...",
      "status": "published",
      "event_type": "upcoming",
      "is_featured": true,
      "venue_details": {
        "address": "Harambee Avenue, Nairobi",
        "map_url": "https://maps.google.com/?q=KICC",
        "hotels": ["Sarova Stanley", "Hilton Nairobi"]
      },
      "created_at": "2025-10-20T10:00:00Z",
      "updated_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 1
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch events"
  }
}
```

---

#### GET /api/events/[slug]
**Description:** Get single event by slug with speakers and schedule

**Path Parameters:**
- `slug` (required): Event slug

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/events/indabax-kenya-2026"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "indabax-kenya-2026",
    "title": "IndabaX Kenya 2026",
    "description": "...",
    "start_date": "2026-03-15",
    "end_date": "2026-03-17",
    "location": "Nairobi, Kenya",
    "venue": "KICC",
    "featured_image": "https://...",
    "status": "published",
    "event_type": "upcoming",
    "is_featured": true,
    "venue_details": {...},
    "event_speakers": [
      {
        "role": "keynote",
        "speaker": {
          "id": "...",
          "name": "Dr. Jane Mwangi",
          "title": "AI Research Lead",
          "organization": "DeepMind Africa",
          "photo_url": "https://...",
          "bio_short": "Leading researcher in NLP...",
          "linkedin_url": "https://linkedin.com/in/..."
        }
      }
    ],
    "schedule_items": [
      {
        "id": "...",
        "day_number": 1,
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "title": "Opening Keynote",
        "description": "...",
        "session_type": "keynote",
        "location": "Main Hall"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found"
  }
}
```

---

### Posts

#### GET /api/posts
**Description:** List all published posts with pagination

**Query Parameters:**
- `category` (optional): Filter by category
  - Values: `news` | `announcement` | `article`
- `limit` (optional): Results per page (default: 10)
  - Type: number
  - Range: 1-50
- `offset` (optional): Pagination offset (default: 0)
  - Type: number

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/posts?category=announcement&limit=5&offset=0"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "slug": "welcome-indabax-2026",
      "title": "Welcome to IndabaX Kenya 2026",
      "excerpt": "We are excited to announce...",
      "content": "<h2>About IndabaX Kenya 2026</h2><p>...</p>",
      "featured_image": "https://...",
      "author_id": "...",
      "status": "published",
      "category": "announcement",
      "published_at": "2025-10-20T10:00:00Z",
      "created_at": "2025-10-20T09:00:00Z",
      "updated_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 1,
  "pagination": {
    "offset": 0,
    "limit": 5,
    "total": 1
  }
}
```

---

#### GET /api/posts/[slug]
**Description:** Get single post by slug

**Path Parameters:**
- `slug` (required): Post slug

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/posts/welcome-indabax-2026"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "slug": "welcome-indabax-2026",
    "title": "Welcome to IndabaX Kenya 2026",
    "excerpt": "We are excited to announce...",
    "content": "<h2>About IndabaX Kenya 2026</h2><p>...</p>",
    "featured_image": "https://...",
    "author_id": "...",
    "status": "published",
    "category": "announcement",
    "published_at": "2025-10-20T10:00:00Z",
    "created_at": "2025-10-20T09:00:00Z",
    "updated_at": "2025-10-20T10:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Post not found"
  }
}
```

---

### Speakers

#### GET /api/speakers
**Description:** List all speakers

**Query Parameters:**
- `featured` (optional): Filter featured speakers only
  - Values: `true` | `false`

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/speakers?featured=true"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Dr. Jane Mwangi",
      "title": "AI Research Lead",
      "organization": "DeepMind Africa",
      "photo_url": "https://...",
      "bio_short": "Leading researcher in NLP with focus on African languages...",
      "bio_full": "Dr. Jane Mwangi is a leading researcher...",
      "linkedin_url": "https://linkedin.com/in/...",
      "twitter_url": "https://twitter.com/...",
      "website_url": "https://...",
      "is_featured": true,
      "display_order": 1,
      "created_at": "2025-10-20T10:00:00Z",
      "updated_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 2
}
```

---

### Gallery

#### GET /api/gallery
**Description:** Get gallery photos grouped by year

**Query Parameters:**
- `year` (optional): Filter by specific year
  - Type: number
  - Example: 2024

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/gallery?year=2024"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "2024": [
      {
        "id": "...",
        "image_url": "https://...",
        "thumbnail_url": "https://...",
        "year": 2024,
        "event_id": "...",
        "event_name": "IndabaX Kenya 2024",
        "caption": "Workshop session on ML fundamentals",
        "photographer": "John Doe",
        "display_order": 1,
        "uploaded_by": "...",
        "created_at": "2024-03-20T10:00:00Z"
      }
    ],
    "2023": [...]
  },
  "count": 45
}
```

---

### FAQs

#### GET /api/faqs
**Description:** List all active FAQs

**Query Parameters:**
- `category` (optional): Filter by category
  - Values: `registration` | `venue` | `schedule` | `speakers` | `general`

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/faqs?category=registration"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "question": "How do I register for IndabaX Kenya 2026?",
      "answer": "Registration is completely free! Simply visit our registration page...",
      "category": "registration",
      "display_order": 1,
      "is_active": true,
      "created_at": "2025-10-20T10:00:00Z",
      "updated_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 3
}
```

---

### Schedule

#### GET /api/schedule
**Description:** Get event schedule

**Query Parameters:**
- `event_id` (optional): Filter by event ID
  - Type: UUID

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/schedule?event_id=550e8400-e29b-41d4-a716-446655440000"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "1": [
      {
        "id": "...",
        "event_id": "...",
        "day_number": 1,
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "title": "Opening Keynote",
        "description": "Welcome and introduction to IndabaX Kenya 2026",
        "session_type": "keynote",
        "location": "Main Hall",
        "speaker_ids": ["...", "..."],
        "created_at": "2025-10-20T10:00:00Z"
      }
    ],
    "2": [...],
    "3": [...]
  },
  "count": 24
}
```

---

### Sponsors

#### GET /api/sponsors
**Description:** List all active sponsors

**Query Parameters:**
- `tier` (optional): Filter by sponsor tier
  - Values: `platinum` | `gold` | `silver` | `bronze`

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/sponsors?tier=platinum"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "platinum": [
      {
        "id": "...",
        "name": "DeepLearning.AI",
        "logo_url": "https://...",
        "website_url": "https://deeplearning.ai",
        "tier": "platinum",
        "display_order": 1,
        "is_active": true,
        "created_at": "2025-10-20T10:00:00Z"
      }
    ],
    "gold": [...],
    "silver": [...],
    "bronze": [...]
  },
  "count": 8
}
```

---

### Settings

#### GET /api/settings/popup
**Description:** Get registration popup settings

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/settings/popup"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "title": "Register for IndabaX Kenya 2026",
    "content": "• Join 500+ AI enthusiasts<br>• Network with researchers<br>• Free workshops & talks",
    "buttonText": "Register Now",
    "buttonLink": "/register",
    "delay": 3
  }
}
```

---

## 📝 FORM SUBMISSION ENDPOINTS

### Applications

#### POST /api/applications
**Description:** Submit event registration or call for papers

**Request Body:**
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "application_type": "registration",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254700000000",
  "organization": "University of Nairobi",
  "country": "Kenya",
  "ticket_type": "general",
  "dietary_requirements": "Vegetarian",
  "tshirt_size": "L",
  "accessibility_needs": "None"
}
```

**Registration Fields:**
- `event_id` (optional): UUID
- `application_type` (required): `"registration"` | `"call_for_papers"`
- `name` (required): string
- `email` (required): string (valid email format)
- `phone` (optional): string
- `organization` (optional): string
- `country` (optional): string
- `ticket_type` (optional): `"general"` | `"student"` | `"speaker"`
- `dietary_requirements` (optional): string
- `tshirt_size` (optional): string
- `accessibility_needs` (optional): string

**Call for Papers Additional Fields:**
- `presentation_type` (optional): `"talk"` | `"workshop"` | `"poster"`
- `presentation_title` (optional): string
- `abstract` (optional): string
- `keywords` (optional): string
- `track` (optional): string
- `bio` (optional): string
- `linkedin_url` (optional): string
- `file_url` (optional): string (upload PDF first via /api/admin/upload)

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "application_type": "registration",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending",
    "submitted_at": "2025-10-20T10:00:00Z"
  },
  "message": "Application submitted successfully"
}
```

**Validation Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": {
      "name": "Name is required",
      "email": "Invalid email format"
    }
  }
}
```

**Email Sent:**
- Confirmation email sent to applicant
- Contains submission details and next steps

---

### Newsletter Subscription

#### POST /api/subscribe
**Description:** Subscribe to newsletter

**Request Body:**
```json
{
  "email": "subscriber@example.com"
}
```

**Fields:**
- `email` (required): string (valid email format)

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "subscriber@example.com",
    "status": "active",
    "subscribed_at": "2025-10-20T10:00:00Z"
  },
  "message": "Subscribed successfully"
}
```

**Already Subscribed Error (409):**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_SUBSCRIBED",
    "message": "This email is already subscribed",
    "field": "email"
  }
}
```

**Reactivation Success (200):**
```json
{
  "success": true,
  "message": "Subscription reactivated successfully"
}
```

**Email Sent:**
- Welcome email with newsletter info
- Unsubscribe link included

---

### Contact Form

#### POST /api/contact
**Description:** Submit contact form

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "Question about event",
  "message": "When does registration open?"
}
```

**Fields:**
- `name` (required): string
- `email` (required): string (valid email format)
- `subject` (optional): string (default: "Contact Form Submission")
- `message` (required): string

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "Question about event",
    "status": "new",
    "created_at": "2025-10-20T10:00:00Z"
  },
  "message": "Message sent successfully"
}
```

**Email Sent:**
- Admin notification email to `ADMIN_EMAIL`
- Contains message details and link to admin panel

---

## 🛠️ ADMIN ENDPOINTS

All admin endpoints require authentication.

### Events Management

#### GET /api/admin/events
**Description:** List all events (including drafts)

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status
  - Values: `draft` | `published` | `archived`
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/admin/events?status=draft" \
  -H "Cookie: sb-access-token=..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "slug": "indabax-kenya-2026",
      "title": "IndabaX Kenya 2026",
      "status": "published",
      "start_date": "2026-03-15",
      "created_at": "2025-10-20T10:00:00Z",
      "updated_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 1,
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 1
  }
}
```

---

#### POST /api/admin/events
**Description:** Create new event

**Authentication:** Required

**Request Body:**
```json
{
  "slug": "test-event",
  "title": "Test Event 2026",
  "description": "<p>Event description with HTML...</p>",
  "start_date": "2026-06-01",
  "end_date": "2026-06-03",
  "location": "Nairobi, Kenya",
  "venue": "KICC",
  "featured_image": "https://...",
  "status": "draft",
  "event_type": "upcoming",
  "is_featured": false,
  "venue_details": {
    "address": "...",
    "map_url": "...",
    "hotels": [...]
  }
}
```

**Required Fields:**
- `slug` (string, unique)
- `title` (string)
- `start_date` (date: YYYY-MM-DD)

**Optional Fields:**
- `description` (text/HTML)
- `end_date` (date)
- `location` (string)
- `venue` (string)
- `featured_image` (URL)
- `status` (default: "draft")
- `event_type` (default: "upcoming")
- `is_featured` (boolean, default: false)
- `venue_details` (JSON object)

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "slug": "test-event",
    "title": "Test Event 2026",
    "created_at": "2025-10-20T10:00:00Z"
  },
  "message": "Event created successfully"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": {
      "slug": "Slug already exists"
    }
  }
}
```

---

#### PUT /api/admin/events/[id]
**Description:** Update existing event

**Authentication:** Required

**Path Parameters:**
- `id` (required): Event UUID

**Request Body:** Same as POST (all fields optional for update)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "slug": "test-event",
    "title": "Updated Title",
    "updated_at": "2025-10-20T11:00:00Z"
  },
  "message": "Event updated successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found"
  }
}
```

---

#### DELETE /api/admin/events/[id]
**Description:** Delete event

**Authentication:** Required

**Path Parameters:**
- `id` (required): Event UUID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found"
  }
}
```

---

### Posts Management

#### GET /api/admin/posts
**Description:** List all posts (including drafts)

**Authentication:** Required

**Query Parameters:** Same as events

---

#### POST /api/admin/posts
**Description:** Create new post

**Authentication:** Required

**Request Body:**
```json
{
  "slug": "new-announcement",
  "title": "Important Announcement",
  "excerpt": "Short summary...",
  "content": "<h2>Full content with HTML...</h2>",
  "featured_image": "https://...",
  "status": "draft",
  "category": "announcement",
  "published_at": "2025-10-20T10:00:00Z"
}
```

**Required Fields:**
- `slug` (string, unique)
- `title` (string)
- `content` (text/HTML)

**Optional Fields:**
- `excerpt` (text)
- `featured_image` (URL)
- `status` (default: "draft")
- `category` ("news" | "announcement" | "article")
- `published_at` (timestamp)

---

#### PUT /api/admin/posts/[id]
**Description:** Update post

**Authentication:** Required

---

#### DELETE /api/admin/posts/[id]
**Description:** Delete post

**Authentication:** Required

---

### Speakers Management

#### GET /api/admin/speakers
#### POST /api/admin/speakers
#### PUT /api/admin/speakers/[id]
#### DELETE /api/admin/speakers/[id]

Similar structure to events/posts.

---

### Applications Review

#### GET /api/admin/applications
**Description:** List all applications

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status
  - Values: `pending` | `accepted` | `rejected`
- `type` (optional): Filter by application type
  - Values: `registration` | `call_for_papers`
- `limit` (optional): Results per page
- `offset` (optional): Pagination offset

**Example Request:**
```bash
curl "https://indabaxkenya.org/api/admin/applications?status=pending&type=registration" \
  -H "Cookie: sb-access-token=..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "application_type": "registration",
      "name": "John Doe",
      "email": "john@example.com",
      "organization": "University of Nairobi",
      "status": "pending",
      "submitted_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 15,
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 15
  }
}
```

---

#### PUT /api/admin/applications/[id]
**Description:** Update application status

**Authentication:** Required

**Path Parameters:**
- `id` (required): Application UUID

**Request Body:**
```json
{
  "status": "accepted",
  "admin_notes": "Great application! Looking forward to having you."
}
```

**Fields:**
- `status` (optional): `"pending"` | `"accepted"` | `"rejected"`
- `admin_notes` (optional): string

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "accepted",
    "admin_notes": "Great application!",
    "reviewed_at": "2025-10-20T11:00:00Z",
    "reviewed_by": "..."
  },
  "message": "Application updated successfully"
}
```

**Auto-Set Fields:**
- `reviewed_at`: Current timestamp
- `reviewed_by`: Current admin user ID

---

### Contact Submissions

#### GET /api/admin/contact-submissions
**Description:** List all contact form submissions

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status
  - Values: `new` | `read` | `resolved`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "subject": "Question about event",
      "message": "When does registration open?",
      "status": "new",
      "created_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 5
}
```

---

#### PUT /api/admin/contact-submissions/[id]
**Description:** Update submission status

**Authentication:** Required

**Request Body:**
```json
{
  "status": "resolved",
  "admin_notes": "Responded via email"
}
```

---

### Subscribers Management

#### GET /api/admin/subscribers
**Description:** List all newsletter subscribers

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status
  - Values: `active` | `unsubscribed`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "email": "subscriber@example.com",
      "status": "active",
      "subscribed_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 150
}
```

---

#### GET /api/admin/subscribers/export
**Description:** Export subscribers as CSV

**Authentication:** Required

**Success Response (200):**
```csv
email,status,subscribed_at
subscriber1@example.com,active,2025-10-20T10:00:00Z
subscriber2@example.com,active,2025-10-19T14:30:00Z
```

**Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="subscribers-2025-10-20.csv"
```

---

### Gallery Management

#### GET /api/admin/gallery
#### POST /api/admin/gallery

**Request Body (Create):**
```json
{
  "image_url": "https://...",
  "thumbnail_url": "https://...",
  "year": 2024,
  "event_id": "...",
  "event_name": "IndabaX Kenya 2024",
  "caption": "Workshop on ML",
  "photographer": "John Doe",
  "display_order": 1
}
```

---

### Sponsors Management

#### GET /api/admin/sponsors
#### POST /api/admin/sponsors
#### PUT /api/admin/sponsors/[id]
#### DELETE /api/admin/sponsors/[id]

Similar CRUD pattern.

---

### Team Members Management

#### GET /api/admin/team
#### POST /api/admin/team
#### PUT /api/admin/team/[id]
#### DELETE /api/admin/team/[id]

Similar CRUD pattern.

---

### FAQs Management

#### GET /api/admin/faqs
#### POST /api/admin/faqs
#### PUT /api/admin/faqs/[id]
#### DELETE /api/admin/faqs/[id]

---

### Schedule Management

#### GET /api/admin/schedule
#### POST /api/admin/schedule
#### PUT /api/admin/schedule/[id]
#### DELETE /api/admin/schedule/[id]

---

### Settings Management

#### GET /api/admin/settings
**Description:** Get all settings

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "key": "popup",
      "value": {
        "enabled": true,
        "title": "Register for IndabaX Kenya 2026",
        ...
      },
      "description": "Registration popup settings",
      "updated_at": "2025-10-20T10:00:00Z"
    }
  ]
}
```

---

#### PUT /api/admin/settings/[key]
**Description:** Update setting

**Authentication:** Required

**Path Parameters:**
- `key` (required): Setting key (e.g., "popup")

**Request Body:**
```json
{
  "value": {
    "enabled": false,
    "title": "Registration Closed",
    "content": "Thank you for your interest.",
    "buttonText": "Learn More",
    "buttonLink": "/about-us",
    "delay": 5
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "key": "popup",
    "value": {...},
    "updated_at": "2025-10-20T11:00:00Z",
    "updated_by": "..."
  },
  "message": "Setting updated successfully"
}
```

---

### File Upload

#### POST /api/admin/upload
**Description:** Upload file to Supabase Storage

**Authentication:** Required

**Request:** Multipart form data

**Form Fields:**
- `file` (required): File to upload
- `bucket` (required): Target bucket name
  - Values: `event-images` | `speaker-photos` | `gallery-photos` | `sponsor-logos` | `team-photos` | `post-images` | `uploads`

**Example Request:**
```bash
curl -X POST "https://indabaxkenya.org/api/admin/upload" \
  -H "Cookie: sb-access-token=..." \
  -F "file=@photo.jpg" \
  -F "bucket=event-images"
```

**Success Response (201):**
```json
{
  "success": true,
  "url": "https://pqndsvfoobctutaeyleq.supabase.co/storage/v1/object/public/event-images/1729431234567-photo.jpg",
  "path": "1729431234567-photo.jpg",
  "bucket": "event-images"
}
```

**Validation:**
- Image files: JPG, PNG, WebP only
- Image max size: 5MB (event, speaker, team, post images), 10MB (gallery)
- Logo files: SVG, PNG only, max 2MB
- PDF files: Max 10MB (uploads bucket only)

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPG, PNG, and WebP images are allowed"
  }
}
```

**File Too Large Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5MB limit"
  }
}
```

---

## ⚠️ ERROR HANDLING

### Error Response Structure

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "field_name",
    "fields": {
      "field1": "Error message",
      "field2": "Error message"
    }
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_SUBSCRIBED` | 409 | Duplicate subscription |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `INVALID_FILE_TYPE` | 400 | Unsupported file format |
| `FILE_TOO_LARGE` | 400 | File exceeds size limit |

### Error Examples

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": {
      "email": "Invalid email format",
      "name": "Name is required"
    }
  }
}
```

**Authentication Error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Not Found Error:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found"
  }
}
```

---

## 🚦 RATE LIMITING

**Status:** Not implemented in Phase 2

**Future Implementation:**
- Public endpoints: 100 requests/minute per IP
- Form submissions: 5 requests/minute per IP
- Admin endpoints: 500 requests/minute per user

---

## 📊 DATA MODELS

### Event
```typescript
interface Event {
  id: string // UUID
  slug: string // unique
  title: string
  description: string | null
  start_date: string // YYYY-MM-DD
  end_date: string | null
  location: string | null
  venue: string | null
  featured_image: string | null
  status: 'draft' | 'published' | 'archived'
  event_type: 'upcoming' | 'past'
  is_featured: boolean
  venue_details: {
    address?: string
    map_url?: string
    hotels?: string[]
  }
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}
```

### Post
```typescript
interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  featured_image: string | null
  author_id: string | null
  status: 'draft' | 'published'
  category: 'news' | 'announcement' | 'article'
  published_at: string | null
  created_at: string
  updated_at: string
}
```

### Speaker
```typescript
interface Speaker {
  id: string
  name: string
  title: string | null
  organization: string | null
  photo_url: string | null
  bio_short: string | null
  bio_full: string | null
  linkedin_url: string | null
  twitter_url: string | null
  website_url: string | null
  is_featured: boolean
  display_order: number
  created_at: string
  updated_at: string
}
```

### Application
```typescript
interface Application {
  id: string
  event_id: string | null
  application_type: 'registration' | 'call_for_papers'

  // Personal Info
  name: string
  email: string
  phone: string | null
  organization: string | null
  country: string | null

  // Registration Fields
  ticket_type: 'general' | 'student' | 'speaker' | null
  dietary_requirements: string | null
  tshirt_size: string | null
  accessibility_needs: string | null

  // Call for Papers Fields
  presentation_type: 'talk' | 'workshop' | 'poster' | null
  presentation_title: string | null
  abstract: string | null
  keywords: string | null
  track: string | null
  bio: string | null
  linkedin_url: string | null
  file_url: string | null

  // Status
  status: 'pending' | 'accepted' | 'rejected'
  admin_notes: string | null

  // Timestamps
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}
```

### Subscriber
```typescript
interface Subscriber {
  id: string
  email: string
  status: 'active' | 'unsubscribed'
  subscribed_at: string
  unsubscribed_at: string | null
}
```

### Photo
```typescript
interface Photo {
  id: string
  image_url: string
  thumbnail_url: string | null
  year: number
  event_id: string | null
  event_name: string | null
  caption: string | null
  photographer: string | null
  display_order: number
  uploaded_by: string | null
  created_at: string
}
```

### FAQ
```typescript
interface FAQ {
  id: string
  question: string
  answer: string
  category: 'registration' | 'venue' | 'schedule' | 'speakers' | 'general'
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### Sponsor
```typescript
interface Sponsor {
  id: string
  name: string
  logo_url: string
  website_url: string | null
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  display_order: number
  is_active: boolean
  created_at: string
}
```

---

## 📚 EXAMPLES

### Complete Registration Flow

```typescript
// 1. User submits registration form
const response = await fetch('/api/applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    application_type: 'registration',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+254700000000',
    organization: 'University of Nairobi',
    country: 'Kenya',
    ticket_type: 'student',
    dietary_requirements: 'Vegetarian',
    tshirt_size: 'M'
  })
})

const result = await response.json()

if (result.success) {
  console.log('Registration successful!')
  console.log('Application ID:', result.data.id)
  // User receives confirmation email automatically
} else {
  console.error('Registration failed:', result.error.message)
  if (result.error.fields) {
    // Display field-specific errors
    Object.entries(result.error.fields).forEach(([field, message]) => {
      console.log(`${field}: ${message}`)
    })
  }
}
```

### Admin Review Flow

```typescript
// 1. Admin fetches pending applications
const applicationsResponse = await fetch('/api/admin/applications?status=pending')
const applications = await applicationsResponse.json()

// 2. Admin reviews and accepts application
const updateResponse = await fetch(`/api/admin/applications/${applicationId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'accepted',
    admin_notes: 'Great application! Looking forward to having you at IndabaX.'
  })
})

const result = await updateResponse.json()
// Application status updated
// Reviewed timestamp and admin ID automatically set
```

---

**Version:** 1.0
**Last Updated:** October 20, 2025
**Status:** ✅ Complete - Ready for implementation
