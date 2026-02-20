# Admin Testing Guide - Data Population Order

## 🎯 Most Crucial Tables for Starting Out

Here's the **recommended order** for populating tables when testing the admin section:

---

## ✅ TIER 1: Essential (Start Here!)

### 1. **Event Tags & Post Tags** (`/admin/tags`)
**Why First?** Tags are used by both Events and Posts, so create them first.

**Database Tables:** `event_tags`, `post_tags`

**What to Add:**
- AI/ML
- Deep Learning
- Workshop
- Conference
- Research
- Community

**Admin Path:** `/admin/tags`

---

### 2. **Speaker Expertise** (`/admin/expertise`)
**Why?** Create expertise areas before speakers so you can assign them.

**Database Table:** `speaker_expertise`

**What to Add:**
- Machine Learning
- Deep Learning
- Natural Language Processing
- Computer Vision
- AI Ethics
- Reinforcement Learning

**Admin Path:** `/admin/expertise`

---

### 3. **Speakers** (`/admin/speakers`)
**Why?** Events can reference speakers, so add a few before creating events.

**Database Table:** `speakers`

**What to Add:**
- 2-3 keynote speakers
- 3-5 regular speakers

**Admin Path:** `/admin/speakers`

**Fields:**
- Name, Title, Organization
- Bio (short & full)
- Photo
- LinkedIn/Twitter/Website
- Expertise areas (from step 2)
- Mark 1-2 as "Featured" for homepage

---

### 4. **Events** (`/admin/events`)
**Why?** Core content that ties everything together.

**Database Table:** `events`

**What to Add:**
- 1-2 **Upcoming** events (mark as **Featured** for homepage)
- 1 **Past** event
- Set event type (conference, workshop, meetup)

**Admin Path:** `/admin/events/new`

**Important:**
- ✅ Toggle **"Featured Event"** for upcoming events to show on homepage
- Add banner image
- Link speakers (creates `event_speakers` relations)
- Add tags (creates `event_tag_relations`)
- Add location & venue

---

## ✅ TIER 2: Important Content

### 5. **Posts/News** (`/admin/posts`)
**Why?** Blog posts and announcements for the news section.

**Database Table:** `posts`

**What to Add:**
- 2-3 news posts
- 1-2 announcements
- 1 blog post

**Admin Path:** `/admin/posts/new`

**Important:**
- Use **Quill editor** for rich text
- Add featured image
- Set category (news, announcement, event, blog)
- Add tags (creates `post_tag_relations`)
- ✅ Toggle **"Featured Post"** for important posts
- Publish status

---

### 6. **FAQs** (`/admin/faqs`)
**Why?** Common questions visitors will have.

**Database Table:** `faqs`

**What to Add:**
- 5-8 common questions
- Categories: General, Registration, Venue, Schedule

**Admin Path:** `/admin/faqs`

---

## ✅ TIER 3: Supporting Content

### 7. **Schedule** (`/admin/schedule`)
**Why?** Detailed event timeline (links to events).

**Database Tables:** `schedule_items`, `schedule_speakers`

**What to Add:**
- Only add if you have an upcoming event
- Add sessions by day
- Link to speakers (creates `schedule_speakers` relations)

**Admin Path:** `/admin/schedule`

---

### 8. **Sponsors** (`/admin/sponsors`)
**Why?** Showcase event sponsors.

**Database Table:** `sponsors`

**What to Add:**
- 3-5 sponsors
- Set tier (platinum, gold, silver, bronze)

**Admin Path:** `/admin/sponsors`

---

### 9. **Gallery/Photos** (`/admin/gallery`)
**Why?** Past event photos.

**Database Table:** `photos`

**What to Add:**
- 10-15 photos from past events
- Organize by year
- Add captions
- Link to events (optional)

**Admin Path:** `/admin/gallery`

---

### 10. **Team Members** (`/admin/team`)
**Why?** Organizing team page.

**Database Table:** `team_members`

**What to Add:**
- 4-6 team members
- Roles (Chair, Co-chair, Coordinator, etc.)

**Admin Path:** (Check if exists, or add manually to DB)

---

## 🚫 Skip These For Initial Testing

- **Applications** (`applications`) - Will come from users via forms
- **Subscribers** (`subscribers`) - Will come from newsletter signups
- **Contact Submissions** (`contact_submissions`) - Will come from contact form
- **Settings** (`settings`) - Already configured, no need to change
- **Static Content** (`static_content`) - Only edit if needed

---

## 📋 Quick Start Checklist

```
[ ] 1. Clear all data (run clear-test-data.sql)
[ ] 2. Add 5-6 Event Tags + Post Tags (/admin/tags)
[ ] 3. Add 5-6 Speaker Expertise areas (/admin/expertise)
[ ] 4. Add 3-5 Speakers - mark 1-2 as featured (/admin/speakers)
[ ] 5. Add 2 Events - mark 1 as featured, upcoming (/admin/events)
[ ] 6. Add 3 Posts - mark 1 as featured (/admin/posts)
[ ] 7. Add 5-8 FAQs (/admin/faqs)
[ ] 8. Add Schedule for upcoming event (/admin/schedule)
[ ] 9. Add 3-5 Sponsors (/admin/sponsors)
[ ] 10. Add 10+ Gallery Photos (/admin/gallery)
```

---

## 🔄 How to Clear Data

### Option 1: Using Supabase MCP (Recommended)
```bash
# Ask Claude to execute via MCP:
"Please use MCP to run the clear-test-data.sql script"
```

### Option 2: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Paste contents of `scripts/clear-test-data.sql`
5. Click "Run"

### Option 3: CLI
```bash
# If you have Supabase CLI installed
npx supabase db execute --file scripts/clear-test-data.sql
```

---

## 🎨 Testing Featured Content

After adding data, verify:

### Homepage Should Show:
- ✅ **2 Featured Events** (upcoming, with `is_featured = true`)
- ✅ **Latest 3 Posts** (from news section)
- ✅ **Featured Speakers** (marked as featured)

### Events Page Should Show:
- All events with proper filtering (upcoming/past)
- Event cards with truncated descriptions (no HTML)

### News Page Should Show:
- All posts with category filters
- Post cards with excerpts

---

## 🐛 Common Issues

**Issue:** Homepage shows no events
- ✅ Make sure event has `is_featured = true`
- ✅ Check event is `status = published`
- ✅ Verify event is `event_type = upcoming`

**Issue:** HTML tags showing in event cards
- ✅ Already fixed - descriptions are truncated with HTML stripped

**Issue:** Can't login to admin
- ✅ Don't clear `admin_roles` table!
- ✅ Check your email is in the table

---

## 📊 Expected Data Volume for Testing

| Table | Recommended Count |
|-------|------------------|
| event_tags | 5-10 |
| post_tags | 5-10 |
| speaker_expertise | 5-8 |
| speakers | 5-10 |
| events | 3-5 |
| posts | 5-10 |
| faqs | 8-15 |
| sponsors | 5-8 |
| photos | 15-30 |
| schedule_items | 10-20 (per event) |
| team_members | 5-8 |

---

## ⚡ Quick Data Entry Tips

1. **Use the Preview button** in admin forms before saving
2. **Use Quill editor** for rich formatting (events & posts)
3. **Upload images** for better visual testing
4. **Toggle "Featured"** to test homepage display
5. **Add tags** to test filtering

---

## 🎯 Next Steps After Data Entry

1. Test all public pages: `/`, `/events`, `/news`, `/speakers`, `/gallery`
2. Test event detail pages with schedule links
3. Test filtering on events and news pages
4. Test responsive design on mobile
5. Check that featured content appears on homepage

Good luck with testing! 🚀
