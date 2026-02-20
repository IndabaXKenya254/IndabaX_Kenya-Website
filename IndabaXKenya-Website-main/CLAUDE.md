# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL MCP USAGE RULES - NEVER FORGET ⚠️

**ENGRAVED WORKFLOW FOR SUPABASE MCP:**

1. **🚫 NEVER USE MCP WITHOUT EXPLICIT APPROVAL**
   - Every MCP action MUST be approved by the user first
   - Present the action clearly, wait for "yes" or confirmation
   - No automatic MCP executions - single action with approval each time

2. **📝 ALWAYS DOCUMENT LOCALLY FIRST**
   - Create/update files locally BEFORE executing with MCP
   - Write SQL migration files to `supabase/migrations/` directory
   - Document what MCP will do in markdown files
   - User must review the files before MCP execution

3. **🏭 PRODUCTION WILL BE MANUAL**
   - Development uses MCP for speed
   - Production deployment will be done manually/by hand
   - All MCP actions must be reproducible manually
   - Keep migration files and guides for manual execution

4. **🔐 CURRENT SUPABASE PROJECT**
   - Project Ref: `klnspdwlybpwkznzezzd`
   - URL: https://klnspdwlybpwkznzezzd.supabase.co
   - Never hardcode credentials - use `.env.local`

**WORKFLOW EXAMPLE:**
```
User: "Create the database tables"
Claude:
  1. Creates migration file locally (supabase/migrations/xxx.sql)
  2. Shows user the file
  3. Asks: "May I execute this migration using MCP?"
  4. Waits for approval
  5. Only then uses MCP to execute
```

---

## Project Overview

IndabaX Conference Website - An official information and communication platform for the IndabaX community, including a sub-event called NOAI. The site provides event information, news updates, application workflows, and administrative evaluation capabilities.

**Budget:** 50,000 KSH
**Timeline:** 3 weeks (original) → Now in Redesign Phase
**Templates Used:** Evnia v1.4.0 (base) + Eventify v1.0.0 (features)
**Technical Reference:** See `TEMPLATE_TECHNICAL_DOCUMENTATION.md` for complete template analysis

---

## 🚨 CURRENT PROJECT: Registration & Application System Redesign

**Status:** Planning Complete - Integration Phase
**Documentation:** `../features/` directory contains complete redesign documentation
**Integration Plan:** `../features/INTEGRATION_PLAN.md`

### What's Being Redesigned

The registration and application system is being completely redesigned to support:
- Multi-stage application workflows (Interest → Review → Shortlist → Survey → Approval → Ticketing)
- Google Forms-like dynamic form builder (15 question types)
- User authentication with email verification
- Auto-save and resumable surveys
- Reviewer system with permissions
- Review locking mechanism (prevent concurrent reviews)
- Email templates with QuillJS editor
- PDF ticket generation with QR codes
- Analytics dashboard

### Key Documents

1. **`../features/INTEGRATION_PLAN.md`** - Start here! Integration roadmap
2. **`../features/PROJECT_REQUIREMENTS.md`** - Complete requirements
3. **`../features/DATABASE_SCHEMA.md`** - New database schema
4. **`../features/FORM_BUILDER_SPECIFICATION.md`** - Form builder technical spec
5. **`../features/IMPLEMENTATION_ROADMAP.md`** - 13-phase development plan

### Email Configuration

**Email Accounts:**
- `accounts@deeplearningindabaxkenya.com` (Password: `X5Egh+][4*k$`)
- `applications@deeplearningindabaxkenya.com` (Password: `OMZ)HZw[QuZe`)
- **SMTP:** `server72.web-hosting.com:465` (SSL/TLS)

---

## Architecture

### Frontend
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Base Template**: Evnia (cleaner code structure)
- **Styling**: Bootstrap 5 + Sass + Custom CSS
- **Animations**: AOS (Animate On Scroll) from Eventify
- **Fonts**: Poppins (or Figtree + Space Grotesk)
- **Icons**: Icofont or FontAwesome

**Key Pages**:
  - Home: Introduction to IndabaX and NOAI
  - Events: Upcoming and past events with descriptions and media (from Eventify pattern)
  - News & Updates: Announcements, articles, and posts
  - Speakers: With flip card animation (custom build)
  - Gallery: Downloadable images from 2022-present (Eventify memories page as base)
  - Call for Applications: Application submission form
  - Contact: Contact form and social links

**Components**:
  - Newsletter subscription widget (email capture)
  - Responsive navigation for mobile and desktop (Evnia pattern)
  - Registration popup with admin toggle (custom build)
  - Speaker flip cards (custom build)
  - Admin panel for content management and application review

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth for admin access
- **Storage**: Supabase Storage for images
- **API**: Supabase auto-generated REST API

**Database Tables**:
  - `events` - Event information
  - `posts` - News and announcements
  - `applications` - User applications
  - `subscribers` - Newsletter subscribers
  - `speakers` - Speaker information
  - `photos` - Gallery images
  - `settings` - Site settings (popup toggle, etc.)
  - `admins` - Admin users

### Admin Panel Features
- Post Management: Create, edit, delete event updates and announcements
- Event Management: Manage upcoming and past events
- Application Review: View applications, update status (accepted/rejected/pending), add notes
- Speaker Management: Add/edit speakers with photos and LinkedIn
- Gallery Management: Upload photos organized by year
- Subscriber Management: View and export email list
- Settings: Control registration popup visibility

### External Integrations
- Supabase for backend services
- Vercel for hosting (free tier)
- Mailchimp API for newsletter (optional)
- Analytics (optional)

## Development Commands

### Initial Setup
```bash
# Copy Evnia template as base
cp -r templates/evnia-react-nextjs-event-conference-meetup-template/envia ./indabax-website
cd indabax-website

# Install dependencies
npm install

# Install Supabase
npm install @supabase/supabase-js

# Install animations (from Eventify)
npm install aos

# Install additional dependencies
npm install react-hook-form zod @hookform/resolvers react-quill @tanstack/react-table

# Create environment file
cp .env.example .env.local
# Add Supabase credentials
```

### Development
```bash
# Run development server
npm run dev
# Opens at http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Supabase (Database)
```bash
# No local commands needed - use Supabase Dashboard
# Access: https://supabase.com/dashboard

# Or use Supabase CLI (optional)
npx supabase init
npx supabase start
npx supabase db push
```

### Working with Templates
```bash
# To reference Evnia components
# Location: templates/evnia-react-nextjs-event-conference-meetup-template/envia/src/components

# To reference Eventify components
# Location: templates/Eventify_v1.0.0_Unzip-First/1.Eventify_nextjs_template/components
```

## Design Requirements

- **Responsive**: Must work seamlessly on mobile and desktop
- **Branding**: Align colors and theme with IndabaX branding
- **Layout**: Clean, professional, easy navigation
- **Assets**: Logo and banner placement for both IndabaX and NOAI

## Data Models

### Application
- name: string
- email: string
- background: text
- shortAnswers: text (JSON array of Q&A pairs)
- status: enum (pending, accepted, rejected)
- notes: text (admin feedback)
- submittedAt: timestamp
- reviewedAt: timestamp (optional)

### Subscriber
- email: string (unique)
- subscribedAt: timestamp

### Post (News/Events)
- title: string
- content: text (rich text/markdown)
- type: enum (event, news, announcement)
- publishedAt: timestamp
- updatedAt: timestamp
- authorId: string (admin user)
- featuredImage: string (URL)

### Admin User
- email: string (unique)
- passwordHash: string
- role: enum (admin, super_admin)

## Environment Variables

Required environment variables (create `.env.local`):
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Optional: Mailchimp (if using)
MAILCHIMP_API_KEY="your-mailchimp-key"
MAILCHIMP_LIST_ID="your-list-id"

# Optional: Email service (Resend, etc.)
EMAIL_API_KEY="your-email-api-key"
```

## Deployment

The site should be deployable to:
- Vercel (recommended for Next.js)
- Netlify
- Custom hosting with Node.js support

Ensure database backups and security updates are part of the maintenance plan.

## Key Technical Decisions

1. **Next.js with App Router**: Enables server-side rendering, API routes, and optimal SEO
2. **Prisma ORM**: Type-safe database access with easy migrations
3. **NextAuth.js**: Simple authentication for admin panel
4. **Tailwind CSS**: Utility-first styling for rapid development and consistency
5. **React Hook Form**: Efficient form handling with validation for applications and contact forms
6. **Zod**: Schema validation for form inputs and API endpoints

---

## ⚠️ CRITICAL STYLING ISSUE - BUTTON VISIBILITY FIX (PERMANENT)

### Problem (RESOLVED - November 22, 2025)

**Issue:** All buttons across the entire application (admin panel and public pages) were invisible until hover due to incorrect theme variable mapping.

**Root Cause:** In `/styles/style.scss:54`, the Evnia template variable mapping had:
```scss
$white-color: $background;  // = #F8FFFC (near-white, same as page background)
```

This caused all `.btn` elements to have near-white text (`color: $white-color`) on white backgrounds, making them invisible.

### Solution Applied ✅

**Three-part fix to ensure buttons are always visible:**

#### 1. Fixed Theme Variable Mapping
**File:** `/styles/style.scss:54`
```scss
// BEFORE (WRONG):
$white-color: $background;  // Near-white #F8FFFC

// AFTER (CORRECT):
$white-color: $text-white;  // Pure white #FFFFFF
```

#### 2. Created Global Button Override File
**File:** `/styles/button-fixes.css` (NEW FILE - DO NOT DELETE)

This file contains comprehensive Bootstrap button overrides with `!important` flags to ensure:
- All outline button variants have visible colored text
- All solid button variants have proper backgrounds and white text
- Removes conflicting `::before` and `::after` pseudo-elements from Evnia theme
- Proper hover states with good contrast
- Handles all button variants: primary, secondary, success, danger, warning, info, light, dark

#### 3. Imported in Root Layout
**File:** `/src/app/layout.tsx`
```tsx
// Global Button Visibility Fixes (CRITICAL - DO NOT REMOVE)
import "../../styles/button-fixes.css";
```

### Files Modified (DO NOT REVERT):

1. `/styles/style.scss` - Line 54: Changed `$white-color` mapping
2. `/styles/button-fixes.css` - NEW FILE: Global button overrides (CRITICAL)
3. `/src/app/layout.tsx` - Added import for button-fixes.css
4. `/src/styles/admin.css` - Added admin-specific button overrides

### Prevention Rules:

1. **NEVER** change `$white-color` back to `$background` in `/styles/style.scss`
2. **NEVER** delete or modify `/styles/button-fixes.css`
3. **NEVER** remove the button-fixes.css import from `/src/app/layout.tsx`
4. **ALWAYS** test button visibility on both light and dark backgrounds when adding new buttons
5. **IF** you see invisible buttons, check that button-fixes.css is still imported in layout.tsx

### Testing Checklist:

When adding new buttons or modifying styles, verify:
- ✅ Buttons are visible without hover on white backgrounds
- ✅ Buttons are visible on colored backgrounds
- ✅ Outline buttons show colored borders and text
- ✅ Solid buttons have proper background colors
- ✅ Hover states work correctly
- ✅ Admin panel buttons are visible
- ✅ Public page buttons (home, events, contact) are visible

### Quick Test Pages:
- Admin: http://localhost:3000/admin/email-templates/new (Quick Variables buttons)
- Public: http://localhost:3000/ (CTA buttons, navigation)
- NOAI: http://localhost:3000/noai (Hero buttons, CTA section)
- NOAI Apply: http://localhost:3000/noai/apply (Sidebar buttons)
- NOAI Gallery: http://localhost:3000/noai/gallery (Gallery buttons)

### NOAI-Specific Notes (Added November 26, 2025):

The NOAI pages use a custom color scheme with `--noai-primary: #e30045`. The `button-fixes.css` file includes NOAI-specific overrides for:
- `.noai-hero-section` buttons
- `.noai-cta-section` buttons
- `.noai-cta-banner` buttons (including `.btn-light` variant)
- `.noai-cta-compact` buttons
- `.ioai-intro-section` buttons
- `.ioai-2026-section` buttons
- `.kenya-participation-section` buttons
- `.noai-gallery-area` buttons
- `.btn-text` variant (text-only button style)

**IMPORTANT**: The `button-fixes.css` import MUST be LAST in `layout.tsx` to override all other styles including `noai.css`.

---
