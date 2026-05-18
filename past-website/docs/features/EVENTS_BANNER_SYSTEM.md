# Events Banner - User Guide

A simple guide for managing the Events page banner on the IndabaX Kenya website.

---

## What is the Events Banner?

The Events page (`/events`) has a hero banner at the top that can display in two ways:

### When there's NO upcoming event:

![Simple Banner]

```
         Events & Conferences

   Explore our past and upcoming AI
   conferences, workshops, and community events

      [Get Notified]  [View Past Events]
```

### When there IS an upcoming event:

![Countdown Banner]

```
   [Upcoming Event]

   IndabaX Kenya 2025                    ┌─────────────┐
   AI in Politics and Democracy          │  12:05:30   │
                                         │  D  H  M    │
   📅 May 15 - May 17, 2025              │  COUNTDOWN  │
   📍 Nairobi, Kenya                     └─────────────┘

      [Register Now]  [View All Events]
```

---

## How to Set Up an Upcoming Event Banner

You have **two options** to make the countdown banner appear:

### Option 1: Create an Event (Recommended)

This is the easiest way. The banner automatically pulls data from your events.

**Steps:**

1. Log in to the Admin Panel
2. Go to **Events** in the sidebar
3. Click **"+ New Event"**
4. Fill in the event details:
   - **Title**: e.g., "IndabaX Kenya 2025"
   - **Theme**: e.g., "AI in Politics and Democracy" (shows as subtitle)
   - **Start Date**: Must be a future date
   - **End Date**: Optional
   - **Location**: e.g., "Nairobi, Kenya"
   - **Status**: Select **"Upcoming"** (important!)
   - **Registration Enabled**: Toggle on if you want "Register Now" button
5. Click **Save**

The banner will automatically update within 5 minutes.

---

### Option 2: Use Banner Settings (For Custom Banners)

Use this if you want more control over what the banner shows.

**Steps:**

1. Log in to the Admin Panel
2. Go to **Settings** in the sidebar
3. Find the **"Banner Settings"** section
4. Configure:

| Field | What it does | Example |
|-------|--------------|---------|
| Event Title | Main heading | IndabaX Kenya 2025 |
| Event Subtitle | Text below title | AI in Politics and Democracy |
| Event Date | Start date (for countdown) | 2025-05-15 |
| Event End Date | End date (optional) | 2025-05-17 |
| Location | Where the event is | Nairobi, Kenya |
| Registration URL | Where "Register Now" links to | /register |
| Show Countdown | Toggle countdown on/off | On |

5. Click **Save Settings**

---

## Which Option Should I Use?

| Scenario | Use This Option |
|----------|-----------------|
| You have a real event and want everything synced | **Option 1: Create Event** |
| You want a custom banner with different text | **Option 2: Banner Settings** |
| You want to promote something that's not an event | **Option 2: Banner Settings** |

**Note:** If both are configured, Banner Settings takes priority.

---

## How to Remove the Countdown Banner

To go back to the simple "Events & Conferences" banner:

### If using Option 1 (Events):
- Edit the event and change **Status** from "Upcoming" to "Past" or "Archived"
- Or delete the event
- Or wait until the event date passes

### If using Option 2 (Banner Settings):
- Go to Settings → Banner Settings
- Clear all the fields or set a past date
- Save

---

## Frequently Asked Questions

### Q: How long until changes appear?

**A:** Up to 5 minutes. The page caches for performance.

### Q: The countdown shows wrong numbers?

**A:** Make sure the Event Date is in the correct format (YYYY-MM-DD). Check your timezone settings.

### Q: Can I have multiple upcoming events?

**A:** The banner only shows ONE event - the one with the earliest start date. Other upcoming events will appear in the events grid below.

### Q: The "Register Now" button goes to the wrong page?

**A:**
- For Option 1: Check if Registration is enabled on the event. If disabled, button links to event details instead.
- For Option 2: Update the Registration URL in Banner Settings.

### Q: Can I hide the countdown but keep the banner?

**A:** Yes! In Banner Settings, toggle "Show Countdown" to Off.

---

## Quick Reference

| I want to... | Do this... |
|--------------|------------|
| Show countdown banner | Create event with Status="Upcoming" and future date |
| Hide countdown banner | Change event Status to "Past" or clear Banner Settings |
| Change banner text | Edit event details OR use Banner Settings |
| Link to external registration | Use Banner Settings with custom Registration URL |
| Show simple banner | Make sure no upcoming events exist and Banner Settings is empty |

---

## Need Help?

Contact the website administrator or check the technical documentation for advanced configuration.
