# IndabaX Kenya Website - Complete User Guide

**Admin Credentials:**
- Email: `admin@indabaxkenya.org`
- Password: `IndabaX2026!Admin#Secure`

---

## Table of Contents

1. [Public-Facing Pages Overview](#public-facing-pages-overview)
2. [Admin Panel Access](#admin-panel-access)
3. [Admin Dashboard](#admin-dashboard)
4. [Content Management](#content-management)
   - [Events Management](#events-management)
   - [Posts Management](#posts-management)
   - [Speakers Management](#speakers-management)
   - [Schedule Management](#schedule-management)
   - [Gallery Management](#gallery-management)
   - [FAQ Management](#faq-management)
   - [Sponsors Management](#sponsors-management)
   - [Venues Management](#venues-management)
   - [Pricing Tiers Management](#pricing-tiers-management)
   - [Statistics Management](#statistics-management)
5. [User Management](#user-management)
   - [Applications Review](#applications-review)
   - [Newsletter Subscribers](#newsletter-subscribers)
6. [System Settings](#system-settings)
7. [Best Practices](#best-practices)

---

## Public-Facing Pages Overview

### 1. Homepage (`/`)
**Purpose**: Main landing page introducing IndabaX Kenya

**Features**:
- Hero banner with main call-to-action
- About section
- Quick stats
- Featured speakers preview
- Upcoming events preview
- Schedule preview (first 3 sessions per day)
- Pricing/registration info
- Sponsors showcase
- Latest news
- Newsletter subscription

**Dynamic Elements**:
- Featured speakers (automatically pulled from database)
- Upcoming events (filtered by event_type: "upcoming")
- Schedule preview with event name
- Latest 3 news posts
- Active sponsors

---

### 2. Events Page (`/events`)
**Purpose**: Lists all events (past and upcoming)

**Features**:
- Grid display of all events
- Each event card shows:
  - Featured image
  - Title
  - Date range
  - Location
  - Excerpt
  - Status badge (Upcoming/Past)
- Click to view event details

**Event Detail Page** (`/events/[slug]`):
- Full event description (HTML formatted)
- Start and end dates
- Venue details with map link
- Featured image
- Registration button (if upcoming)

---

### 3. Schedule Page (`/schedule`)
**Purpose**: Complete event schedule display

**Features**:
- Dynamic event title display
- Day count (e.g., "3-Day Program")
- Event description excerpt with "Read more" link
- Tabbed interface for each day
- Session cards showing:
  - Time (e.g., "08:00 - 09:00")
  - Session type badge (Keynote, Workshop, etc.)
  - Title
  - Speaker name (if assigned)
  - Location
  - Description

**Data Source**: Pulls from `schedule_items` table grouped by `day_number`

---

### 4. Speakers Page (`/speakers`)
**Purpose**: Showcase all speakers

**Features**:
- Grid layout with speaker cards
- Each card displays:
  - Photo
  - Name
  - Title/position
  - Organization
  - LinkedIn link
  - Expertise areas
- Animated flip cards (front/back)

---

### 5. Gallery Page (`/gallery`)
**Purpose**: Photo gallery from past events

**Features**:
- Year-based filtering
- Event-based filtering
- Grid display of photos
- Lightbox view on click
- Download option for each photo
- Featured photos highlighted
- Upload date and uploaded by information

---

### 6. News/Blog Page (`/news`)
**Purpose**: Latest announcements and articles

**Features**:
- List of all published posts
- Post cards with:
  - Featured image
  - Title
  - Excerpt
  - Published date
  - Author
  - Tags

**Post Detail Page** (`/news/[slug]`):
- Full content (rich text)
- Author information
- Publication date
- Tags
- Share buttons

---

### 7. FAQ Page (`/faq`)
**Purpose**: Frequently asked questions

**Features**:
- Accordion-style Q&A
- Organized by categories:
  - General
  - Registration
  - Schedule
  - Venue
  - Travel
  - Participation

---

### 8. Contact Page (`/contact`)
**Purpose**: Contact form and information

**Features**:
- Contact form submission
- Email and social media links
- Office address (if applicable)

---

### 9. Venue Page (`/venue`)
**Purpose**: Conference venue information

**Features**:
- List of all active venues
- Venue cards with image, name, location, capacity
- Click to view detailed venue pages

**Venue Detail Page** (`/venue/[slug]`):
- Hero section with venue image and quick info card
- About the Venue (full-width description)
- Three-column layout:
  - Facilities & Amenities (with checkmarks)
  - Nearby Amenities (hotels, restaurants, shopping)
  - How to Get There (transportation directions)
- Interactive Google Maps embed
- Responsive design with card-based layout

---

### 10. Registration Page (`/register`)
**Purpose**: Event registration form

**Features**:
- Personal information fields
- Event selection
- Application questions
- Submission confirmation
- Prevents duplicate submissions (by email)

---

## Admin Panel Access

### Login Process

1. Navigate to `/admin/login`
2. Enter credentials:
   - **Email**: `admin@indabaxkenya.org`
   - **Password**: `IndabaX2026!Admin#Secure`
3. Click "Sign In"
4. You'll be redirected to the Admin Dashboard

**Security Notes**:
- Sessions expire after inactivity
- Always log out when finished
- Don't share admin credentials

---

## Admin Dashboard

**URL**: `/admin/dashboard`

### Dashboard Overview

**Quick Stats Display**:
- Total Events (upcoming + past)
- Total Speakers
- Pending Applications (awaiting review)
- Newsletter Subscribers

**Recent Activity**:
- Latest 5 applications submitted
- Recent posts published
- Upcoming events

**Quick Actions**:
- Create New Event
- Create New Post
- Review Applications
- Upload Photos

---

## Content Management

---

## Events Management

**URL**: `/admin/events`

### Viewing Events

**List View Features**:
- Search events by title, description, location
- Filter by:
  - Event Type (Upcoming/Past)
  - Status (Draft/Published)
- Pagination (10, 25, 50, or 100 per page)
- Event cards show:
  - Featured image
  - Title
  - Dates
  - Location
  - Status badge
  - Featured star icon

### Creating a New Event

**Click**: "Add New Event" button (top right)

**Required Fields** (marked with *):
1. **Title*** - Event name (e.g., "IndabaX Kenya 2026")
2. **Slug*** - URL-friendly identifier (auto-generated from title)
   - Example: `indabax-kenya-2026`
3. **Description*** - Full event description
   - Rich text editor with formatting options
   - Supports: Bold, italic, lists, links, images
   - Use HTML for complex formatting
4. **Start Date*** - Event start date
5. **Event Type*** - Select:
   - **Upcoming** - For future events
   - **Past** - For historical events

**Optional Fields**:
6. **End Date** - Multi-day events
7. **Location** - City/country (e.g., "Nairobi, Kenya")
8. **Venue** - Select from venue dropdown
   - Links to detailed venue information
   - Automatically populated from Venues Management
   - Shows venue name, city, and country
   - Optional: Can leave as "No venue (online/TBD)"
9. **Venue Details** - JSON object with additional venue information (if not using venue selector)
10. **Weekend Configuration**:
    - **Includes Saturday** - Checkbox (default: checked)
    - **Includes Sunday** - Checkbox (default: checked)
    - Used for accurate day count calculations
11. **Event Dates** - Specific dates array (advanced)
    - For non-consecutive event days
    - Format: ["2026-03-15", "2026-03-17", "2026-03-22"]
12. **Featured Image** - Event banner/poster URL
13. **Excerpt** - Short summary (150-200 characters)
14. **Registration URL** - External registration link (optional)
15. **Max Attendees** - Capacity limit (optional)
16. **Status** - Draft, Published, Upcoming, or Archived
17. **Is Featured** - Checkbox to feature on homepage
18. **Tags** - Select relevant tags (e.g., "AI", "Machine Learning", "Workshop")
19. **Speakers** - Select multiple speakers for this event

**Steps**:
1. Fill in all required fields
2. Add optional details
3. Preview description formatting
4. Select appropriate tags
5. Set status to "Published" when ready
6. Click "Create Event"

**Best Practices**:
- Write compelling descriptions with clear structure
- Include workshop topics, speakers, venue details
- Use consistent date formats
- Add high-quality featured images
- Mark only current events as "Featured"

---

### Editing an Existing Event

1. Find event in the list
2. Click the **Edit** (pencil) icon
3. Modify fields as needed
4. Click "Update Event"

**Common Edits**:
- Update description after finalizing agenda
- Change event type from "Upcoming" to "Past" after event concludes
- Add venue details as they're confirmed
- Update featured image

---

### Deleting an Event

1. Click the **Delete** (trash) icon
2. Confirm deletion in popup
3. Event is permanently removed

**⚠️ Warning**: Deleting an event will also delete:
- Associated schedule items
- References in applications
- Cannot be undone

**When to Delete**:
- Cancelled events
- Duplicate entries
- Test events

---

## Posts Management

**URL**: `/admin/posts`

### Creating a New Post

**Click**: "Add New Post" button

**Required Fields**:
1. **Title*** - Post headline
2. **Slug*** - URL identifier (auto-generated)
3. **Content*** - Main article body
   - Use rich text editor
   - Supports images, videos, embeds
4. **Post Type*** - Select:
   - **News** - Announcements, updates
   - **Blog** - Articles, insights
   - **Update** - Quick updates

**Optional Fields**:
5. **Featured Image** - Post banner
6. **Excerpt** - Summary for list view
7. **Status** - Draft or Published
8. **Is Featured** - Show on homepage
9. **Tags** - Content categories
10. **Published At** - Schedule publication

**Rich Text Editor Features**:
- **Bold**, *italic*, underline
- Headings (H1, H2, H3)
- Bulleted and numbered lists
- Block quotes
- Links (internal and external)
- Images (upload or URL)
- Code blocks
- Tables

**Steps**:
1. Write compelling title
2. Create rich content with formatting
3. Add relevant tags
4. Upload featured image
5. Write excerpt (or let system auto-generate)
6. Set status to "Published"
7. Click "Create Post"

**Best Practices**:
- Use clear headings for structure
- Include images to break up text
- Write engaging excerpts
- Tag appropriately for discoverability
- Proofread before publishing

---

### Managing Posts

**Bulk Actions**:
- Publish multiple drafts
- Delete selected posts
- Change tags

**Filtering**:
- By post type
- By publication status
- By author
- By date range

---

## Speakers Management

**URL**: `/admin/speakers`

### Adding a New Speaker

**Click**: "Add Speaker" button

**Required Fields**:
1. **Name*** - Full name
2. **Photo URL*** - Professional headshot
   - Recommended: Square image, min 400x400px
3. **Title*** - Job title/role
4. **Organization*** - Company or institution

**Optional Fields**:
5. **Bio** - Speaker background (500-1000 characters)
6. **LinkedIn URL** - Professional profile
7. **Twitter URL** - Social media handle
8. **Website** - Personal or professional site
9. **Expertise Areas** - Select multiple:
   - Machine Learning
   - Computer Vision
   - NLP
   - Deep Learning
   - AI Ethics
   - Healthcare AI
   - AgriTech
   - FinTech
   - etc.

**Steps**:
1. Enter speaker information
2. Upload or link to photo
3. Write compelling bio
4. Add social links
5. Select relevant expertise areas
6. Click "Create Speaker"

**Photo Guidelines**:
- Use professional, high-quality images
- Square aspect ratio (1:1)
- Good lighting and clear face
- Neutral or professional background
- File size: < 2MB

---

### Linking Speakers to Events and Schedules

**Events**:
- When creating/editing events, select speakers in the "Speakers" section
- Multiple speakers can be assigned to one event

**Schedule Sessions**:
- When creating schedule items, select speakers from dropdown
- Link multiple speakers to panel sessions

---

## Schedule Management

**URL**: `/admin/schedule`

### Understanding Schedule Structure

**Hierarchy**:
```
Event (e.g., IndabaX Kenya 2026)
  └─ Day 1 (March 15, 2026)
      ├─ 08:00 - 09:00: Registration
      ├─ 09:00 - 10:00: Opening Keynote
      └─ ...
  └─ Day 2 (March 16, 2026)
      └─ ...
```

### Creating a Schedule Item

**Click**: "Add Schedule Item" button

**Required Fields**:
1. **Event*** - Select parent event
2. **Day Number*** - Integer (1, 2, 3, etc.)
3. **Start Time*** - Session start (24-hour format)
4. **End Time*** - Session end
5. **Title*** - Session name

**Optional but Recommended**:
6. **Day Name** - Display label (e.g., "Opening Day", "Day 1")
7. **Schedule Date** - Human-readable date (e.g., "March 15, 2026")
8. **Description** - Session details (what attendees will learn/do)
9. **Session Type** - Select from:
   - **Keynote** - Main presentations
   - **Talk** - Regular presentations
   - **Workshop** - Hands-on sessions
   - **Panel** - Panel discussions
   - **Break** - Coffee/lunch breaks
   - **Networking** - Networking sessions
   - **Registration** - Check-in periods
   - **Track** - Parallel session tracks
   - **Tutorial** - Tutorial sessions
   - **Poster** - Poster presentations
   - **Hackathon** - Hackathon events
   - **Social** - Social events
   - **Special** - Special ceremonies
   - **Closing** - Closing sessions
10. **Location** - Room/venue (e.g., "Main Hall", "Workshop Room 1")
11. **Speakers** - Select presenter(s)

**Steps**:
1. Select event from dropdown
2. Enter day number
3. Set start and end times
4. Write descriptive title
5. Add detailed description
6. Choose appropriate session type
7. Specify location
8. Assign speakers (if applicable)
9. Click "Create"

**Best Practices**:
- Use consistent time increments (15 or 30-minute slots)
- Leave buffer time between sessions
- Clearly label breaks and meals
- Assign speakers to all talks/workshops
- Provide detailed descriptions for workshops
- Use accurate session types for proper badging

---

### Schedule Management Tips

**Grouping**:
- Schedule items auto-group by event and day
- Sorted by start time within each day

**Day Name & Date**:
- **Day Number**: Used for sorting (1, 2, 3...)
- **Day Name**: Display label shown in tabs ("Day 1", "Opening Day")
- **Schedule Date**: Human-readable date shown under tabs ("March 15, 2026")

**Example**:
```
Day Number: 1
Day Name: "Opening Day"
Schedule Date: "March 15, 2026"
```

**Filtering**:
- Filter by event to focus on specific conferences
- Search by title/description

---

### Bulk Operations

**Copying a Day**:
1. Create first day completely
2. Copy/paste in bulk by creating similar items
3. Adjust times and details

**Deleting Sessions**:
- Use carefully - cannot be undone
- Remove outdated or cancelled sessions

---

## Gallery Management

**URL**: `/admin/gallery`

### Uploading Photos

**Click**: "Upload Photos" button

**Upload Interface**:
- Drag & drop multiple files
- Or click to select files
- Supports: JPG, PNG, WEBP
- Max file size: 5MB per image
- Compresses automatically

**Required for Each Photo**:
1. **Image File*** - Select file to upload
2. **Caption*** - Brief description
3. **Year*** - Event year (2022-2026)

**Optional Fields**:
4. **Event** - Link to specific event
5. **Category** - Type of photo:
   - Conference
   - Workshop
   - Social
   - Speakers
   - Venue
   - Team
6. **Is Featured** - Highlight important photos
7. **Tags** - Keywords for filtering
8. **Photo Date** - When photo was taken (auto-set to upload date)

**Steps**:
1. Select multiple images
2. For each image:
   - Write descriptive caption
   - Select year
   - Choose event (if applicable)
   - Pick category
   - Check "Featured" for standout shots
3. Click "Upload All"
4. System will:
   - Compress images
   - Generate thumbnails
   - Store in Supabase Storage
   - Save metadata to database

**Photo Guidelines**:
- Use high-quality, well-lit photos
- Include variety: speakers, audience, venue, activities
- Write specific captions (avoid "Event photo #1")
- Tag consistently
- Feature only best 10-15% of photos

---

### Managing Existing Photos

**Filtering**:
- By year
- By event
- By category
- By featured status

**Editing Photos**:
1. Click photo to open details
2. Update caption, tags, category
3. Toggle featured status
4. Save changes

**Bulk Actions**:
- Delete multiple photos
- Change category for selection
- Update tags in batch

**Metadata Tracking**:
- **Uploaded By**: Shows which admin uploaded
- **Photo Date**: When photo was taken
- **Created At**: When uploaded to system

---

## FAQ Management

**URL**: `/admin/faqs`

### Adding a New FAQ

**Click**: "Add FAQ" button

**Required Fields**:
1. **Question*** - Clear, specific question
2. **Answer*** - Detailed response
   - Supports rich text formatting with QuillJS editor
   - **Bold**, *italic*, underline
   - Headings (H1-H6)
   - Bulleted and numbered lists
   - Links (internal and external)
   - Images
   - Text alignment (left, center, right, justify)
   - The answer will render with full HTML formatting on the public FAQ page
3. **Category*** - Select:
   - **General** - About event
   - **Registration** - Sign-up process
   - **Schedule** - Timing, sessions
   - **Venue** - Location, facilities
   - **Travel** - Transport, accommodation
   - **Participation** - Who can attend, requirements

**Optional Fields**:
4. **Order** - Display priority (lower numbers first)
5. **Is Published** - Toggle visibility

**Steps**:
1. Write question in attendee's voice
2. Provide comprehensive answer
3. Select appropriate category
4. Set order (10, 20, 30... for easy reordering)
5. Publish when ready

**Best Practices**:
- Anticipate common questions
- Write clear, concise answers
- Use bullet points for lists
- Link to relevant pages
- Update answers as event details change
- Organize by category

**Example FAQs**:

**General**:
- "What is IndabaX Kenya?"
- "Who can attend?"

**Registration**:
- "How do I register?"
- "Is there a fee?"
- "When is the deadline?"

**Venue**:
- "Where is the event held?"
- "Is parking available?"
- "Is the venue wheelchair accessible?"

---

## Sponsors Management

**URL**: `/admin/sponsors`

### Adding a Sponsor

**Click**: "Add Sponsor" button

**Required Fields**:
1. **Name*** - Company/organization name
2. **Logo URL*** - Brand logo
   - Recommended: PNG with transparent background
   - Min size: 200x100px
3. **Tier*** - Sponsorship level:
   - **Platinum** - Top tier
   - **Gold** - Major sponsors
   - **Silver** - Mid-level
   - **Bronze** - Supporting sponsors
   - **Community** - Community partners

**Optional Fields**:
4. **Website** - Company URL
5. **Description** - Brief about company (200-300 chars)
6. **Contact Name** - Sponsor contact person
7. **Contact Email** - For coordination
8. **Order** - Display order within tier

**Steps**:
1. Enter sponsor details
2. Upload or link logo
3. Select appropriate tier
4. Add website link
5. Set display order
6. Click "Create Sponsor"

**Logo Guidelines**:
- Use official brand logos
- Transparent background preferred
- High resolution (min 200x100px)
- PNG or SVG format
- Ensure proper brand colors

---

## Venues Management

**URL**: `/admin/venues`

### Understanding Venues

Venues are conference locations where IndabaX events are held. Each venue can have detailed information including facilities, directions, nearby amenities, and can be linked to multiple events.

### Public Venue Pages

**Venue List** (`/venue`):
- Shows all active venues
- Cards display venue image, name, location, capacity
- Links to individual venue detail pages

**Venue Detail** (`/venue/[slug]`):
- Full venue information
- Image gallery
- Location map
- Facilities and amenities
- Directions and transport info
- Nearby hotels and restaurants

---

### Adding a New Venue

**Click**: "Add New Venue" button

**Required Fields**:
1. **Name*** - Venue name (e.g., "Kenyatta International Convention Centre")
2. **Slug*** - URL identifier (e.g., "kicc")
   - Auto-generated from name
   - Must be unique
3. **Country*** - Default: Kenya

**Optional Fields**:

**Basic Information Tab**:
4. **Address** - Full street address
5. **City** - City name
6. **Capacity** - Maximum attendees
7. **Phone** - Contact number
8. **Email** - Venue email
9. **Website URL** - Official website
10. **Image URL** - Venue photo (1200x600px recommended)
11. **Display Order** - Sort order in venue list
12. **Is Active** - Toggle visibility on public pages

**Rich Content Tab** (QuillJS Editor):
13. **Description** - Full venue description
    - Use rich text editor
    - Supports formatting, lists, links
14. **Facilities** - Available amenities
    - Use bullet lists for clarity
    - Include: WiFi, AV equipment, parking, accessibility, etc.
15. **Getting There** - Directions and transportation
    - From airport
    - By car (parking info)
    - Public transport options
16. **Nearby Amenities** - Hotels, restaurants, shopping
    - Organize by category (Hotels, Restaurants, Shopping)
    - Include distances

**Location & Map Tab**:
17. **Map Embed URL** - Google Maps embed link
18. **Map Latitude** - Decimal coordinates
19. **Map Longitude** - Decimal coordinates

**Events Tab**:
20. **Select Events** - Choose which events use this venue
    - Multiple events can be assigned
    - Events' venue_id updated automatically

---

### Steps to Create a Venue

1. **Fill Basic Info**:
   - Enter venue name, address, city
   - Add contact information
   - Upload high-quality venue image

2. **Write Rich Content**:
   - **Description**: Write compelling overview
     - History and significance
     - Main features
     - Why it's great for conferences

   - **Facilities**: Create organized list
     ```
     - High-speed WiFi throughout the venue
     - State-of-the-art AV equipment in all halls
     - Multiple breakout rooms for workshops
     - Professional catering services
     - Accessible facilities for all attendees
     ```

   - **Getting There**: Provide clear directions
     - From Airport section with taxi costs
     - By Car section with parking info
     - Public Transport options with costs

   - **Nearby Amenities**: List by category
     - Hotels (with distance)
     - Restaurants
     - Shopping areas

3. **Add Location Info**:
   - Get Google Maps embed URL:
     1. Go to Google Maps
     2. Search for venue
     3. Click "Share" → "Embed a map"
     4. Copy iframe src URL
   - Optional: Add lat/long coordinates

4. **Link to Events**:
   - Go to Events tab
   - Check boxes for events using this venue
   - System automatically updates events

5. **Publish**:
   - Set "Is Active" to true
   - Click "Create Venue" or "Update Venue"

---

### Using the QuillJS Rich Text Editor

The venue editor uses QuillJS for rich content formatting:

**Toolbar Features**:
- **Bold**, *Italic*, Underline
- Heading levels (H3, H4)
- Bulleted and numbered lists
- Links (select text → click link icon → paste URL)
- Clear formatting

**Best Practices**:
- Use H3 for main sections (e.g., "From Airport", "By Car")
- Use H4 for subsections (e.g., "Hotels", "Restaurants")
- Use bulleted lists for facilities and amenities
- Bold important information (e.g., costs, times)
- Keep paragraphs short and scannable

**Example Structure for "Getting There"**:
```
From Airport

Jomo Kenyatta International Airport (JKIA)
• 30 minutes drive to KICC
• Taxi/Uber: $15-25 USD
• Airport shuttle available

By Car

KICC underground parking and nearby public parking lots available.
Limited spaces - arrive early.

Public Transport

Multiple matatu and bus routes to CBD. Walking distance from bus stops.
Cost: 50-100 KSH
```

---

### Editing an Existing Venue

1. Find venue in list
2. Click **Edit** (pencil icon)
3. Modify any fields
4. Update event assignments if needed
5. Click "Update Venue"

**Common Updates**:
- Add new facilities
- Update contact information
- Refresh venue photos
- Add/remove linked events
- Update directions and transport costs

---

### Deleting a Venue

**⚠️ Warning**: Cannot delete venues that are assigned to events

**Steps**:
1. First, remove venue from all events:
   - Edit venue
   - Go to Events tab
   - Uncheck all events
   - Save
2. Then delete venue:
   - Click **Delete** (trash icon)
   - Confirm deletion

---

### Venue Detail Page Layout

The public venue detail page (`/venue/[slug]`) features:

**Hero Section**:
- Large venue image (left)
- Quick Info card (right):
  - Location with icon
  - Capacity
  - Phone
  - Email
  - Website button

**Content Cards** (Row 1 - Full Width):
- **About the Venue**: Description with compelling overview

**Content Cards** (Row 2 - Three Columns):
- **Facilities & Amenities**: Listed with checkmarks
- **Nearby Amenities**: Hotels, restaurants, shopping
- **How to Get There**: Transportation directions

**Location Map**:
- Interactive Google Maps embed
- Click to open in Google Maps for directions

**Design Features**:
- Clean card-based layout
- Icon-enhanced headings
- Blue checkmarks for lists
- Responsive (stacks on mobile)
- Reduced line spacing for better readability
- Dark text for high contrast

---

### Tips for Great Venue Pages

**Photography**:
- Use high-quality venue photos
- Show multiple angles: exterior, interior, halls
- Include capacity shots (filled rooms)
- Professional lighting

**Content Writing**:
- Start with compelling overview
- Be specific about facilities
- Provide accurate directions
- Include cost estimates for transport
- List nearby amenities with distances
- Update information regularly

**SEO**:
- Use descriptive venue names
- Include city/country in descriptions
- Add relevant keywords naturally
- Keep URLs clean and readable

---

## Pricing Tiers Management

**URL**: `/admin/pricing`

### Overview

The Pricing Tiers management page allows you to create and manage conference registration passes. This replaces the hardcoded pricing data and enables dynamic pricing updates from the admin panel.

**Features**:
- Full CRUD operations (Create, Read, Update, Delete)
- Live preview of how pricing cards will appear on homepage
- Active/inactive toggle for each tier
- Drag-and-drop ordering (display_order)
- Featured tier highlighting
- Custom badges (e.g., "Most Popular", "New")

---

### Creating a New Pricing Tier

**Click**: "Create Pricing Tier" button

**Required Fields**:
1. **Title*** - Tier name (e.g., "Student Pass", "Academic Pass")
2. **Price*** - Price amount (e.g., "FREE", "5,000", "15,000")
3. **Features*** - At least one feature required
   - Click "Add" to add each feature
   - Example features:
     - "Access to all conference sessions"
     - "Lunch on all 3 days"
     - "Certificate of attendance"

**Optional Fields**:
4. **Currency** - Default: "KSH"
5. **Period** - Default: "3 Days"
6. **Description** - Brief description (e.g., "Perfect for undergraduate and graduate students")
7. **Badge** - Display badge text (e.g., "Most Popular", "New", "Early Bird")
8. **Requirements** - Special requirements for this tier
   - Example: "Valid student ID required"
9. **Button Text** - Default: "Register Now"
10. **Button Link** - Default: "/register"
11. **Display Order** - Order of appearance (lower numbers appear first)
12. **Featured** - Checkbox to highlight this tier with border
13. **Active** - Checkbox to show/hide on website

**Steps**:
1. Enter tier title and price
2. Add currency and period if different from defaults
3. Write a brief description
4. Add all features (one at a time)
5. Add requirements if applicable
6. Set optional badge text
7. Configure button text and link
8. Set display order (1, 2, 3, etc.)
9. Check "Featured" if this is the recommended tier
10. Ensure "Active" is checked to display on website
11. Click "Create Pricing Tier"

---

### Managing Pricing Tiers

**Preview Mode**:
- Click "Show Preview" to see how tiers look on homepage
- Preview shows only active tiers
- Featured tiers have blue border and scale effect
- Badges appear in top-right corner

**Editing a Tier**:
1. Click "Edit" button on any tier
2. Update fields as needed
3. Click "Update Pricing Tier"

**Toggle Active Status**:
- Use the switch toggle in the table
- Deactivated tiers are hidden from public website
- Allows you to temporarily hide tiers without deleting

**Deleting a Tier**:
1. Click "Delete" button
2. Confirm deletion
3. **Warning**: This cannot be undone

**Best Practices**:
- Keep 3-4 pricing tiers maximum
- Mark the most popular tier as "Featured"
- Use clear, concise feature descriptions
- Order tiers from lowest to highest price
- Update prices well before registration opens
- Test with preview before activating

---

## Statistics Management

**URL**: `/admin/stats`

### Overview

The Statistics management page allows you to create and manage the fun facts/statistics counter displayed on the homepage. These animated counters show key conference metrics.

**Features**:
- Full CRUD operations (Create, Read, Update, Delete)
- Live preview of homepage statistics section
- Active/inactive toggle for each stat
- Custom icon selection (Icofont classes)
- Custom color picker for icons and numbers
- Drag-and-drop ordering (display_order)

---

### Creating a New Stat

**Click**: "Create Stat" button

**Required Fields**:
1. **Label*** - Stat name (e.g., "Attendees", "Speakers", "Countries")
2. **Value*** - Number to display (e.g., 500, 50, 20)

**Optional Fields**:
3. **Suffix** - Text after number (e.g., "+", "K", "M")
4. **Icon** - Icofont class name
   - Select from dropdown or enter custom class
   - Common icons:
     - `icofont-users-alt-4` (Attendees)
     - `icofont-microphone` (Speakers)
     - `icofont-globe` (Countries)
     - `icofont-calendar` (Years)
     - `icofont-chart-bar-graph` (General stats)
5. **Color** - Hex color code for icon and number
   - Click color swatches or enter custom hex
   - Default: `#3498DB` (blue)
6. **Display Order** - Order of appearance (1, 2, 3, 4)
7. **Active** - Checkbox to show/hide on website

**Steps**:
1. Enter stat label
2. Enter numeric value
3. Add suffix if needed (e.g., "+" for "500+")
4. Select or enter icon class
5. Choose color from palette or enter hex code
6. Set display order
7. Ensure "Active" is checked
8. Preview icon and color in form
9. Click "Create Stat"

---

### Managing Statistics

**Preview Mode**:
- Click "Show Preview" to see homepage statistics section
- Preview shows only active stats
- Animated counter effect (counts up on scroll)
- Icons and numbers use custom colors

**Editing a Stat**:
1. Click "Edit" button on any stat
2. Update fields as needed
3. See live preview of icon/color changes
4. Click "Update Stat"

**Toggle Active Status**:
- Use the switch toggle in the table
- Deactivated stats are hidden from public website
- Allows you to temporarily hide stats without deleting

**Icon Preview**:
- The form shows a live preview of the selected icon and color
- Change icon or color to see instant preview
- Helps ensure the right icon is selected

**Color Options**:
- Pre-defined color palette:
  - `#FF5733` (Orange/Red)
  - `#3498DB` (Blue)
  - `#1ABC9C` (Teal)
  - `#F39C12` (Orange)
  - `#9B59B6` (Purple)
  - `#E74C3C` (Red)
  - `#2ECC71` (Green)
  - `#34495E` (Dark Gray)
- Or enter custom hex code

**Best Practices**:
- Keep stats to 4-6 items maximum
- Use round numbers (500+ instead of 487)
- Choose contrasting colors for variety
- Order stats by importance or logical flow
- Update values after each conference
- Use meaningful suffixes ("+", "K" for thousands)

**Example Stats**:
- Attendees: 500+ (users icon, orange)
- Speakers: 50+ (microphone icon, blue)
- Countries: 20+ (globe icon, teal)
- Years: 4 (calendar icon, amber)

---

## User Management

---

## Applications Review

**URL**: `/admin/applications`

### Application Review Process

**Application List**:
- Shows all submissions
- Filter by:
  - Status (Pending/Accepted/Rejected)
  - Event
  - Application type (Registration/Call for Papers)
- Search by name or email

### Reviewing an Application

**Click**: Application to open details

**Applicant Information**:
- Full name
- Email address
- Phone number
- Organization
- Submitted date

**Application Content**:
- Background/bio
- Motivation
- Short answer responses
- Attachments (if any)

**Review Actions**:
1. **Accept**:
   - Changes status to "Accepted"
   - Can add acceptance notes
   - Applicant receives confirmation email

2. **Reject**:
   - Changes status to "Rejected"
   - Can add rejection reason (internal notes)
   - Sends regret email

3. **Pending**:
   - Keep for further review
   - Add reviewer notes
   - Assign to team member

**Admin Notes**:
- Internal comments not visible to applicant
- Track review discussions
- Note follow-up actions

**Steps**:
1. Read application thoroughly
2. Evaluate based on criteria
3. Add internal notes
4. Select action (Accept/Reject/Pending)
5. Add acceptance/rejection message
6. Click "Update Status"

**Best Practices**:
- Review applications promptly
- Use consistent evaluation criteria
- Provide constructive rejection feedback
- Keep notes for audit trail
- Follow up with accepted applicants

---

## Newsletter Subscribers

**URL**: `/admin/subscribers`

### Managing Subscribers

**Subscriber List**:
- Email address
- Subscribe date
- Source (newsletter form, registration, etc.)

**Actions**:
1. **Export** - Download as CSV
   - Use for email campaigns
   - Import to Mailchimp/other platforms

2. **Remove** - Delete individual subscribers
   - For unsubscribe requests
   - Spam/invalid emails

**Export Format**:
```csv
email,subscribed_at,source
user@example.com,2025-03-15,newsletter_widget
```

**Privacy Compliance**:
- Only use for IndabaX communications
- Honor unsubscribe requests promptly
- Secure subscriber data
- Don't share with third parties without consent

---

## System Settings

**URL**: `/admin/settings`

### Available Settings

1. **Registration Popup**
   - Enable/disable homepage registration popup
   - Set delay before showing
   - Customize popup message

2. **Featured Content**
   - Select featured events for homepage
   - Choose featured speakers
   - Highlight featured posts

3. **Social Media Links**
   - Update Twitter, LinkedIn, Facebook handles
   - YouTube channel
   - Instagram account

4. **Contact Information**
   - Primary email
   - Phone number
   - Office address

5. **SEO Settings**
   - Meta descriptions
   - Keywords
   - Open Graph images

---

## Best Practices

### Content Creation

**Writing Style**:
- Clear, professional, accessible
- Avoid jargon
- Use bullet points for lists
- Break up long paragraphs
- Include calls-to-action

**Images**:
- Always use high-quality images
- Optimize file sizes (< 2MB)
- Use descriptive alt text
- Maintain consistent aspect ratios
- Credit photographers when required

**SEO**:
- Write descriptive page titles
- Use heading hierarchy (H1, H2, H3)
- Include keywords naturally
- Write compelling meta descriptions
- Use clean, readable URLs (slugs)

### Workflow

**Before Major Events**:
1. Create event page (6-8 weeks before)
2. Add speakers as confirmed
3. Build schedule (4-6 weeks before)
4. Create registration form
5. Publish news posts (announcements, CFPs)
6. Update FAQ regularly
7. Add sponsor logos

**During Events**:
1. Post live updates (news posts)
2. Upload photos daily
3. Monitor applications
4. Respond to inquiries

**After Events**:
1. Upload full photo gallery
2. Change event status to "Past"
3. Archive/hide registration forms
4. Publish recap post
5. Send thank-you emails
6. Update statistics

### Security

**Password Management**:
- Change password every 90 days
- Use strong, unique passwords
- Don't share credentials
- Log out after each session

**Data Privacy**:
- Don't expose applicant personal data
- Secure email exports
- Follow GDPR compliance
- Obtain consent for photos

### Performance

**Image Optimization**:
- Compress before uploading
- Use appropriate formats (JPEG for photos, PNG for logos)
- Don't upload originals (resize first)

**Content Cleanup**:
- Archive old events periodically
- Remove outdated FAQs
- Delete test content
- Prune unused tags

---

## Troubleshooting

### Common Issues

**Can't Login**:
- Verify credentials exactly as shown
- Clear browser cache
- Try incognito/private mode
- Contact system administrator

**Images Not Uploading**:
- Check file size (< 5MB)
- Verify format (JPG, PNG, WEBP)
- Try different browser
- Check internet connection

**Changes Not Showing**:
- Hard refresh page (Ctrl+Shift+R / Cmd+Shift+R)
- Clear browser cache
- Verify status is "Published"
- Check visibility settings

**Schedule Not Grouping Correctly**:
- Verify day_number is integer
- Check event_id matches
- Ensure times are in 24-hour format
- Look for duplicate entries

---

## Support

For technical support:
- Email: support@indabaxkenya.org
- System Administrator: admin@indabaxkenya.org
- Documentation: `/USER_GUIDE.md` (this file)

For bug reports:
- Include screenshots
- Describe steps to reproduce
- Note browser and OS version

---

## Recent Updates

### Version 1.2 - October 24, 2025
- Added venue selector to event forms for easy venue linking
- Added event linking capability in venue management (Events Tab)
- Added weekend configuration fields for events (includes_saturday, includes_sunday)
- Added event_dates array field for non-consecutive event dates
- Enhanced FAQ editor with rich text formatting support
- Fixed FAQ display to properly render HTML content with proper styling
- Added registration URL and max attendees fields to events
- Improved venue detail page layout and responsive design

---

**Last Updated**: October 24, 2025
**Version**: 1.2
**System**: IndabaX Kenya Website v1.4.0
