// ═══════════════════════════════════════════════════════════════════════
// DYNAMIC SITEMAP GENERATOR
// ═══════════════════════════════════════════════════════════════════════
// Generates sitemap.xml for search engine indexing
// Automatically includes all static pages and dynamic content
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
// ═══════════════════════════════════════════════════════════════════════

import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://deeplearningindabaxkenya.com'

// Create Supabase client for fetching dynamic content
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ═══════════════════════════════════════════════════════════════════
  // STATIC PAGES
  // ═══════════════════════════════════════════════════════════════════
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/speakers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/sponsors`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/schedule`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/venue`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/donate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms-conditions`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    // NOAI Pages
    {
      url: `${SITE_URL}/noai`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/noai/kenya`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/noai/ioai`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/noai/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // ═══════════════════════════════════════════════════════════════════
  // DYNAMIC PAGES - Events
  // ═══════════════════════════════════════════════════════════════════
  let eventPages: MetadataRoute.Sitemap = []
  try {
    const { data: events } = await supabase
      .from('events')
      .select('slug, updated_at')
      .in('status', ['published', 'upcoming', 'past'])
      .order('start_date', { ascending: false })

    if (events) {
      eventPages = events.map((event) => ({
        url: `${SITE_URL}/events/${event.slug}`,
        lastModified: new Date(event.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching events for sitemap:', error)
  }

  // ═══════════════════════════════════════════════════════════════════
  // DYNAMIC PAGES - News/Posts
  // ═══════════════════════════════════════════════════════════════════
  let postPages: MetadataRoute.Sitemap = []
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (posts) {
      postPages = posts.map((post) => ({
        url: `${SITE_URL}/news/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error)
  }

  // ═══════════════════════════════════════════════════════════════════
  // DYNAMIC PAGES - Speakers
  // ═══════════════════════════════════════════════════════════════════
  let speakerPages: MetadataRoute.Sitemap = []
  try {
    const { data: speakers } = await supabase
      .from('speakers')
      .select('id, updated_at')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (speakers) {
      speakerPages = speakers.map((speaker) => ({
        url: `${SITE_URL}/speakers/${speaker.id}`,
        lastModified: new Date(speaker.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))
    }
  } catch (error) {
    console.error('Error fetching speakers for sitemap:', error)
  }

  // ═══════════════════════════════════════════════════════════════════
  // DYNAMIC PAGES - Venues
  // ═══════════════════════════════════════════════════════════════════
  let venuePages: MetadataRoute.Sitemap = []
  try {
    const { data: venues } = await supabase
      .from('venues')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (venues) {
      venuePages = venues.map((venue) => ({
        url: `${SITE_URL}/venue/${venue.slug}`,
        lastModified: new Date(venue.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))
    }
  } catch (error) {
    console.error('Error fetching venues for sitemap:', error)
  }

  // ═══════════════════════════════════════════════════════════════════
  // COMBINE ALL PAGES
  // ═══════════════════════════════════════════════════════════════════
  return [
    ...staticPages,
    ...eventPages,
    ...postPages,
    ...speakerPages,
    ...venuePages,
  ]
}
