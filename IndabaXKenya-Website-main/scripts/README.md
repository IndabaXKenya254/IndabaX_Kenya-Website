# Data Migration Scripts

This directory contains scripts for migrating mock data into the Supabase database.

## migrate-mock-data.ts

Imports all mock data from `lib/mock-data/*.json` files into the database.

### Prerequisites

1. **Database Migrations:** All Phases 1-3 migrations must be executed:
   ```bash
   # Execute these migrations in Supabase Dashboard or via CLI
   supabase/migrations/20251023_phase1_add_missing_columns.sql
   supabase/migrations/20251023_phase2_tag_system.sql
   supabase/migrations/20251023_phase3_relationships.sql
   ```

2. **Admin User:** At least one admin user must exist in the database:
   ```sql
   -- Create an admin user (run in Supabase SQL Editor)
   UPDATE profiles
   SET is_admin = true
   WHERE email = 'your-email@example.com';
   ```

3. **Environment Variables:** Set in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Usage

```bash
# Install dependencies (if not already installed)
npm install

# Run migration
npm run migrate:mock-data

# Or run directly with tsx
npx tsx scripts/migrate-mock-data.ts
```

### What It Does

The migration script:

1. **Creates Tags & Expertise:**
   - Extracts unique tags from events and posts
   - Extracts unique expertise areas from speakers
   - Creates entries in `event_tags`, `post_tags`, and `speaker_expertise` tables

2. **Imports Speakers:**
   - Maps field names (camelCase → snake_case)
   - Creates speaker records
   - Links speakers to expertise areas

3. **Imports Events:**
   - Maps field names
   - Creates event records
   - Links events to tags
   - Links events to speakers (with display order)

4. **Imports Posts:**
   - Maps field names
   - Creates post records
   - Links posts to tags

5. **Imports Other Content:**
   - Photos/Gallery
   - FAQs
   - Sponsors

### Field Mapping

The script automatically maps mock data field names to database column names:

**Events:**
- `date` → `start_date`
- `endDate` → `end_date`
- `image` → `featured_image`
- `type` → `event_type`
- `featured` → `is_featured`
- `speakerIds` → speaker relationships
- `tags` → tag relationships

**Speakers:**
- `photo` → `photo_url`
- `bioShort` → `bio_short`
- `bioFull` → `bio_full`
- `linkedinUrl` → `linkedin_url`
- `twitterUrl` → `twitter_url`
- `websiteUrl` → `website_url`
- `featured` → `is_featured`
- `expertise` → expertise relationships

**Posts:**
- `image` → `featured_image`
- `author` → `author_name`
- `authorImage` → `author_image`
- `publishedAt` → `published_at`
- `featured` → `is_featured`
- `tags` → tag relationships

### Output

The script provides detailed progress logging:

```
═══════════════════════════════════════════════════════════════════════
  INDABAX KENYA - MOCK DATA MIGRATION
═══════════════════════════════════════════════════════════════════════

📂 Mock data directory: /path/to/lib/mock-data
🔗 Supabase URL: https://your-project.supabase.co

⏳ Starting migration...

📢 Migrating speakers...
  ✓ Imported: Dr. Amina Wanjiru
  ✓ Imported: Prof. David Odhiambo
  ...
✅ Speakers migrated: 20/20

🎉 Migrating events...
  ✓ Imported: IndabaX Kenya 2026
  ✓ Imported: NOAI Pre-Conference Workshop
  ...
✅ Events migrated: 6/6

📝 Migrating posts...
  ✓ Imported: Registration Now Open!
  ...
✅ Posts migrated: 10/10

═══════════════════════════════════════════════════════════════════════
  MIGRATION COMPLETE
═══════════════════════════════════════════════════════════════════════

📊 Summary:
   Event Tags Created: 27
   Post Tags Created: 17
   Expertise Areas Created: 60
   Speakers: 20
   Events: 6
   Posts: 10
   Photos: 30
   FAQs: 15
   Sponsors: 8

⏱️  Duration: 12.34s

✅ No errors!
```

### Error Handling

- Non-critical errors (e.g., tag creation failures) are logged but don't stop the migration
- Critical errors (e.g., database connection) will stop the migration
- All errors are collected and displayed at the end

### Idempotency

The script is **partially idempotent**:
- Tags and expertise areas won't be duplicated (checked by slug)
- Main records (events, posts, speakers) will be inserted again if run multiple times
- To prevent duplicates, clear tables before re-running:

```sql
-- Clear all data (CAUTION: This deletes everything!)
DELETE FROM event_speakers;
DELETE FROM event_tag_relations;
DELETE FROM post_tag_relations;
DELETE FROM speaker_expertise_relations;
DELETE FROM events;
DELETE FROM posts;
DELETE FROM speakers;
DELETE FROM photos;
DELETE FROM faqs;
DELETE FROM sponsors;
-- event_tags, post_tags, and speaker_expertise can be kept
```

### Troubleshooting

**Error: "No admin user found"**
```sql
-- Create admin user
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

**Error: "Missing environment variables"**
- Check `.env.local` exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Use service role key, not anon key

**Error: "Failed to insert..."**
- Check database migrations are executed
- Verify RLS policies allow service role access
- Check for constraint violations (e.g., duplicate slugs)

### Safety

The script uses the **service role key** which bypasses Row Level Security (RLS). This is necessary for bulk imports. Never expose this key in client-side code.

---

## Future Enhancements

- [ ] Add dry-run mode (preview without inserting)
- [ ] Add rollback capability
- [ ] Support incremental updates (update existing records)
- [ ] Add data validation before insertion
- [ ] Export database data back to JSON format
