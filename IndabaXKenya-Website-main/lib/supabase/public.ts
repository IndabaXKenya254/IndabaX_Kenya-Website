// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PUBLIC SUPABASE CLIENT (Server)
// ═══════════════════════════════════════════════════════════════════════
// Use this client for PUBLIC data in Server Components
// This client does NOT use cookies, allowing pages to be statically generated
//
// ⚠️ IMPORTANT: Only use this for public data (speakers, events, posts, etc.)
// For authenticated operations (admin panel, user data), use createServerClient instead
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

/**
 * Creates a public Supabase client for Server Components
 *
 * This client:
 * - Does NOT use cookies (enables static generation and ISR)
 * - Should ONLY be used for public data (events, speakers, posts, etc.)
 * - Allows pages to be cached and served from CDN
 * - Improves performance by enabling ISR (Incremental Static Regeneration)
 *
 * When to use:
 * - Homepage server components (Speakers, UpcomingEvents, LatestNews, MainBanner)
 * - Public listing pages (Events, Blog, Speakers)
 * - Any page that should be statically generated or use ISR
 *
 * When NOT to use:
 * - Admin panel pages
 * - User-authenticated pages
 * - Pages that need per-user data
 * - API routes that need authentication
 */
export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
