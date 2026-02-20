/**
 * ═══════════════════════════════════════════════════════════════════════
 * INDABAX KENYA - MOCK DATA MIGRATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This script imports mock data from lib/mock-data/*.json files into the
 * Supabase database using the newly created API layer.
 *
 * Usage:
 *   npx tsx scripts/migrate-mock-data.ts
 *
 * Prerequisites:
 *   - All database migrations (Phases 1-3) must be executed
 *   - Admin user must exist in the database
 *   - Environment variables must be set (.env.local)
 *
 * What it does:
 *   1. Creates all tags and expertise areas
 *   2. Imports speakers with expertise relationships
 *   3. Imports events with tag and speaker relationships
 *   4. Imports posts with tag relationships
 *   5. Imports other content (photos, FAQ, sponsors, etc.)
 *
 * Created: Phase 7 - Data Migration
 * ═══════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: path.join(__dirname, '../.env.local') })

// ============================================================================
// CONFIGURATION
// ============================================================================

const MOCK_DATA_DIR = path.join(__dirname, '../lib/mock-data')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface MigrationStats {
  eventTags: number
  postTags: number
  expertise: number
  speakers: number
  events: number
  posts: number
  photos: number
  faqs: number
  sponsors: number
  schedules: number
  errors: string[]
}

const stats: MigrationStats = {
  eventTags: 0,
  postTags: 0,
  expertise: 0,
  speakers: 0,
  events: 0,
  posts: 0,
  photos: 0,
  faqs: 0,
  sponsors: 0,
  schedules: 0,
  errors: [],
}

/**
 * Read and parse JSON file
 */
function readMockData<T>(filename: string): T[] {
  const filePath = path.join(MOCK_DATA_DIR, filename)
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Generate slug from name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Create or get tag ID by name
 */
async function getOrCreateTag(name: string, type: 'event' | 'post'): Promise<string> {
  const table = type === 'event' ? 'event_tags' : 'post_tags'
  const slug = slugify(name)

  // Check if tag exists
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return existing.id
  }

  // Create new tag
  const { data, error } = await supabase
    .from(table)
    .insert({ name, slug })
    .select('id')
    .single()

  if (error) {
    console.error(`  ❌ Failed to create ${type} tag "${name}":`, error.message)
    stats.errors.push(`Failed to create ${type} tag "${name}": ${error.message}`)
    throw error
  }

  if (type === 'event') stats.eventTags++
  else stats.postTags++

  return data.id
}

/**
 * Create or get expertise ID by name
 */
async function getOrCreateExpertise(name: string): Promise<string> {
  const slug = slugify(name)

  // Check if expertise exists
  const { data: existing } = await supabase
    .from('speaker_expertise')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return existing.id
  }

  // Create new expertise
  const { data, error } = await supabase
    .from('speaker_expertise')
    .insert({ name, slug })
    .select('id')
    .single()

  if (error) {
    console.error(`  ❌ Failed to create expertise "${name}":`, error.message)
    stats.errors.push(`Failed to create expertise "${name}": ${error.message}`)
    throw error
  }

  stats.expertise++
  return data.id
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrate speakers
 */
async function migrateSpeakers() {
  console.log('\n📢 Migrating speakers...')
  const speakers = readMockData<any>('speakers.json')

  for (const speaker of speakers) {
    try {
      // Map field names
      const speakerData: any = {
        name: speaker.name,
        title: speaker.title || null,
        organization: speaker.organization || null,
        country: speaker.country || null,
        photo_url: speaker.photo || null,
        bio_short: speaker.bioShort || null,
        bio_full: speaker.bioFull || null,
        linkedin_url: speaker.linkedinUrl || null,
        twitter_url: speaker.twitterUrl || null,
        website_url: speaker.websiteUrl || null,
        is_featured: speaker.featured || false,
        display_order: speaker.displayOrder || 0,
      }

      // Insert speaker
      const { data: insertedSpeaker, error: speakerError } = await supabase
        .from('speakers')
        .insert(speakerData)
        .select('id')
        .single()

      if (speakerError) {
        console.error(`  ❌ Failed to insert speaker "${speaker.name}":`, speakerError.message)
        stats.errors.push(`Failed to insert speaker "${speaker.name}": ${speakerError.message}`)
        continue
      }

      // Create expertise relationships
      if (speaker.expertise && Array.isArray(speaker.expertise)) {
        for (const expertiseName of speaker.expertise) {
          try {
            const expertiseId = await getOrCreateExpertise(expertiseName)

            await supabase
              .from('speaker_expertise_relations')
              .insert({
                speaker_id: insertedSpeaker.id,
                expertise_id: expertiseId,
              })
          } catch (err) {
            console.error(`  ⚠️  Failed to link expertise "${expertiseName}" to speaker "${speaker.name}"`)
          }
        }
      }

      stats.speakers++
      console.log(`  ✓ Imported: ${speaker.name}`)
    } catch (err: any) {
      console.error(`  ❌ Error migrating speaker "${speaker.name}":`, err.message)
      stats.errors.push(`Error migrating speaker "${speaker.name}": ${err.message}`)
    }
  }

  console.log(`✅ Speakers migrated: ${stats.speakers}/${speakers.length}`)
}

/**
 * Migrate events
 */
async function migrateEvents() {
  console.log('\n🎉 Migrating events...')
  const events = readMockData<any>('events.json')

  for (const event of events) {
    try {
      // Map field names
      const eventData: any = {
        slug: event.slug,
        title: event.title,
        description: event.description || null,
        excerpt: event.excerpt || null,
        start_date: event.date || null,
        end_date: event.endDate || null,
        location: event.location || null,
        venue: event.venue || null,
        featured_image: event.image || null,
        status: 'published', // All mock events are published
        event_type: event.type || 'upcoming',
        is_featured: event.featured || false,
      }

      // Insert event
      const { data: insertedEvent, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single()

      if (eventError) {
        console.error(`  ❌ Failed to insert event "${event.title}":`, eventError.message)
        stats.errors.push(`Failed to insert event "${event.title}": ${eventError.message}`)
        continue
      }

      // Create tag relationships
      if (event.tags && Array.isArray(event.tags)) {
        for (const tagName of event.tags) {
          try {
            const tagId = await getOrCreateTag(tagName, 'event')

            await supabase
              .from('event_tag_relations')
              .insert({
                event_id: insertedEvent.id,
                tag_id: tagId,
              })
          } catch (err) {
            console.error(`  ⚠️  Failed to link tag "${tagName}" to event "${event.title}"`)
          }
        }
      }

      // Create speaker relationships
      if (event.speakerIds && Array.isArray(event.speakerIds)) {
        // Get speaker IDs by looking up speakers from our already-migrated speakers
        const { data: speakers } = await supabase
          .from('speakers')
          .select('id, name')

        if (speakers) {
          for (let i = 0; i < event.speakerIds.length; i++) {
            const mockSpeakerId = event.speakerIds[i]
            // Try to match by index or name - this is approximate
            const speaker = speakers[parseInt(mockSpeakerId) - 1] || speakers[i]

            if (speaker) {
              await supabase
                .from('event_speakers')
                .insert({
                  event_id: insertedEvent.id,
                  speaker_id: speaker.id,
                  display_order: i,
                })
            }
          }
        }
      }

      stats.events++
      console.log(`  ✓ Imported: ${event.title}`)
    } catch (err: any) {
      console.error(`  ❌ Error migrating event "${event.title}":`, err.message)
      stats.errors.push(`Error migrating event "${event.title}": ${err.message}`)
    }
  }

  console.log(`✅ Events migrated: ${stats.events}/${events.length}`)
}

/**
 * Migrate posts
 */
async function migratePosts() {
  console.log('\n📝 Migrating posts...')
  const posts = readMockData<any>('posts.json')

  // Get first admin user for author_id
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .maybeSingle()

  if (!adminUser) {
    console.error('❌ No admin user found! Please create an admin user first.')
    return
  }

  for (const post of posts) {
    try {
      // Map field names
      const postData: any = {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || null,
        content: post.content || null,
        featured_image: post.image || null,
        category: post.category?.toLowerCase() || null,
        status: 'published',
        published_at: post.publishedAt || new Date().toISOString(),
        is_featured: post.featured || false,
        author_name: post.author || null,
        author_image: post.authorImage || null,
        author_id: adminUser.id,
      }

      // Insert post
      const { data: insertedPost, error: postError } = await supabase
        .from('posts')
        .insert(postData)
        .select('id')
        .single()

      if (postError) {
        console.error(`  ❌ Failed to insert post "${post.title}":`, postError.message)
        stats.errors.push(`Failed to insert post "${post.title}": ${postError.message}`)
        continue
      }

      // Create tag relationships
      if (post.tags && Array.isArray(post.tags)) {
        for (const tagName of post.tags) {
          try {
            const tagId = await getOrCreateTag(tagName, 'post')

            await supabase
              .from('post_tag_relations')
              .insert({
                post_id: insertedPost.id,
                tag_id: tagId,
              })
          } catch (err) {
            console.error(`  ⚠️  Failed to link tag "${tagName}" to post "${post.title}"`)
          }
        }
      }

      stats.posts++
      console.log(`  ✓ Imported: ${post.title}`)
    } catch (err: any) {
      console.error(`  ❌ Error migrating post "${post.title}":`, err.message)
      stats.errors.push(`Error migrating post "${post.title}": ${err.message}`)
    }
  }

  console.log(`✅ Posts migrated: ${stats.posts}/${posts.length}`)
}

/**
 * Migrate photos/gallery
 */
async function migratePhotos() {
  console.log('\n📷 Migrating photos...')
  const photos = readMockData<any>('gallery.json')

  for (const photo of photos) {
    try {
      const photoData: any = {
        image_url: photo.url || photo.image_url,
        thumbnail_url: photo.thumbnail_url || null,
        caption: photo.caption || photo.title || null,
        description: photo.description || null,
        year: photo.year?.toString() || null,
        category: photo.category || null,
        photo_date: photo.photo_date || null,
        event_id: null, // TODO: Link to events if needed
        event_name: photo.event_name || null,
        photographer: photo.photographer || null,
        is_featured: photo.featured || false,
        display_order: photo.display_order || 0,
      }

      const { error } = await supabase
        .from('photos')
        .insert(photoData)

      if (error) {
        console.error(`  ❌ Failed to insert photo:`, error.message)
        stats.errors.push(`Failed to insert photo: ${error.message}`)
        continue
      }

      stats.photos++
    } catch (err: any) {
      console.error(`  ❌ Error migrating photo:`, err.message)
      stats.errors.push(`Error migrating photo: ${err.message}`)
    }
  }

  console.log(`✅ Photos migrated: ${stats.photos}/${photos.length}`)
}

/**
 * Migrate FAQs
 */
async function migrateFAQs() {
  console.log('\n❓ Migrating FAQs...')
  const faqs = readMockData<any>('faq.json')

  for (const faq of faqs) {
    try {
      const faqData: any = {
        question: faq.question,
        answer: faq.answer,
        category: faq.category?.toLowerCase() || 'general',
        display_order: faq.display_order || 0,
        is_active: true,
      }

      const { error } = await supabase
        .from('faqs')
        .insert(faqData)

      if (error) {
        console.error(`  ❌ Failed to insert FAQ:`, error.message)
        stats.errors.push(`Failed to insert FAQ: ${error.message}`)
        continue
      }

      stats.faqs++
    } catch (err: any) {
      console.error(`  ❌ Error migrating FAQ:`, err.message)
      stats.errors.push(`Error migrating FAQ: ${err.message}`)
    }
  }

  console.log(`✅ FAQs migrated: ${stats.faqs}/${faqs.length}`)
}

/**
 * Migrate sponsors
 */
async function migrateSponsors() {
  console.log('\n🤝 Migrating sponsors...')
  const sponsors = readMockData<any>('partners.json')

  for (const sponsor of sponsors) {
    try {
      const sponsorData: any = {
        name: sponsor.name,
        logo_url: sponsor.logo || sponsor.logo_url,
        website_url: sponsor.website || sponsor.website_url || null,
        tier: sponsor.tier?.toLowerCase() || 'bronze',
        description: sponsor.description || null,
        display_order: sponsor.display_order || 0,
        is_active: true,
      }

      const { error } = await supabase
        .from('sponsors')
        .insert(sponsorData)

      if (error) {
        console.error(`  ❌ Failed to insert sponsor "${sponsor.name}":`, error.message)
        stats.errors.push(`Failed to insert sponsor "${sponsor.name}": ${error.message}`)
        continue
      }

      stats.sponsors++
      console.log(`  ✓ Imported: ${sponsor.name}`)
    } catch (err: any) {
      console.error(`  ❌ Error migrating sponsor "${sponsor.name}":`, err.message)
      stats.errors.push(`Error migrating sponsor "${sponsor.name}": ${err.message}`)
    }
  }

  console.log(`✅ Sponsors migrated: ${stats.sponsors}/${sponsors.length}`)
}

/**
 * Migrate schedule items
 */
async function migrateSchedule() {
  console.log('\n📅 Migrating schedule items...')
  const scheduleData = readMockData<any>('schedule.json')

  let scheduleCount = 0

  for (let dayIndex = 0; dayIndex < scheduleData.length; dayIndex++) {
    const day = scheduleData[dayIndex]
    const dayDate = day.date || null
    const dayName = day.day || null

    // Extract day_number from "Day 1" → 1
    const dayNumber = dayIndex + 1

    if (!day.sessions || !Array.isArray(day.sessions)) continue

    for (const session of day.sessions) {
      try {
        // Parse time range "08:00 - 09:00" into start_time and end_time
        let startTime = null
        let endTime = null
        if (session.time && session.time.includes('-')) {
          const [start, end] = session.time.split('-').map((t: string) => t.trim())
          startTime = start
          endTime = end
        }

        // Use session type directly (database now supports all types)
        const sessionType = session.type?.toLowerCase() || 'talk'

        const scheduleItem: any = {
          day_number: dayNumber,
          title: session.title,
          description: session.description || null,
          start_time: startTime,
          end_time: endTime,
          location: session.location || null,
          session_type: sessionType,
          day_name: dayName,
          schedule_date: dayDate,
        }

        // Try to link speaker if speakerId exists
        if (session.speakerId) {
          const { data: speakers } = await supabase
            .from('speakers')
            .select('id')
            .limit(100)

          if (speakers && speakers[parseInt(session.speakerId) - 1]) {
            scheduleItem.speaker_ids = [speakers[parseInt(session.speakerId) - 1].id]
          }
        }

        const { error } = await supabase
          .from('schedule_items')
          .insert(scheduleItem)

        if (error) {
          console.error(`  ❌ Failed to insert schedule item "${session.title}":`, error.message)
          stats.errors.push(`Failed to insert schedule item "${session.title}": ${error.message}`)
          continue
        }

        scheduleCount++
        stats.schedules++
      } catch (err: any) {
        console.error(`  ❌ Error migrating schedule item "${session.title}":`, err.message)
        stats.errors.push(`Error migrating schedule item "${session.title}": ${err.message}`)
      }
    }
  }

  console.log(`✅ Schedule items migrated: ${scheduleCount}`)
}

// ============================================================================
// MAIN MIGRATION
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  INDABAX KENYA - MOCK DATA MIGRATION')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log(`\n📂 Mock data directory: ${MOCK_DATA_DIR}`)
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`)
  console.log(`\n⏳ Starting migration...\n`)

  const startTime = Date.now()

  try {
    // Migrate in order (speakers first, then events that reference speakers, then schedule)
    await migrateSpeakers()
    await migrateEvents()
    await migratePosts()
    await migratePhotos()
    await migrateFAQs()
    await migrateSponsors()
    await migrateSchedule()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n═══════════════════════════════════════════════════════════════════════')
    console.log('  MIGRATION COMPLETE')
    console.log('═══════════════════════════════════════════════════════════════════════')
    console.log(`\n📊 Summary:`)
    console.log(`   Event Tags Created: ${stats.eventTags}`)
    console.log(`   Post Tags Created: ${stats.postTags}`)
    console.log(`   Expertise Areas Created: ${stats.expertise}`)
    console.log(`   Speakers: ${stats.speakers}`)
    console.log(`   Events: ${stats.events}`)
    console.log(`   Posts: ${stats.posts}`)
    console.log(`   Photos: ${stats.photos}`)
    console.log(`   FAQs: ${stats.faqs}`)
    console.log(`   Sponsors: ${stats.sponsors}`)
    console.log(`   Schedule Items: ${stats.schedules}`)
    console.log(`\n⏱️  Duration: ${duration}s`)

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`)
      stats.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`)
      })
    } else {
      console.log(`\n✅ No errors!`)
    }

    console.log('\n═══════════════════════════════════════════════════════════════════════\n')
  } catch (error: any) {
    console.error('\n❌ Fatal error during migration:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run migration
main()
