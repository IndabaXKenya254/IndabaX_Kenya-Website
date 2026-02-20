# Day-by-Day Execution Plan
## Phase 2 Backend - Complete Implementation Roadmap

**Purpose:** Detailed 28-day execution plan with zero ambiguity

**Timeline:** 4 weeks (Days 1-28)

**Status:** Planning Phase - Ready to Execute

**Date:** October 20, 2025

---

## 📊 OVERVIEW

| Week | Days | Focus | Deliverables |
|------|------|-------|--------------|
| **Week 1** | 1-7 | Database + Public API + Forms | Schema, API endpoints, submissions working |
| **Week 2** | 8-14 | Admin Panel + CRUD | Full admin dashboard with all management pages |
| **Week 3** | 15-21 | Frontend Integration | Connect all frontend pages to real data |
| **Week 4** | 22-28 | Testing + Polish + Deploy | Production-ready deployment |

---

## 🎯 SUCCESS METRICS

- ✅ All 15 database tables created
- ✅ All 33+ API endpoints working
- ✅ Admin panel fully functional
- ✅ Forms submitting to database
- ✅ Email system operational
- ✅ File uploads working
- ✅ Authentication secure
- ✅ Deployed to production
- ✅ Zero critical bugs

---

# WEEK 1: Foundation

## DAY 1 - Database Schema Setup
**Date:** Day 1
**Time Estimate:** 6 hours
**Status:** Partially Complete (30%)

### ✅ COMPLETED
1. Environment setup (.env.local)
2. Supabase client configuration
3. Connection testing

### ⏳ REMAINING TASKS

#### Task 1.1: Create Migration File (90 min)
**File:** `supabase/migrations/20251020_initial_schema.sql`

**Actions:**
1. Create directory structure:
   ```bash
   mkdir -p supabase/migrations
   ```

2. Create migration file with 5 sections:
   - Extensions (uuid-ossp, pg_trgm)
   - 15 table definitions
   - Indexes (~45 indexes)
   - RLS policies (~30 policies)
   - Seed data (sample content)

**Reference:** See DATABASE_IMPLEMENTATION_PLAN.md for complete SQL

**Validation:**
- [ ] File created: `supabase/migrations/20251020_initial_schema.sql`
- [ ] File size: ~1,200 lines
- [ ] All 15 tables defined
- [ ] All indexes included
- [ ] All RLS policies included
- [ ] Seed data included

---

#### Task 1.2: Run Migration (15 min)
**Actions:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire migration file
3. Paste and click "RUN"
4. Wait for completion message

**Expected Output:**
```
Success. No rows returned
```

**Validation Queries:**
```sql
-- Check tables created
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 15

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- All should show 't'

-- Check seed data
SELECT COUNT(*) FROM public.events; -- Expected: 1
SELECT COUNT(*) FROM public.speakers; -- Expected: 2
SELECT COUNT(*) FROM public.posts; -- Expected: 1
SELECT COUNT(*) FROM public.faqs; -- Expected: 3
SELECT COUNT(*) FROM public.settings; -- Expected: 2
```

**Success Criteria:**
- [ ] All queries return expected counts
- [ ] No errors in Supabase logs
- [ ] RLS enabled on all tables

---

#### Task 1.3: Create Storage Buckets (30 min)
**Location:** Supabase Dashboard → Storage → New Bucket

**Buckets to Create:**

1. **event-images** (Public)
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

2. **speaker-photos** (Public)
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

3. **gallery-photos** (Public)
   - Public: ✅ Yes
   - File size limit: 10 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

4. **sponsor-logos** (Public)
   - Public: ✅ Yes
   - File size limit: 2 MB
   - Allowed MIME types: image/svg+xml, image/png

5. **team-photos** (Public)
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

6. **post-images** (Public)
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

7. **uploads** (Private)
   - Public: ❌ No
   - File size limit: 10 MB
   - Allowed MIME types: application/pdf, image/*, text/plain

**Validation:**
- [ ] All 7 buckets visible in Storage
- [ ] Public buckets accessible without auth
- [ ] Private bucket requires auth

---

#### Task 1.4: Create First Admin User (15 min)
**Location:** Supabase Dashboard → Authentication → Users

**Steps:**
1. Click "Invite User"
2. Email: `admin@indabaxkenya.org`
3. Generate strong password (save securely)
4. Confirm user creation
5. Copy user UUID from users table

6. Add to admin_roles table:
   ```sql
   INSERT INTO public.admin_roles (user_id, role, permissions)
   VALUES ('PASTE_USER_UUID_HERE', 'super_admin', '{}');
   ```

**Validation:**
- [ ] User exists in auth.users table
- [ ] User exists in admin_roles table with super_admin role
- [ ] Password saved securely

---

#### Task 1.5: Test Database Connection (10 min)
**Test:** Run existing test endpoint

```bash
curl http://localhost:3000/api/test-supabase
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Supabase connection successful!",
  "connection": "OK"
}
```

**Additional Manual Tests:**
```sql
-- Test public read (should work)
SELECT * FROM events WHERE status = 'published';

-- Test admin check function
SELECT is_admin(); -- Should return false (not logged in)
```

**Success Criteria:**
- [ ] Test endpoint returns success
- [ ] Can query published events
- [ ] is_admin() function works

---

### DAY 1 ACCEPTANCE CRITERIA

- [x] Supabase environment configured
- [x] Centralized client created
- [x] Connection tested
- [ ] Migration file created (~1,200 lines)
- [ ] All 15 tables created in database
- [ ] All indexes created
- [ ] RLS enabled on all tables
- [ ] All RLS policies active
- [ ] Seed data inserted
- [ ] 7 storage buckets created
- [ ] First admin user created
- [ ] Admin role assigned
- [ ] Database fully validated

**Completion:** 30% → 100%

---

## DAY 2 - Public API Endpoints (Part 1)
**Date:** Day 2
**Time Estimate:** 6 hours
**Status:** Not Started

### GOAL
Create public GET endpoints for events, posts, speakers, gallery, FAQs, schedule, sponsors

### Task 2.1: Events API (45 min)

#### File: `src/app/api/events/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/events - List all published events
export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type') // upcoming | past
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    let query = supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('start_date', { ascending: type === 'upcoming' })
      .limit(limit)

    if (type) {
      query = query.eq('event_type', type)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch events',
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

#### File: `src/app/api/events/[slug]/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/events/:slug - Get single event by slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_speakers (
          role,
          speaker:speakers (*)
        ),
        schedule_items (*)
      `)
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found'
        }
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

**Test:**
```bash
curl http://localhost:3000/api/events
curl http://localhost:3000/api/events/indabax-kenya-2026
```

**Validation:**
- [ ] GET /api/events returns all published events
- [ ] Filtering by type works (?type=upcoming)
- [ ] Limit parameter works
- [ ] GET /api/events/[slug] returns single event with speakers
- [ ] Non-existent slug returns 404
- [ ] Draft events not returned

---

### Task 2.2: Posts API (45 min)

#### File: `src/app/api/posts/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/posts - List all published posts
export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category') // news | announcement | article
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch posts',
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      count,
      pagination: {
        offset,
        limit,
        total: count
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

#### File: `src/app/api/posts/[slug]/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/posts/:slug - Get single post
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found'
        }
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

**Test:**
```bash
curl http://localhost:3000/api/posts
curl http://localhost:3000/api/posts?category=announcement&limit=5
curl http://localhost:3000/api/posts/welcome-indabax-2026
```

**Validation:**
- [ ] GET /api/posts returns published posts
- [ ] Pagination works (offset, limit)
- [ ] Category filtering works
- [ ] Posts ordered by published_at descending
- [ ] Draft posts not returned

---

### Task 2.3: Speakers API (30 min)

#### File: `src/app/api/speakers/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/speakers - List all speakers
export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const featured = searchParams.get('featured') === 'true'

  try {
    let query = supabase
      .from('speakers')
      .select('*')
      .order('display_order', { ascending: true })

    if (featured) {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch speakers',
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

**Test:**
```bash
curl http://localhost:3000/api/speakers
curl http://localhost:3000/api/speakers?featured=true
```

**Validation:**
- [ ] Returns all speakers
- [ ] Featured filter works
- [ ] Ordered by display_order

---

### Task 2.4: Gallery API (30 min)

#### File: `src/app/api/gallery/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/gallery - Get gallery photos
export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const year = searchParams.get('year')

  try {
    let query = supabase
      .from('photos')
      .select('*')
      .order('year', { ascending: false })
      .order('display_order', { ascending: true })

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch photos',
        }
      }, { status: 500 })
    }

    // Group by year
    const photosByYear = data.reduce((acc, photo) => {
      if (!acc[photo.year]) {
        acc[photo.year] = []
      }
      acc[photo.year].push(photo)
      return acc
    }, {} as Record<number, typeof data>)

    return NextResponse.json({
      success: true,
      data: photosByYear,
      count: data.length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

**Test:**
```bash
curl http://localhost:3000/api/gallery
curl http://localhost:3000/api/gallery?year=2024
```

**Validation:**
- [ ] Returns photos grouped by year
- [ ] Year filter works
- [ ] Ordered correctly

---

### Task 2.5: FAQs, Schedule, Sponsors APIs (60 min)

Similar pattern to above. Create:
- `src/app/api/faqs/route.ts`
- `src/app/api/schedule/route.ts` (with event_id filter)
- `src/app/api/sponsors/route.ts`

**Test each endpoint**

---

### Task 2.6: Settings API (30 min)

#### File: `src/app/api/settings/popup/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/settings/popup - Get popup settings
export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'popup')
      .single()

    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Popup settings not found'
        }
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: data.value
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

---

### DAY 2 ACCEPTANCE CRITERIA

- [ ] GET /api/events (list)
- [ ] GET /api/events/[slug] (single)
- [ ] GET /api/posts (list with pagination)
- [ ] GET /api/posts/[slug] (single)
- [ ] GET /api/speakers (list with featured filter)
- [ ] GET /api/gallery (grouped by year)
- [ ] GET /api/faqs (list by category)
- [ ] GET /api/schedule (by event_id)
- [ ] GET /api/sponsors (by tier)
- [ ] GET /api/settings/popup
- [ ] All endpoints return structured errors
- [ ] All endpoints tested manually
- [ ] Build successful (npm run build)

**Completion:** 0% → 100%

---

## DAY 3 - Form Submission APIs
**Date:** Day 3
**Time Estimate:** 6 hours
**Status:** Not Started

### GOAL
Create POST endpoints for applications, subscriptions, and contact forms

### Task 3.1: Application Submission API (90 min)

#### File: `src/app/api/applications/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/applications - Submit application
export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()

    // Validate required fields
    const errors: Record<string, string> = {}

    if (!body.name) errors.name = 'Name is required'
    if (!body.email) errors.email = 'Email is required'
    if (!body.application_type) errors.application_type = 'Application type is required'

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (body.email && !emailRegex.test(body.email)) {
      errors.email = 'Invalid email format'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields: errors
        }
      }, { status: 400 })
    }

    // Insert application
    const { data, error } = await supabase
      .from('applications')
      .insert({
        event_id: body.event_id || null,
        application_type: body.application_type,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        organization: body.organization || null,
        country: body.country || null,
        ticket_type: body.ticket_type || null,
        dietary_requirements: body.dietary_requirements || null,
        tshirt_size: body.tshirt_size || null,
        accessibility_needs: body.accessibility_needs || null,
        presentation_type: body.presentation_type || null,
        presentation_title: body.presentation_title || null,
        abstract: body.abstract || null,
        keywords: body.keywords || null,
        track: body.track || null,
        bio: body.bio || null,
        linkedin_url: body.linkedin_url || null,
        file_url: body.file_url || null,
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to submit application'
        }
      }, { status: 500 })
    }

    // TODO: Send confirmation email (Day 5)

    return NextResponse.json({
      success: true,
      data,
      message: 'Application submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "application_type": "registration",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254700000000",
    "ticket_type": "general"
  }'
```

**Validation:**
- [ ] Required fields validated
- [ ] Email format validated
- [ ] Application inserted to database
- [ ] Returns 201 status on success
- [ ] Returns structured errors on validation failure
- [ ] Can submit registration application
- [ ] Can submit call_for_papers application

---

### Task 3.2: Newsletter Subscription API (30 min)

#### File: `src/app/api/subscribe/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/subscribe - Subscribe to newsletter
export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()

    // Validate email
    if (!body.email) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
          field: 'email'
        }
      }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          field: 'email'
        }
      }, { status: 400 })
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('email', body.email)
      .single()

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({
          success: false,
          error: {
            code: 'ALREADY_SUBSCRIBED',
            message: 'This email is already subscribed',
            field: 'email'
          }
        }, { status: 409 })
      } else {
        // Reactivate subscription
        const { error } = await supabase
          .from('subscribers')
          .update({
            status: 'active',
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null
          })
          .eq('id', existing.id)

        if (error) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to reactivate subscription'
            }
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Subscription reactivated successfully'
        })
      }
    }

    // Insert new subscriber
    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email: body.email,
        status: 'active',
        subscribed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to subscribe'
        }
      }, { status: 500 })
    }

    // TODO: Send welcome email (Day 5)

    return NextResponse.json({
      success: true,
      data,
      message: 'Subscribed successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Validation:**
- [ ] Email validation works
- [ ] Duplicate detection works
- [ ] Reactivation works
- [ ] New subscription works
- [ ] Returns appropriate status codes

---

### Task 3.3: Contact Form API (30 min)

#### File: `src/app/api/contact/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/contact - Submit contact form
export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()

    // Validate required fields
    const errors: Record<string, string> = {}

    if (!body.name) errors.name = 'Name is required'
    if (!body.email) errors.email = 'Email is required'
    if (!body.message) errors.message = 'Message is required'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (body.email && !emailRegex.test(body.email)) {
      errors.email = 'Invalid email format'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields: errors
        }
      }, { status: 400 })
    }

    // Insert contact submission
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: body.name,
        email: body.email,
        subject: body.subject || 'Contact Form Submission',
        message: body.message,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to submit contact form'
        }
      }, { status: 500 })
    }

    // TODO: Send notification email to admin (Day 5)

    return NextResponse.json({
      success: true,
      data,
      message: 'Message sent successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "Test Message",
    "message": "This is a test message"
  }'
```

**Validation:**
- [ ] Required fields validated
- [ ] Email format validated
- [ ] Submission inserted to database
- [ ] Returns 201 on success

---

### Task 3.4: Frontend Integration - Test Forms (120 min)

Update existing form components to use real API:

#### Update: `src/components/Register/RegistrationForm.tsx`

```typescript
"use client"

import { useState } from 'react'

export default function RegistrationForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const data = {
      application_type: 'registration',
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      organization: formData.get('organization'),
      country: formData.get('country'),
      ticket_type: formData.get('ticket_type'),
      dietary_requirements: formData.get('dietary_requirements'),
      tshirt_size: formData.get('tshirt_size'),
      accessibility_needs: formData.get('accessibility_needs'),
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error?.fields) {
          setErrors(result.error.fields)
        } else {
          setErrors({ general: result.error?.message || 'Submission failed' })
        }
        return
      }

      setSuccess(true)
      e.currentTarget.reset()
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {success && (
        <div className="alert alert-success">
          Registration submitted successfully! Check your email for confirmation.
        </div>
      )}

      {errors.general && (
        <div className="alert alert-danger">{errors.general}</div>
      )}

      {/* Form fields... */}

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Registration'}
      </button>
    </form>
  )
}
```

Similar updates for:
- `src/components/CallForPapers/CallForPapersForm.tsx`
- `src/components/NewsletterSubscription.tsx`
- `src/components/ContactUs/ContactForm.tsx`

**Validation:**
- [ ] Registration form submits to database
- [ ] Call for Papers form submits to database
- [ ] Newsletter subscription works
- [ ] Contact form works
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Forms reset after success

---

### DAY 3 ACCEPTANCE CRITERIA

- [ ] POST /api/applications endpoint created
- [ ] POST /api/subscribe endpoint created
- [ ] POST /api/contact endpoint created
- [ ] All validation working (required fields, email format)
- [ ] Duplicate email detection for subscribers
- [ ] All forms submit to database
- [ ] Error handling displays to user
- [ ] Success messages display
- [ ] Manual testing complete
- [ ] Build successful

**Completion:** 0% → 100%

---

## DAY 4 - Email Integration Setup
**Date:** Day 4
**Time Estimate:** 6 hours
**Status:** Not Started

### GOAL
Set up Resend email service and create email templates

### Task 4.1: Resend Setup (30 min)

**Actions:**
1. Sign up at resend.com
2. Get API key
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ADMIN_EMAIL=admin@indabaxkenya.org
   ```

4. Install package:
   ```bash
   npm install resend
   ```

**Validation:**
- [ ] Resend account created
- [ ] API key added to .env.local
- [ ] Package installed

---

### Task 4.2: Email Utility (45 min)

#### File: `lib/email/client.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'IndabaX Kenya <noreply@indabaxkenya.org>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email sending failed:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}
```

---

### Task 4.3: Email Templates (90 min)

#### File: `lib/email/templates/application-confirmation.tsx`

```typescript
interface ApplicationConfirmationProps {
  name: string
  applicationType: 'registration' | 'call_for_papers'
  submittedAt: string
}

export function ApplicationConfirmation({
  name,
  applicationType,
  submittedAt
}: ApplicationConfirmationProps) {
  const type = applicationType === 'registration' ? 'Registration' : 'Call for Papers'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a5490; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #1a5490; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>IndabaX Kenya 2026</h1>
          </div>
          <div class="content">
            <h2>Thank you for your ${type}!</h2>
            <p>Dear ${name},</p>
            <p>We have successfully received your ${type.toLowerCase()} for IndabaX Kenya 2026.</p>
            <p><strong>Submitted:</strong> ${new Date(submittedAt).toLocaleString()}</p>
            ${applicationType === 'registration' ? `
              <p>You will receive a confirmation email with your ticket closer to the event date.</p>
            ` : `
              <p>Our review committee will evaluate your submission and get back to you within 2-3 weeks.</p>
            `}
            <p>If you have any questions, please contact us at info@indabaxkenya.org</p>
            <a href="https://indabaxkenya.org" class="button">Visit Website</a>
          </div>
          <div class="footer">
            <p>&copy; 2026 IndabaX Kenya. All rights reserved.</p>
            <p>University of Nairobi, Nairobi, Kenya</p>
          </div>
        </div>
      </body>
    </html>
  `
}
```

#### File: `lib/email/templates/subscription-welcome.tsx`

```typescript
interface SubscriptionWelcomeProps {
  email: string
}

export function SubscriptionWelcome({ email }: SubscriptionWelcomeProps) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a5490; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to IndabaX Kenya!</h1>
          </div>
          <div class="content">
            <p>Thank you for subscribing to our newsletter!</p>
            <p>You'll receive updates about:</p>
            <ul>
              <li>Event announcements</li>
              <li>Speaker lineups</li>
              <li>Registration opening</li>
              <li>AI/ML news and resources</li>
            </ul>
            <p>Stay tuned for exciting updates!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 IndabaX Kenya</p>
            <p><a href="#">Unsubscribe</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}
```

#### File: `lib/email/templates/contact-notification.tsx`

```typescript
interface ContactNotificationProps {
  name: string
  email: string
  subject: string
  message: string
  submittedAt: string
}

export function ContactNotification({
  name,
  email,
  subject,
  message,
  submittedAt
}: ContactNotificationProps) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; }
          .content { padding: 20px; background: #f9f9f9; }
          .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #1a5490; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="info">
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Submitted:</strong> ${new Date(submittedAt).toLocaleString()}</p>
            </div>
            <div class="info">
              <p><strong>Message:</strong></p>
              <p>${message}</p>
            </div>
            <p><a href="https://indabaxkenya.org/admin/contact-submissions">View in Admin Panel</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}
```

---

### Task 4.4: Integrate Email Sending (90 min)

Update API routes to send emails:

#### Update: `src/app/api/applications/route.ts`

```typescript
import { sendEmail } from '@/lib/email/client'
import { ApplicationConfirmation } from '@/lib/email/templates/application-confirmation'

// After successful insert:
await sendEmail({
  to: data.email,
  subject: `IndabaX Kenya 2026 - ${data.application_type === 'registration' ? 'Registration' : 'Call for Papers'} Confirmation`,
  html: ApplicationConfirmation({
    name: data.name,
    applicationType: data.application_type,
    submittedAt: data.submitted_at
  })
})
```

#### Update: `src/app/api/subscribe/route.ts`

```typescript
import { sendEmail } from '@/lib/email/client'
import { SubscriptionWelcome } from '@/lib/email/templates/subscription-welcome'

// After successful insert:
await sendEmail({
  to: data.email,
  subject: 'Welcome to IndabaX Kenya Newsletter',
  html: SubscriptionWelcome({ email: data.email })
})
```

#### Update: `src/app/api/contact/route.ts`

```typescript
import { sendEmail } from '@/lib/email/client'
import { ContactNotification } from '@/lib/email/templates/contact-notification'

// After successful insert:
// Send notification to admin
await sendEmail({
  to: process.env.ADMIN_EMAIL!,
  subject: `New Contact Form: ${data.subject}`,
  html: ContactNotification({
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    submittedAt: data.created_at
  })
})
```

---

### Task 4.5: Test Email Sending (60 min)

**Actions:**
1. Submit test registration → Check email received
2. Submit test subscription → Check welcome email
3. Submit test contact form → Check admin notification
4. Check Resend dashboard for delivery logs

**Validation:**
- [ ] Application confirmation emails sent
- [ ] Welcome emails sent for subscriptions
- [ ] Admin notifications sent for contact forms
- [ ] Emails received in inbox (check spam)
- [ ] Email templates render correctly
- [ ] Links in emails work
- [ ] Resend dashboard shows delivery

---

### DAY 4 ACCEPTANCE CRITERIA

- [ ] Resend account created and configured
- [ ] Email client utility created
- [ ] 3 email templates created
- [ ] All forms send confirmation emails
- [ ] Contact form sends admin notification
- [ ] Emails tested and working
- [ ] Email deliverability verified
- [ ] Error handling for failed emails

**Completion:** 0% → 100%

---

## DAY 5-7 - Authentication System
**Date:** Days 5-7
**Time Estimate:** 12 hours total
**Status:** Not Started

### GOAL
Implement admin login, middleware, and route protection

### Day 5: Login Page (4 hours)

#### Task 5.1: Create Login Page (90 min)

#### File: `src/app/admin/login/page.tsx`

```typescript
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Check if user is admin
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      if (!adminRole) {
        await supabase.auth.signOut()
        setError('Access denied. You do not have admin privileges.')
        return
      }

      // Redirect to dashboard
      router.push('/admin/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-4">
          <h2 className="text-center mb-4">Admin Login</h2>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

**Test:**
1. Visit http://localhost:3000/admin/login
2. Try invalid credentials → Should show error
3. Try valid admin credentials → Should redirect to dashboard

---

### Day 6: Middleware (4 hours)

#### Task 6.1: Auth Helper (60 min)

#### File: `lib/auth/server.ts`

```typescript
import { createServerClient } from '@/lib/supabase'

export async function getCurrentUser() {
  const supabase = createServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getAdminRole(userId: string) {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('admin_roles')
    .select('role, permissions')
    .eq('user_id', userId)
    .single()

  return data
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminRole = await getAdminRole(user.id)

  if (!adminRole) {
    throw new Error('Not authorized')
  }

  return { user, role: adminRole }
}
```

---

### Day 7: Protected Routes (4 hours)

#### Task 7.1: Admin Dashboard (120 min)

#### File: `src/app/admin/dashboard/page.tsx`

```typescript
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/server'
import AdminLayout from '@/components/Admin/AdminLayout'

export default async function AdminDashboardPage() {
  try {
    const { user, role } = await requireAdmin()
  } catch (error) {
    redirect('/admin/login')
  }

  return (
    <AdminLayout>
      <h1>Admin Dashboard</h1>
      <div className="row">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5>Total Events</h5>
              <p className="h2">5</p>
            </div>
          </div>
        </div>
        {/* More stats cards */}
      </div>
    </AdminLayout>
  )
}
```

---

### DAYS 5-7 ACCEPTANCE CRITERIA

- [ ] Admin login page created
- [ ] Login authentication working
- [ ] Admin role verification working
- [ ] Auth helper functions created
- [ ] Protected routes implemented
- [ ] Unauthorized access redirects to login
- [ ] Dashboard accessible after login
- [ ] Logout functionality works

**Completion:** 0% → 100%

---

# WEEK 2: Admin Panel

## DAYS 8-14 - Admin CRUD Pages
**Status:** Not Started
**Time Estimate:** 42 hours (6 hours/day)

### Admin Pages to Build:
1. Dashboard (stats overview)
2. Events management (list, create, edit, delete)
3. Posts management
4. Speakers management
5. Gallery management
6. Applications review
7. Contact submissions
8. Subscribers list
9. Sponsors management
10. Team management
11. FAQs management
12. Schedule management
13. Settings

*Detailed tasks for Week 2 will follow same pattern as Week 1*

---

# WEEK 3: Frontend Integration

## DAYS 15-21 - Connect Frontend to Backend
**Status:** Not Started
**Time Estimate:** 42 hours

### Pages to Integrate:
1. Home page (events, speakers from API)
2. Events page (real data)
3. News page (real posts)
4. Speakers page (real data)
5. Gallery page (real photos)
6. Schedule page (real schedule)
7. All forms (already done Day 3)

---

# WEEK 4: Testing & Deployment

## DAYS 22-28 - Final Testing & Launch
**Status:** Not Started
**Time Estimate:** 42 hours

### Tasks:
1. Complete testing checklist
2. Performance optimization
3. Security review
4. Production deployment
5. Client handoff

---

## 📊 PROGRESS TRACKING

Update this daily:

- [ ] Day 1: Database setup (0/6 hours)
- [ ] Day 2: Public API (0/6 hours)
- [ ] Day 3: Form APIs (0/6 hours)
- [ ] Day 4: Email integration (0/6 hours)
- [ ] Day 5: Authentication (0/4 hours)
- [ ] Day 6: Middleware (0/4 hours)
- [ ] Day 7: Protected routes (0/4 hours)
- [ ] Days 8-14: Admin panel (0/42 hours)
- [ ] Days 15-21: Frontend integration (0/42 hours)
- [ ] Days 22-28: Testing & deployment (0/42 hours)

**Total:** 0/168 hours (0%)

---

**Status:** ✅ PLAN COMPLETE - Ready for Day 1 execution
**Next:** Begin Day 1 - Complete database setup
**Estimated Completion:** 28 days from start
