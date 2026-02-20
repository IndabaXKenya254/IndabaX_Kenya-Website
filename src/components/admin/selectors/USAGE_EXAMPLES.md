# Selector Components - Usage Examples

This guide shows how to integrate the Tag, Speaker, and Expertise selector components into your admin forms.

---

## 📦 Components Available

- **`TagSelector`** - Select event tags or post tags
- **`SpeakerSelector`** - Select speakers for events (with ordering)
- **`ExpertiseSelector`** - Select expertise areas for speakers

---

## 🎯 Example 1: Event Form with Tags and Speakers

```typescript
'use client'

import { useState } from 'react'
import { TagSelector, SpeakerSelector } from '@/components/admin/selectors'

export default function EventForm() {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    excerpt: '',
    start_date: '',
    end_date: '',
    location: '',
    venue: '',
    status: 'draft',
    is_featured: false,
    tag_ids: [],        // Array of tag UUIDs
    speaker_ids: [],    // Array of speaker UUIDs (ordered)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Event created:', data)
      // Handle success (redirect, show message, etc.)
    } else {
      // Handle error
      console.error('Failed to create event')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Fields */}
      <div className="mb-3">
        <label className="form-label">Title</label>
        <input
          type="text"
          className="form-control"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Slug</label>
        <input
          type="text"
          className="form-control"
          value={formData.slug}
          onChange={(e) => setFormData({...formData, slug: e.target.value})}
          required
        />
      </div>

      {/* ... other basic fields ... */}

      {/* TAG SELECTOR */}
      <div className="mb-3">
        <TagSelector
          type="event"
          selectedIds={formData.tag_ids}
          onChange={(tag_ids) => setFormData({...formData, tag_ids})}
        />
      </div>

      {/* SPEAKER SELECTOR */}
      <div className="mb-3">
        <SpeakerSelector
          selectedIds={formData.speaker_ids}
          onChange={(speaker_ids) => setFormData({...formData, speaker_ids})}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Create Event
      </button>
    </form>
  )
}
```

---

## 🎯 Example 2: Post Form with Tags

```typescript
'use client'

import { useState } from 'react'
import { TagSelector } from '@/components/admin/selectors'

export default function PostForm() {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    category: 'news',
    is_featured: false,
    author_name: '',
    author_image: '',
    tag_ids: [],        // Array of tag UUIDs
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const response = await fetch('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Post created:', data)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Fields */}
      <div className="mb-3">
        <label className="form-label">Title</label>
        <input
          type="text"
          className="form-control"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      {/* ... other fields ... */}

      {/* TAG SELECTOR FOR POSTS */}
      <div className="mb-3">
        <TagSelector
          type="post"
          selectedIds={formData.tag_ids}
          onChange={(tag_ids) => setFormData({...formData, tag_ids})}
          label="Post Tags"
          placeholder="Search post tags..."
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Create Post
      </button>
    </form>
  )
}
```

---

## 🎯 Example 3: Speaker Form with Expertise

```typescript
'use client'

import { useState } from 'react'
import { ExpertiseSelector } from '@/components/admin/selectors'

export default function SpeakerForm() {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    organization: '',
    country: '',
    photo_url: '',
    bio_short: '',
    bio_full: '',
    linkedin_url: '',
    is_featured: false,
    expertise_ids: [],  // Array of expertise UUIDs
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const response = await fetch('/api/admin/speakers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Speaker created:', data)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Fields */}
      <div className="mb-3">
        <label className="form-label">Name</label>
        <input
          type="text"
          className="form-control"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Country</label>
        <input
          type="text"
          className="form-control"
          value={formData.country}
          onChange={(e) => setFormData({...formData, country: e.target.value})}
        />
      </div>

      {/* ... other fields ... */}

      {/* EXPERTISE SELECTOR */}
      <div className="mb-3">
        <ExpertiseSelector
          selectedIds={formData.expertise_ids}
          onChange={(expertise_ids) => setFormData({...formData, expertise_ids})}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Create Speaker
      </button>
    </form>
  )
}
```

---

## 🎯 Example 4: Editing Existing Records

When editing existing records, you need to extract the IDs from the fetched data:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { TagSelector, SpeakerSelector } from '@/components/admin/selectors'

export default function EventEditForm({ eventId }: { eventId: string }) {
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  async function fetchEvent() {
    // Fetch event with relationships
    const response = await fetch(`/api/admin/events/${eventId}`)
    const data = await response.json()

    if (data.success) {
      const event = data.data

      // Extract IDs from relationship objects
      const tag_ids = event.tags?.map(tag => tag.id) || []
      const speaker_ids = event.speakers?.map(speaker => speaker.id) || []

      setFormData({
        ...event,
        tag_ids,
        speaker_ids,
      })
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const response = await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      console.log('Event updated successfully')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic fields */}
      <div className="mb-3">
        <label className="form-label">Title</label>
        <input
          type="text"
          className="form-control"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
      </div>

      {/* Selectors */}
      <div className="mb-3">
        <TagSelector
          type="event"
          selectedIds={formData.tag_ids}
          onChange={(tag_ids) => setFormData({...formData, tag_ids})}
        />
      </div>

      <div className="mb-3">
        <SpeakerSelector
          selectedIds={formData.speaker_ids}
          onChange={(speaker_ids) => setFormData({...formData, speaker_ids})}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Update Event
      </button>
    </form>
  )
}
```

---

## ⚙️ Component Props

### TagSelector Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'event' \| 'post'` | ✅ | Which tag type to fetch |
| `selectedIds` | `string[]` | ✅ | Array of selected tag UUIDs |
| `onChange` | `(ids: string[]) => void` | ✅ | Callback when selection changes |
| `label` | `string` | ❌ | Custom label (default: "Event Tags" or "Post Tags") |
| `placeholder` | `string` | ❌ | Custom placeholder (default: "Search tags...") |
| `disabled` | `boolean` | ❌ | Disable the selector (default: false) |

### SpeakerSelector Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedIds` | `string[]` | ✅ | Array of selected speaker UUIDs (ordered) |
| `onChange` | `(ids: string[]) => void` | ✅ | Callback when selection changes |
| `label` | `string` | ❌ | Custom label (default: "Event Speakers") |
| `placeholder` | `string` | ❌ | Custom placeholder (default: "Search speakers...") |
| `disabled` | `boolean` | ❌ | Disable the selector (default: false) |

### ExpertiseSelector Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedIds` | `string[]` | ✅ | Array of selected expertise UUIDs |
| `onChange` | `(ids: string[]) => void` | ✅ | Callback when selection changes |
| `label` | `string` | ❌ | Custom label (default: "Expertise Areas") |
| `placeholder` | `string` | ❌ | Custom placeholder (default: "Search expertise...") |
| `disabled` | `boolean` | ❌ | Disable the selector (default: false) |

---

## 🎨 Customization

### Custom Styling

You can wrap the selectors in your own div with custom classes:

```typescript
<div className="my-custom-wrapper">
  <TagSelector
    type="event"
    selectedIds={formData.tag_ids}
    onChange={(tag_ids) => setFormData({...formData, tag_ids})}
  />
</div>
```

### Custom Labels and Placeholders

```typescript
<TagSelector
  type="event"
  selectedIds={formData.tag_ids}
  onChange={(tag_ids) => setFormData({...formData, tag_ids})}
  label="Choose Event Categories"
  placeholder="Type to filter categories..."
/>
```

### Disabled State

Useful for view-only forms:

```typescript
<TagSelector
  type="event"
  selectedIds={formData.tag_ids}
  onChange={() => {}}
  disabled={true}
/>
```

---

## 💡 Tips

1. **Pre-fetch Data:** The selectors fetch data automatically, but you can also pre-populate tags/speakers/expertise in a parent component if needed.

2. **Order Matters:** For `SpeakerSelector`, the order of IDs in the array determines the `display_order` on the backend. Use the ↑↓ buttons to reorder.

3. **Validation:** Add your own validation logic in the form:
   ```typescript
   if (formData.tag_ids.length === 0) {
     alert('Please select at least one tag')
     return
   }
   ```

4. **Loading States:** All selectors show loading states automatically while fetching data.

5. **Error Handling:** Selectors display error messages if API calls fail.

---

## 🔍 Debugging

If selectors don't show data:

1. **Check API Endpoints:** Ensure `/api/admin/tags/events`, `/api/admin/speakers`, and `/api/admin/expertise` are accessible
2. **Check Authentication:** API endpoints require admin authentication
3. **Check Browser Console:** Look for network errors or JavaScript errors
4. **Verify Database:** Ensure tags/speakers/expertise exist in the database

---

## 📚 Related Documentation

- **API Endpoints:** See `PHASE6_TAG_MANAGEMENT.md`
- **Database Schema:** See migration files in `supabase/migrations/`
- **Form Validation:** See `lib/validations/admin.ts`
