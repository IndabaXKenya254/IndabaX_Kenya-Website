# IndabaX Kenya - Event Settings User Guide

This guide explains how to manage event details, social media links, and venue information on the IndabaX Kenya website.

---

## Table of Contents
1. [Making Event Dates Prominent](#1-making-event-dates-prominent)
2. [Clarifying Multiple Event Dates](#2-clarifying-multiple-event-dates)
3. [Managing Social Media Links](#3-managing-social-media-links)
4. [Setting Venue/Location Information](#4-setting-venuelocation-information)

---

## 1. Making Event Dates Prominent

### How Event Dates Are Displayed

The website displays event dates in several locations:
- **Meta description** (SEO) - Automatically pulled from the featured/upcoming event
- **Event cards** on the Events page
- **Event detail pages**
- **Footer** (if banner settings are configured)

### How to Set Featured Event Dates

1. Go to **Admin Panel** → **Events** (`/admin/events`)
2. Find your main event (e.g., "IndabaX Kenya 2026")
3. Click **Edit**
4. Set the following fields:
   - **Start Date**: The first day of the event
   - **End Date**: The last day of the event
   - **Is Featured**: Toggle ON to make this the primary event
   - **Status**: Set to "Upcoming"
5. Click **Save**

The featured event's dates will automatically appear in:
- The website's meta description for SEO
- Various components that display the "current" event

### Setting Registration Deadline

1. Go to **Admin Panel** → **Settings** (`/admin/settings`)
2. Click the **Event & Banner** tab
3. Find **Registration Deadline**
4. Set the deadline date
5. Click **Save All Settings**

This deadline will appear on the homepage registration call-to-action section.

---

## 2. Clarifying Multiple Event Dates

### The Problem
If you have multiple events (e.g., main conference in March, workshops in January), visitors may get confused about which dates apply to which event.

### Solution: Proper Event Management

1. **Create Separate Events** for each program:
   - Go to **Admin Panel** → **Events**
   - Click **Add Event**
   - Create distinct events with clear titles:
     - "IndabaX Kenya 2026 Conference" (March 15-17)
     - "Pre-Conference Workshops" (January 7-10)

2. **Use Descriptive Titles**:
   - ✅ Good: "IndabaX Kenya 2026 - Main Conference"
   - ❌ Bad: "Event 1"

3. **Set Correct Event Types**:
   - Conference
   - Workshop
   - Meetup
   - Hackathon

4. **Mark the Main Event as Featured**:
   - Only ONE event should have "Is Featured" enabled
   - This event's dates appear in the website metadata

5. **Add Clear Descriptions**:
   - Include dates in the event description
   - Specify the relationship between events (e.g., "This workshop precedes the main conference")

### Event Status Options
- **Upcoming**: Visible to public, registration may be open
- **Ongoing**: Currently happening
- **Past**: Completed, shown in history
- **Archived**: Hidden from public

---

## 3. Managing Social Media Links

### Current Social Links
The website supports these social platforms:
- Twitter/X
- LinkedIn
- Facebook
- Instagram
- YouTube
- GitHub

### How to Add/Update Social Links

1. Go to **Admin Panel** → **Settings** (`/admin/settings`)
2. Click the **Contact & Social** tab
3. Enter the full URLs for each platform:
   - **Twitter/X**: `https://x.com/IndabaXKenya`
   - **LinkedIn**: `https://www.linkedin.com/company/indabax-kenya`
   - **Instagram**: `https://www.instagram.com/indabax/`
   - **Facebook**: Enter your Facebook page URL
   - **YouTube**: Enter your YouTube channel URL
   - **GitHub**: Enter your GitHub organization URL
4. Click **Save All Settings**

### Where Social Links Appear
- Website footer (all pages)
- Contact page

### Important Notes
- Leave fields empty if you don't have that social platform
- Use full URLs starting with `https://`
- Test links after saving to ensure they work

### Official IndabaX Kenya Social Accounts
- **Twitter/X**: [@IndabaXKenya](https://x.com/IndabaXKenya)
- **LinkedIn**: [IndabaX Kenya](https://www.linkedin.com/company/indabax-kenya)
- **Linktree**: [linktr.ee/indabaxkenya](https://linktr.ee/indabaxkenya)

---

## 4. Setting Venue/Location Information

### Where Venue Information Appears
- Event detail pages
- Event cards on listing page
- Meta description (for featured event)
- Footer (if configured)

### How to Set Event Venue

1. Go to **Admin Panel** → **Events** (`/admin/events`)
2. Edit the relevant event
3. Fill in:
   - **Location**: City/Region (e.g., "Nairobi, Kenya")
   - **Venue**: Specific venue name (e.g., "KICC - Kenyatta International Convention Centre")
4. Click **Save**

### Setting Contact Address (Footer)

1. Go to **Admin Panel** → **Settings** (`/admin/settings`)
2. Click the **Contact & Social** tab
3. Enter the **Contact Address** field:
   ```
   KICC, Nairobi
   P.O. Box 12345
   Nairobi, Kenya
   ```
4. Click **Save All Settings**

This address will appear in the website footer.

---

## Quick Reference

| What to Change | Where to Go | Field Name |
|----------------|-------------|------------|
| Event dates | Admin → Events → Edit Event | Start Date, End Date |
| Featured event | Admin → Events → Edit Event | Is Featured toggle |
| Registration deadline | Admin → Settings → Event & Banner | Registration Deadline |
| Social links | Admin → Settings → Contact & Social | Twitter, LinkedIn, etc. |
| Venue for event | Admin → Events → Edit Event | Location, Venue |
| Footer address | Admin → Settings → Contact & Social | Contact Address |
| Current year | Admin → Settings → Event & Banner | Current Event Year |

---

## Troubleshooting

### Social links not showing in footer
1. Check that links are entered with full URLs (starting with `https://`)
2. Ensure the settings were saved
3. Hard refresh the page (Ctrl+Shift+R)

### Event dates not updating
1. Make sure the event has "Is Featured" enabled
2. Check that event status is "Upcoming"
3. Clear browser cache and refresh

### Old dates still appearing
1. Check for multiple events - ensure only ONE is featured
2. The website caches data - wait up to 60 seconds or hard refresh
3. Check all tabs in Admin Settings for hardcoded values

---

## Need More Help?

- Check the [Admin Guide](/docs/ADMIN_GUIDE.md) for complete admin panel documentation
- Contact the development team for technical issues
