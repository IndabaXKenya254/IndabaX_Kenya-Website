# IndabaX Kenya - Admin Quick Reference Card

**Login**: https://yoursite.com/admin/login
**Credentials**: `admin@indabaxkenya.org` / `IndabaX2026!Admin#Secure`

---

## 🚀 Quick Actions

| Task | URL | Key Steps |
|------|-----|-----------|
| Create Event | `/admin/events` | Add Event → Fill details → Select tags → Publish |
| Add Schedule | `/admin/schedule` | Add Item → Select event → Set day/time → Assign speakers |
| Upload Photos | `/admin/gallery` | Upload → Add captions → Select year/event → Submit |
| Review Applications | `/admin/applications` | Open application → Read details → Accept/Reject |
| Create Post | `/admin/posts` | New Post → Write content → Add image → Publish |
| Add Speaker | `/admin/speakers` | Add Speaker → Upload photo → Fill bio → Add expertise |

---

## 📋 Pre-Event Checklist

**6-8 Weeks Before**:
- [ ] Create event page (`/admin/events`)
- [ ] Add call for papers post (`/admin/posts`)
- [ ] Update FAQs (`/admin/faqs`)
- [ ] Add confirmed speakers (`/admin/speakers`)

**4-6 Weeks Before**:
- [ ] Build full schedule (`/admin/schedule`)
- [ ] Add all session details with speakers
- [ ] Upload venue photos (`/admin/gallery`)
- [ ] Add sponsor logos (`/admin/sponsors`)

**2 Weeks Before**:
- [ ] Finalize schedule (no more changes)
- [ ] Send schedule update post
- [ ] Review pending applications
- [ ] Test registration form

**During Event**:
- [ ] Post daily updates
- [ ] Upload photos each day
- [ ] Monitor questions/contact form

**After Event**:
- [ ] Upload full gallery (within 3 days)
- [ ] Change event status to "Past"
- [ ] Publish recap post
- [ ] Update statistics

---

## 🔧 Common Tasks

### Adding a Complete Event Schedule

**Example: 3-Day Conference**

1. **Create Event First**:
   ```
   Title: IndabaX Kenya 2026
   Dates: March 15-17, 2026
   Location: Nairobi, Kenya
   Status: Published
   ```

2. **Add Day 1 Sessions**:
   ```
   Event: IndabaX Kenya 2026
   Day Number: 1
   Day Name: "Day 1"
   Schedule Date: "March 15, 2026"

   Sessions:
   08:00-09:00 | Registration | Type: registration
   09:00-10:00 | Opening Keynote | Type: keynote | Speaker: [Select]
   10:15-11:45 | Workshop: PyTorch | Type: workshop | Speaker: [Select]
   12:00-13:00 | Lunch Break | Type: break
   ```

3. **Repeat for Days 2 & 3** with day_number: 2, 3

---

### Bulk Photo Upload Workflow

1. **Organize Files First**:
   - Name files descriptively: `day1_keynote_speaker.jpg`
   - Keep originals separate
   - Resize to < 2MB each

2. **Upload**:
   - Select all Day 1 photos → Upload
   - While uploading, prepare captions
   - Set Year: 2026, Event: IndabaX Kenya 2026
   - Mark 5-10 best as "Featured"

3. **Repeat by Day/Category**

---

### Application Review Workflow

**Efficient Batch Review**:

1. Filter: Status = Pending
2. Sort: By submission date (oldest first)
3. For each application:
   - Read quickly (2-3 min)
   - Add internal note with rating
   - Mark: Accept/Reject/Maybe
4. Second pass on "Maybe" applications
5. Bulk action: Send acceptance emails

---

## 🎨 Session Type Quick Guide

| Type | Color | When to Use |
|------|-------|-------------|
| **keynote** | Red | Main presentations (1-2 per day) |
| **talk** | Blue | Standard presentations (20-30 min) |
| **workshop** | Green | Hands-on sessions (1-2 hours) |
| **panel** | Yellow | Panel discussions |
| **break** | Gray | Coffee/lunch breaks |
| **networking** | Cyan | Networking mixers |
| **registration** | Dark | Check-in periods |
| **track** | Purple | Parallel session tracks |
| **tutorial** | Teal | Tutorial sessions (2-3 hours) |
| **poster** | Indigo | Poster presentations |
| **hackathon** | Orange | Hackathon events |
| **social** | Pink | Social events/receptions |
| **special** | Gold | Special ceremonies |
| **closing** | Maroon | Closing remarks |

---

## 💡 Pro Tips

**Time Management**:
- Use 15 or 30-minute increments
- Leave 15-min buffer between sessions
- Schedule breaks every 2-3 hours

**Content**:
- Write titles in title case
- Use active voice
- Keep descriptions under 200 words
- Always add featured images

**SEO**:
- Use hyphens in slugs (not underscores)
- Include keywords in titles
- Write 150-160 char meta descriptions

**Photos**:
- Upload within 24 hours of event
- Include variety: speakers, audience, venue
- Caption specifically ("Dr. Amina speaking on NLP" not "Speaker")

---

## ⚠️ Important Reminders

**DON'T**:
- ❌ Delete events with schedule items (orphans data)
- ❌ Change event IDs after schedules are added
- ❌ Upload uncompressed RAW images
- ❌ Share admin passwords
- ❌ Leave drafts published accidentally

**DO**:
- ✅ Proofread before publishing
- ✅ Test forms before going live
- ✅ Back up subscriber lists regularly
- ✅ Log out after each session
- ✅ Update FAQs regularly

---

## 🔍 Troubleshooting

**Schedule not grouping by day?**
→ Check that `day_number` is a number (1, 2, 3) not text ("Day 1")

**Event not showing on homepage?**
→ Verify: Status = Published, Event Type = Upcoming, Is Featured = Checked

**Photos not uploading?**
→ Check file size < 5MB, format is JPG/PNG/WEBP

**Changes not visible?**
→ Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## 📞 Quick Contacts

- **System Admin**: admin@indabaxkenya.org
- **Tech Support**: support@indabaxkenya.org
- **Full Guide**: See `USER_GUIDE.md`

---

**Print this page for quick desk reference!**

*Last Updated: October 23, 2025*
