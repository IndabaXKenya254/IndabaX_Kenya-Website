# Supabase Setup & Usage Guide

## 📋 Overview

This guide documents the Supabase backend integration for IndabaX Kenya website. Supabase provides PostgreSQL database, authentication, and storage services.

---

## 🔧 Setup Complete

### 1. **Environment Variables** (`.env.local`)

Location: `/home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://pqndsvfoobctutaeyleq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Important:**
- ✅ Already in `.gitignore` (line 29: `.env*.local`)
- ❌ NEVER commit this file to git
- ⚠️ Service role key has full admin access - use with caution

---

### 2. **Centralized Supabase Client**

Location: `lib/supabase/`

#### **Browser Client** (`lib/supabase/client.ts`)
For use in **Client Components** (components with `"use client"`)

```typescript
import { createBrowserClient } from '@/lib/supabase'

export function MyComponent() {
  const supabase = createBrowserClient()

  // Use supabase client
  const { data, error } = await supabase
    .from('events')
    .select('*')
}
```

#### **Server Client** (`lib/supabase/server.ts`)
For use in **Server Components** and **API Routes**

```typescript
import { createServerClient } from '@/lib/supabase'

export async function MyServerComponent() {
  const supabase = createServerClient()

  // Use supabase client
  const { data, error } = await supabase
    .from('events')
    .select('*')
}
```

#### **Admin Client** (`lib/supabase/server.ts`)
For administrative operations (bypasses RLS policies)

```typescript
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createAdminClient()

  // Full admin access - use with caution
  const { data, error } = await supabase
    .from('admins')
    .insert({ ... })
}
```

---

## 🧪 Testing Connection

### API Endpoint: `/api/test-supabase`

**Test the connection:**
```bash
curl http://localhost:3000/api/test-supabase
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Supabase connection successful! (No tables created yet)",
  "connection": "OK",
  "url": "https://pqndsvfoobctutaeyleq.supabase.co",
  "timestamp": "2025-10-20T17:52:50.236Z",
  "note": "Database is empty - ready for schema creation"
}
```

**Error Response (if connection fails):**
```json
{
  "success": false,
  "message": "Supabase connection failed",
  "error": "Error message here",
  "connection": "FAILED"
}
```

---

## 📚 Usage Examples

### Example 1: Fetch Events (Client Component)

```typescript
"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

export default function EventsList() {
  const [events, setEvents] = useState([])
  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        console.error('Error:', error)
        return
      }

      setEvents(data)
    }

    fetchEvents()
  }, [])

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  )
}
```

### Example 2: Fetch Events (Server Component)

```typescript
import { createServerClient } from '@/lib/supabase'

export default async function EventsPage() {
  const supabase = createServerClient()

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    return <div>Error loading events</div>
  }

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  )
}
```

### Example 3: API Route (Form Submission)

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('registrations')
    .insert({
      name: body.name,
      email: body.email,
      created_at: new Date().toISOString(),
    })
    .select()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
```

### Example 4: Authentication (Login)

```typescript
import { createBrowserClient } from '@/lib/supabase'

export async function login(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
```

### Example 5: Upload Image

```typescript
import { createBrowserClient } from '@/lib/supabase'

export async function uploadImage(file: File, bucket: string) {
  const supabase = createBrowserClient()
  const fileName = `${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)

  if (error) {
    throw new Error(error.message)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return publicUrl
}
```

---

## 🔐 Security Best Practices

### 1. **Client vs Server Components**

| Use Case | Client | Recommendation |
|----------|--------|----------------|
| Public data (events, news) | `createBrowserClient()` | ✅ Safe |
| User authentication | `createBrowserClient()` | ✅ Safe |
| Admin operations | `createServerClient()` | ✅ Recommended |
| Sensitive data | `createServerClient()` | ✅ Required |
| Bypass RLS | `createAdminClient()` | ⚠️ API routes only |

### 2. **Row Level Security (RLS)**

Always enable RLS on all tables:

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Example: Public read access
CREATE POLICY "Events are publicly readable"
  ON events FOR SELECT
  USING (true);

-- Example: Admin-only write access
CREATE POLICY "Only admins can insert events"
  ON events FOR INSERT
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admins));
```

### 3. **Environment Variables**

- ✅ `NEXT_PUBLIC_*` - Safe for browser (public data only)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Server-side only (never expose to browser)

### 4. **Admin Client Usage**

```typescript
// ❌ BAD - Don't use in Client Components
"use client"
import { createAdminClient } from '@/lib/supabase'

// ✅ GOOD - Use in API Routes only
// app/api/admin/route.ts
import { createAdminClient } from '@/lib/supabase'
export async function POST(request: Request) {
  const supabase = createAdminClient()
  // Admin operations here
}
```

---

## 📦 Installed Packages

```json
{
  "@supabase/supabase-js": "^2.75.0",
  "@supabase/ssr": "^0.6.0"
}
```

---

## 🗄️ Database Schema (To Be Created)

See `DATABASE_SCHEMA.md` for the complete schema including:
- Tables structure
- Relationships
- Indexes
- RLS policies
- Functions and triggers

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/pqndsvfoobctutaeyleq
- **Database**: https://supabase.com/dashboard/project/pqndsvfoobctutaeyleq/editor
- **Authentication**: https://supabase.com/dashboard/project/pqndsvfoobctutaeyleq/auth/users
- **Storage**: https://supabase.com/dashboard/project/pqndsvfoobctutaeyleq/storage/buckets
- **API Docs**: https://supabase.com/dashboard/project/pqndsvfoobctutaeyleq/api

---

## 🐛 Troubleshooting

### Connection Failed

**Error**: `Could not find the table 'public.table_name'`
- ✅ This is expected if tables haven't been created yet
- Create database schema first

**Error**: `Invalid API key`
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after changing environment variables

**Error**: `Failed to fetch`
- Check Supabase project is active (not paused)
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

### TypeScript Errors

**Error**: `Cannot find module '@/lib/supabase'`
- Check `tsconfig.json` has path mapping:
  ```json
  {
    "paths": {
      "@/*": ["./src/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
  ```

---

## 📝 Next Steps

1. ✅ Environment setup - **COMPLETE**
2. ✅ Client configuration - **COMPLETE**
3. ✅ Connection test - **COMPLETE**
4. ⏳ Create database schema
5. ⏳ Build admin authentication
6. ⏳ Implement admin panel
7. ⏳ Connect forms to database

---

## 📧 Support

For issues or questions:
- Email: info@indabaxkenya.org
- GitHub: [Repository Issues](https://github.com/githukelvin/IndabaXKenya-Website/issues)

---

**Last Updated:** October 20, 2025
**Status:** ✅ Supabase Connected & Ready
