# Admin Content Management Guide

This guide explains how to edit homepage content and manage NOAI features through the admin panel.

---

## Table of Contents

1. [Admin Sidebar Navigation](#admin-sidebar-navigation)
2. [Editing Homepage Hero Section](#editing-homepage-hero-section)
3. [Editing Homepage About Section](#editing-homepage-about-section)
4. [Managing NOAI Timeline](#managing-noai-timeline)

---

## Admin Sidebar Navigation

The admin sidebar is organized into **7 collapsible groups** for easier navigation:

| Group | Description |
|-------|-------------|
| **Dashboard** | Overview, Statistics, Analytics |
| **Content** | Posts, Events, Speakers, Team, Venues, Schedule, Sponsors, Pricing, FAQs, Gallery |
| **NOAI** | NOAI Dashboard, Timeline, Participants, NOAI FAQs |
| **Applications** | Form Templates, All Applications, Shortlist Tracking |
| **Email** | Templates, Compose, Logs, CC/BCC Recipients |
| **Users** | Subscribers, Contact Messages, Admin Users, Tags, Expertise |
| **System** | Event Check-In, My Profile, Settings |

### How to Use:
- **Click on a group header** to expand/collapse it
- Groups containing your current page **auto-expand** when you navigate
- Groups with active pages show a **highlighted background**

---

## Editing Homepage Hero Section

The hero section is the main banner visitors see when they land on the homepage.

### Location
**Admin Panel** → **System** → **Settings** → Scroll to **"Homepage Hero Section"**

### Editable Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Title Line 1** | First line of the main heading | `Building Africa's` |
| **Title Line 2** | Second line (highlighted/styled) | `AI & Machine Learning Community` |
| **Stats Line** | Two stats separated by a pipe `\|` | `500+ AI Enthusiasts\|East Africa's Premier AI Conference` |
| **Description** | Brief paragraph below the title | `IndabaX Kenya is part of the global Deep Learning Indaba movement...` |

### Stats Line Format
The stats appear as two bullet points with icons. Separate them with a pipe character (`|`):

```
First stat|Second stat
```

**Example:**
```
500+ AI Enthusiasts|East Africa's Premier AI Conference
```

This displays as:
- 👥 500+ AI Enthusiasts
- 🌍 East Africa's Premier AI Conference

### Steps to Edit:
1. Go to **Admin Panel** → **System** → **Settings**
2. Scroll down to **"Homepage Hero Section"**
3. Edit the fields as needed
4. Click **"Save All Settings"** at the bottom
5. Visit the homepage to see your changes

---

## Editing Homepage About Section

The about section appears below the hero banner, introducing IndabaX Kenya to visitors.

### Location
**Admin Panel** → **System** → **Settings** → Scroll to **"Homepage About Section"**

### Editable Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Subtitle** | Small text above the title | `About IndabaX Kenya` |
| **Title** | Main heading (supports bold) | `Empowering Africa's **AI** Future` |
| **Paragraphs** | Content paragraphs | Multiple paragraphs separated by blank lines |

### Title Formatting
You can make words **bold** by wrapping them in double asterisks:

```
Empowering Africa's **AI** Future
```

Displays as: Empowering Africa's **AI** Future

### Paragraphs Format
Enter multiple paragraphs by pressing **Enter twice** (leaving a blank line) between them:

```
First paragraph content here. This can be multiple sentences
describing IndabaX Kenya.

Second paragraph starts here after the blank line. Talk about
the community growth and achievements.

Third paragraph with mission statement and goals.
```

### Steps to Edit:
1. Go to **Admin Panel** → **System** → **Settings**
2. Scroll down to **"Homepage About Section"**
3. Edit the subtitle, title, and paragraphs
4. Click **"Save All Settings"**
5. Refresh the homepage to see changes

---

## Managing NOAI Timeline

The NOAI Timeline displays Kenya's journey and milestones in the National Olympiad for AI.

### Location
**Admin Panel** → **NOAI** → **Timeline**

Or directly via: `/admin/noai/timeline`

### Timeline Milestone Fields

| Field | Required | Description |
|-------|----------|-------------|
| **Year** | Yes | The year of the milestone (e.g., `2024`) |
| **Title** | Yes | Main heading (e.g., `Kenya's First IOAI Participation`) |
| **Subtitle** | Yes | Secondary heading (e.g., `Historic Achievement`) |
| **Date** | Yes | Full date (e.g., `August 2024`) |
| **Icon** | No | Icon class (defaults to `icofont-calendar`) |
| **Description** | Yes | Detailed description of the milestone |
| **Highlight** | No | Optional highlighted text (shown in a badge) |
| **Display Order** | No | Number for sorting (lower = appears first) |
| **Published** | No | Toggle to show/hide on the public page |

### Available Icons

Select from these common icons in the dropdown:

| Icon | Name | Best For |
|------|------|----------|
| 📅 | `icofont-calendar` | Events, dates |
| 🏆 | `icofont-trophy` | Achievements, wins |
| ⭐ | `icofont-star` | Highlights, featured |
| 🎓 | `icofont-graduate` | Education, learning |
| 👥 | `icofont-users-alt-4` | Teams, groups |
| 🌍 | `icofont-globe` | International events |
| 🚀 | `icofont-rocket` | Launches, starts |
| ✓ | `icofont-check-circled` | Completions, success |
| 🏅 | `icofont-medal` | Awards, recognition |
| 📍 | `icofont-location-pin` | Locations, venues |

### Managing Milestones

#### Adding a New Milestone:
1. Go to **Admin Panel** → **NOAI** → **Timeline**
2. Click **"Add Milestone"** button
3. Fill in the required fields
4. Set **Published** to ON if you want it visible immediately
5. Click **"Create"**

#### Editing a Milestone:
1. Find the milestone in the table
2. Click the **Edit** button (pencil icon)
3. Modify the fields
4. Click **"Save Changes"**

#### Deleting a Milestone:
1. Find the milestone in the table
2. Click the **Delete** button (trash icon)
3. Confirm the deletion

#### Reordering Milestones:
1. Edit each milestone
2. Change the **Display Order** number
3. Lower numbers appear first
4. Save each milestone

#### Hiding a Milestone (without deleting):
1. Edit the milestone
2. Toggle **Published** to OFF
3. Save changes
4. The milestone will be hidden from the public page but retained in admin

---

## Tips & Best Practices

### For Hero Section:
- Keep **Title Line 1** short (2-4 words)
- **Title Line 2** can be longer and more descriptive
- Stats should be impactful numbers or achievements
- Description should be 2-3 sentences maximum

### For About Section:
- Use 2-4 paragraphs for optimal readability
- First paragraph: What is IndabaX Kenya
- Second paragraph: Community growth/achievements
- Third paragraph: Mission and goals

### For Timeline:
- Order milestones chronologically (earliest first or latest first)
- Use consistent date formats (e.g., "Month Year")
- Keep descriptions concise but informative
- Use highlights for key achievements (e.g., "Bronze Medal", "Historic First")

---

## Troubleshooting

### Changes not appearing on the website?
1. Make sure you clicked **"Save All Settings"**
2. Try hard-refreshing the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear your browser cache
4. Check if the content is marked as "Published"

### Stats not displaying correctly?
- Ensure you're using a single pipe `|` to separate the two stats
- Don't add spaces around the pipe: `Stat1|Stat2` not `Stat1 | Stat2`

### Timeline milestones not showing?
- Check if **Published** is toggled ON
- Verify the **Display Order** is set correctly
- Make sure required fields (Year, Title, Subtitle, Date, Description) are filled

---

## Quick Reference

| What to Edit | Where to Go |
|--------------|-------------|
| Hero title, stats, description | Settings → Homepage Hero Section |
| About section text | Settings → Homepage About Section |
| NOAI Timeline milestones | NOAI → Timeline |
| NOAI Page content sections | NOAI → NOAI Dashboard |
| NOAI Participants | NOAI → Participants |
| NOAI FAQs | NOAI → NOAI FAQs |

---

*Last updated: December 29, 2025*
