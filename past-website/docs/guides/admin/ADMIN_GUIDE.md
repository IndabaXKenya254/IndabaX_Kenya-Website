# IndabaX Kenya - Admin Guide

## Table of Contents
1. [Accessing Admin Panel](#accessing-admin-panel)
2. [Site Settings](#site-settings)
3. [Homepage Configuration](#homepage-configuration)
4. [Event Management](#event-management)
5. [Content Management](#content-management)
6. [Form Builder](#form-builder)
7. [Application Management](#application-management)

---

## Accessing Admin Panel

### URL
```
https://yourdomain.com/admin
```

### Requirements
- Must be logged in with an admin account
- Admin role assigned in `admin_roles` table

### Navigation
The admin panel has a sidebar with sections:
- Dashboard (overview stats)
- Events (manage events)
- Applications (review submissions)
- Templates (form builder)
- Email Templates (email management)
- Settings (site configuration)
- Gallery (photo management)
- Team (team members)
- Speakers (speaker management)

---

## Site Settings

### Location
```
/admin/settings
```

### Tabs Available

#### 1. General Tab
| Setting | Description |
|---------|-------------|
| Site Name | Website title (appears in browser tab) |
| Site Description | SEO meta description |
| SEO Keywords | Comma-separated keywords |
| Site Logo | Upload site logo (PNG/JPEG/SVG/WebP, max 2MB) |
| Enable Registration Popup | Show/hide popup for visitors |
| Maintenance Mode | Take site offline for maintenance |
| Newsletter | Enable/disable newsletter signup |

#### 2. Event & Banner Tab
| Setting | Description |
|---------|-------------|
| Enable Registration | Global registration toggle |
| Registration Deadline | Global deadline date |
| Current Event Year | Select active year |
| Event Title | Banner event title |
| Event Subtitle | Banner subtitle |
| Event Location | Location text |
| Start/End Date | Event dates |
| Show Countdown | Toggle countdown timer |
| Show Video | Toggle video button |
| YouTube Video ID | Video ID (e.g., `dQw4w9WgXcQ`) |
| Registration URL | Link for register button |
| Submit Paper URL | Link for submit button |

#### 3. Homepage Tab
| Setting | Description |
|---------|-------------|
| **Hero Section** | |
| Title Line 1 | First line (e.g., "Building Africa's") |
| Title Line 2 | Second line (highlighted) |
| Stats Line | Two stats separated by `\|` |
| Description | Rich text with formatting |
| Background Image | Hero background (1920x1080px recommended) |
| **About Section** | |
| Subtitle | Small text above title |
| Title | Section heading |
| Content | Rich text paragraphs |
| Main Image | Large image (left side) |
| Secondary Image | Overlay image |

#### 4. Popup Tab
| Setting | Description |
|---------|-------------|
| Enable Popup | Show/hide registration popup |
| Popup Title | Popup heading |
| Popup Content | Rich text content |
| Delay (seconds) | Wait time before showing |
| Button Text | CTA button label |
| Button Link | Where button navigates |
| Highlights | One per line (shown as checklist) |

#### 5. Contact & Social Tab
| Setting | Description |
|---------|-------------|
| Contact Email | Public contact email |
| Contact Phone | Public phone number |
| Contact Address | Physical address |
| Social Links | Twitter, LinkedIn, Facebook, Instagram, YouTube, GitHub URLs |

---

## Homepage Configuration

### Hero Section
The hero is the main banner visitors see first.

**To Edit:**
1. Go to `/admin/settings`
2. Click "Homepage" tab
3. Modify hero fields
4. Upload new background image if needed
5. Click "Save All Settings"

**Tips:**
- Use `|` to separate two stats (e.g., `500+ Attendees|20+ Speakers`)
- Background image: 1920x1080px, JPEG/PNG/WebP, max 5MB
- Description supports bold, italic, lists, and links

### About Section
The about section appears below the hero.

**To Edit:**
1. Go to `/admin/settings`
2. Click "Homepage" tab
3. Scroll to "About Section"
4. Use the rich text editor for content
5. Upload images (main: ~1600x1066px, secondary: ~1280x853px)
6. Click "Save All Settings"

**Tips:**
- Use `<b>text</b>` in title for bold formatting
- Content supports headers, bold, italic, lists, links
- Images are displayed side-by-side on desktop

---

## Event Management

### Location
```
/admin/events
```

### Creating an Event
1. Click "Add Event" button
2. Fill in required fields:
   - Title
   - Slug (URL-friendly name)
   - Start Date
   - Event Type (conference, workshop, etc.)
3. Optional fields:
   - Description (rich text)
   - Theme/tagline
   - End date
   - Location & Venue
   - Featured image
   - Registration settings
4. Click "Create Event"

### Registration Settings
| Field | Description |
|-------|-------------|
| Enable Registration | Allow registrations |
| Registration Deadline | Cutoff date |
| Initial Form Template | Registration form to use |
| Detailed Survey Template | Follow-up survey form |

### Event Status
- **upcoming**: Future event, registration may be open
- **ongoing**: Currently happening
- **past**: Completed event
- **archived**: Hidden from public

---

## Content Management

### News/Posts
```
/admin/posts
```

Create announcements, news articles, and updates.

### Gallery
```
/admin/gallery
```

Upload and organize event photos by year.

### Speakers
```
/admin/speakers
```

Manage speaker profiles with photos, bios, and social links.

### Team
```
/admin/team
```

Manage organizing committee members.

---

## Form Builder

### Location
```
/admin/templates
```

### Creating a Form Template
1. Click "Create Template"
2. Enter template details:
   - Name
   - Description
   - Usage Type (initial_interest, detailed_survey, etc.)
3. Add questions using the question palette
4. Configure each question (required, validation, etc.)
5. Save template

### Question Types
- Short Answer
- Paragraph
- Multiple Choice
- Checkboxes
- Dropdown
- Linear Scale
- Date/Time
- File Upload
- Section Break

### Linking to Events
1. Go to event edit page
2. Select "Initial Form Template" for registration
3. Select "Detailed Survey Template" for follow-up

---

## Application Management

### Location
```
/admin/applications
```

### Workflow
1. **Pending**: New submission awaiting review
2. **Under Review**: Being reviewed
3. **Shortlisted**: Selected for next stage
4. **Accepted**: Approved
5. **Rejected**: Not selected
6. **Waitlisted**: On waiting list

### Reviewing Applications
1. Click on application to view details
2. Review responses
3. Add internal notes
4. Change status
5. Send email notification if needed

### Bulk Actions
- Select multiple applications
- Apply status change
- Send bulk emails

---

## Quick Reference

### Important URLs
| Page | URL |
|------|-----|
| Admin Dashboard | `/admin` |
| Settings | `/admin/settings` |
| Events | `/admin/events` |
| Applications | `/admin/applications` |
| Form Templates | `/admin/templates` |
| Email Templates | `/admin/email-templates` |
| Gallery | `/admin/gallery` |

### Keyboard Shortcuts
- `Ctrl+S` / `Cmd+S`: Save (where applicable)
- `Esc`: Close modals

### Support
For technical issues, check:
1. Browser console for errors
2. Network tab for failed requests
3. Contact development team

---

## Troubleshooting

### Settings Not Saving
- Check internet connection
- Ensure you have admin privileges
- Check for validation errors
- Try refreshing and re-saving

### Images Not Uploading
- Check file size (max varies by type)
- Ensure correct format (PNG/JPEG/WebP)
- Check storage quota

### Forms Not Appearing
- Verify template is linked to event
- Check registration is enabled
- Verify deadline hasn't passed

### Changes Not Reflecting
- Clear browser cache
- Hard refresh (`Ctrl+Shift+R`)
- Wait for server-side cache to clear (up to 60s)
