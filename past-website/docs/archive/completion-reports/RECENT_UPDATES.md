# Recent Updates - October 24, 2025

## Summary

This document summarizes the recent updates made to the IndabaX Kenya Website, including new features, bug fixes, and database migrations.

---

## 🎨 Frontend Updates

### 1. Venue Selector in Event Forms
- **Location**: Event creation and edit forms (`/admin/events/new`, `/admin/events/[id]`)
- **Feature**: Added dropdown selector to link events to venues
- **Component**: `VenueSelector.tsx` - Fetches venues from API and displays them with name, city, country
- **Functionality**:
  - Shows all active venues in dropdown
  - Allows "No venue (online/TBD)" option
  - Automatically updates event's `venue_id` field
  - Displays selected venue details below dropdown

### 2. Event Linking in Venue Forms
- **Location**: Venue management (`/admin/venues`)
- **Feature**: New "Events" tab in venue creation/edit modal
- **Functionality**:
  - Select multiple events to link to the venue
  - System automatically updates selected events with venue's ID
  - Clears venue from unselected events when editing
  - Visual checkboxes with event details (title, date, status)
- **API Integration**:
  - Uses PATCH `/api/admin/events/[id]` to update event venues
  - Supports bulk event linking

### 3. Weekend Configuration for Events
- **Location**: Event creation and edit forms
- **Fields Added**:
  - "Includes Saturday" checkbox (default: checked)
  - "Includes Sunday" checkbox (default: checked)
- **Purpose**: Accurate day count calculations for events
- **Use Case**: Events that skip weekends or run only on weekdays

### 4. FAQ Rich Text Display Fix
- **Issue**: FAQ answers were showing raw HTML tags instead of formatted content
- **Fix**:
  - Updated `FAQAccordion.tsx` to use `dangerouslySetInnerHTML` for proper HTML rendering
  - Added CSS styles in `quill-custom.css` for rendered Quill content
  - Supports all Quill formatting: headings, lists, links, images, text alignment, etc.
- **Result**: FAQs now display with full rich text formatting

---

## 🗄️ Backend Updates

### 1. API Endpoints Enhanced

#### Events API (`/api/admin/events`)
- **New Filter**: Added `venue_id` query parameter
- **Example**: `/api/admin/events?venue_id=xxx` - Fetch all events for a specific venue
- **Purpose**: Load events linked to a venue when editing

#### Venues API Fixes
- **Fixed**: Venue event linking now uses correct endpoints
  - Changed from `PUT /api/admin/events` to `PATCH /api/admin/events/[id]`
  - Properly updates `venue_id` field in events

### 2. Validation Schema Updates (`lib/validations/admin.ts`)

**Event Schemas** (create and update):
- Added `venue_id` (UUID, nullable, optional)
- Added `includes_saturday` (boolean, default true)
- Added `includes_sunday` (boolean, optional for updates)
- Added `event_dates` (array of date strings, nullable, optional)
- Updated `registration_url` and `max_attendees` handling

**Benefits**:
- Proper null handling for optional fields
- Type-safe validation with Zod
- Auto-transforms null to undefined where needed

---

## 🗃️ Database Migrations

### New Migrations Added to Production SQL

All migrations are located in `/supabase/prodsql/` and ready for production deployment.

#### Migration 22: `22_expand_event_type_and_status.sql`
- Expands `event_type` constraint to support 5 types (was 2)
- **Types**: upcoming, past, workshop, conference, meetup
- Expands `status` constraint to include "upcoming"
- **Status**: ✅ Executed on development

#### Migration 23: `23_add_venue_images_bucket.sql`
- Creates `venue-images` storage bucket in Supabase
- **Configuration**:
  - Max file size: 5MB
  - Allowed types: JPEG, PNG, WebP, GIF
  - Public bucket (read access)
- **RLS Policies**:
  - Admins can upload/update/delete
  - Public can view
- **API**: `/api/admin/upload/venue-image`
- **Status**: ✅ Executed on development

#### Migration 24: `24_add_event_weekend_fields.sql`
- Adds `includes_saturday` (BOOLEAN, default TRUE)
- Adds `includes_sunday` (BOOLEAN, default TRUE)
- **Purpose**: Accurate event day calculations
- **Status**: ✅ Executed on development

#### Migration 25: `25_add_event_dates_array.sql`
- Adds `event_dates` (TEXT ARRAY)
- **Format**: ['2026-03-15', '2026-03-17', '2026-03-22']
- **Purpose**: Support non-consecutive event days
- **Use Case**: Events spread across specific dates
- **Status**: ✅ Executed on development

#### Migrations 26-27: Renumbered (Previously 22-23)
- **26**: `add_team_photos_bucket.sql` - Team photos storage
- **27**: `add_team_updated_at.sql` - Team members updated_at column

### Migration Numbering Fix
- **Issue**: Duplicate migration numbers (two "22", two "23")
- **Resolution**: Renumbered migrations for unique sequential IDs (01-27)
- **Files Renamed**:
  - `22_add_team_photos_bucket.sql` → `26_add_team_photos_bucket.sql`
  - `23_add_team_updated_at.sql` → `27_add_team_updated_at.sql`

---

## 📝 Documentation Updates

### 1. USER_GUIDE.md (Version 1.2)

#### Events Management Section Updated
- Added venue selector documentation
- Added weekend configuration fields explanation
- Added event_dates array field documentation
- Added registration URL and max attendees fields
- Updated optional fields list with detailed descriptions

#### FAQ Management Section Updated
- Added rich text editor capabilities documentation
- Listed all supported formatting options:
  - Bold, italic, underline
  - Headings (H1-H6)
  - Bulleted and numbered lists
  - Links and images
  - Text alignment (left, center, right, justify)
- Noted that answers render with full HTML formatting on public pages

#### Venues Management Section
- Already comprehensive (no changes needed)
- Includes Events Tab documentation
- Covers venue linking functionality

#### Recent Updates Section Added
- New section at bottom of guide
- Lists all Version 1.2 changes
- Dated October 24, 2025

### 2. Production SQL README Updated (`supabase/prodsql/README.md`)

#### Recent Updates Section Added
- Highlights migrations 22-27
- Explains migration numbering fix
- Dated October 24, 2025

#### Run Order Updated
- Added migrations 22-27 to execution order
- Updated with full descriptions

#### Migration Details Added
- Comprehensive documentation for each new migration
- Includes fields added, constraints, purpose, status
- RLS policies explained
- API endpoints documented

---

## 🎨 CSS Updates

### Quill Content Rendering Styles (`styles/quill-custom.css`)

Added new section: "RENDERED QUILL CONTENT (For Display Outside Editor)"

**Styles Added For**:
- `.quill-content`, `.answer-content`, `.faq-answer .answer-content`
- Text alignment classes (`ql-align-justify`, `ql-align-center`, etc.)
- Headings (H1-H6) with proper font sizes
- Paragraphs with spacing
- Strong text (bold)
- Lists (ul, ol) with proper indentation
- Links with hover effects
- Images with rounded corners and auto-sizing
- Blockquotes with styled borders
- Code and code blocks with syntax highlighting
- Videos/iframes with responsive sizing

**Result**: Quill-generated HTML now displays beautifully on public pages with consistent styling

---

## 🔧 Configuration Updates

### Upload Configuration (`lib/upload/config.ts`)
- Added `venue-images` to `BucketName` type
- Added to `MAX_FILE_SIZES` (5MB)
- Added to `ALLOWED_MIME_TYPES` (JPEG, PNG, WebP)
- Added to `BUCKET_CONFIGS` with full configuration

---

## 🐛 Bug Fixes

### 1. FAQ HTML Rendering
- **Issue**: Raw HTML tags showing as text (e.g., `<p class="ql-align-justify">`)
- **Root Cause**: Component was displaying HTML as plain text
- **Fix**: Use `dangerouslySetInnerHTML` to render HTML content
- **Location**: `src/components/FAQ/FAQAccordion.tsx:210-213`

### 2. Venue Event Linking API Error
- **Issue**: 405 Method Not Allowed when updating event venues
- **Root Cause**: Using wrong endpoint (`PUT /api/admin/events` instead of `PATCH /api/admin/events/[id]`)
- **Fix**: Updated venue management functions to use correct endpoints
- **Files Fixed**: `src/app/admin/venues/page.tsx:322-334`, `336-353`

### 3. Missing venue-images Bucket in Config
- **Issue**: "Invalid bucket: venue-images" error
- **Root Cause**: Bucket existed in Supabase but not in code configuration
- **Fix**: Added venue-images to `lib/upload/config.ts`

---

## 📦 New Components Created

### 1. VenueSelector Component
- **File**: `src/components/admin/selectors/VenueSelector.tsx`
- **Type**: Single-select dropdown
- **Features**:
  - Fetches venues from `/api/admin/venues?limit=100`
  - Displays venue name, city, and country
  - Includes "No venue (online/TBD)" option
  - Shows selected venue details
  - Loading and error states
  - Disabled state support
- **Exported**: Added to `src/components/admin/selectors/index.ts`

### 2. EventSelector Component (Created but Not Yet Used)
- **File**: `src/components/admin/selectors/EventSelector.tsx`
- **Type**: Multi-select dropdown
- **Features**:
  - Search/filter events
  - Checkbox selection
  - Badge display for selected events
  - Date range formatting
  - Exclude event option (for edit forms)
- **Purpose**: Future use for advanced event management
- **Status**: Ready for integration

---

## 🔄 API Routes Created

### Venue Image Upload
- **File**: `src/app/api/admin/upload/venue-image/route.ts`
- **Method**: POST
- **Authentication**: Required (admin)
- **Parameters**:
  - `file` (multipart/form-data)
- **Response**: `{ success: true, data: { url, path, bucket } }`
- **Purpose**: Handle venue image uploads to Supabase Storage

---

## ✅ Testing Status

All features have been tested in development environment:

- ✅ Venue selector in event forms
- ✅ Event linking in venue forms
- ✅ Weekend configuration checkboxes
- ✅ FAQ rich text display
- ✅ Venue image upload
- ✅ Database migrations (22-27)
- ✅ API endpoint updates
- ✅ Validation schema changes

---

## 📋 Deployment Checklist

### Database Migrations
- [ ] Run migrations 22-27 on production Supabase
- [ ] Verify `venue-images` bucket exists
- [ ] Test venue image upload
- [ ] Verify event weekend fields exist

### Frontend Deployment
- [ ] Deploy updated code to production
- [ ] Clear CDN cache if applicable
- [ ] Verify venue selector works
- [ ] Test FAQ display formatting
- [ ] Check event linking functionality

### Documentation
- [x] Update USER_GUIDE.md
- [x] Update production SQL README
- [x] Create RECENT_UPDATES.md (this file)

---

## 🔗 Related Files

### Modified Files
- `src/components/FAQ/FAQAccordion.tsx`
- `src/app/admin/venues/page.tsx`
- `src/app/admin/events/new/page.tsx`
- `src/app/admin/events/[id]/page.tsx`
- `src/app/api/admin/events/route.ts`
- `lib/validations/admin.ts`
- `lib/upload/config.ts`
- `styles/quill-custom.css`
- `USER_GUIDE.md`
- `supabase/prodsql/README.md`

### New Files Created
- `src/components/admin/selectors/VenueSelector.tsx`
- `src/components/admin/selectors/EventSelector.tsx`
- `src/app/api/admin/upload/venue-image/route.ts`
- `supabase/prodsql/22_expand_event_type_and_status.sql`
- `supabase/prodsql/23_add_venue_images_bucket.sql`
- `supabase/prodsql/24_add_event_weekend_fields.sql`
- `supabase/prodsql/25_add_event_dates_array.sql`
- `RECENT_UPDATES.md` (this file)

### Files Renamed
- `supabase/prodsql/22_add_team_photos_bucket.sql` → `26_add_team_photos_bucket.sql`
- `supabase/prodsql/23_add_team_updated_at.sql` → `27_add_team_updated_at.sql`

---

## 📞 Support

For questions about these updates:
- **Technical Issues**: Check USER_GUIDE.md Troubleshooting section
- **Migration Issues**: Review `supabase/prodsql/README.md`
- **Feature Questions**: Refer to USER_GUIDE.md sections

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Author**: Development Team
