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

// Custom fetch with timeout and retry logic
async function fetchWithTimeout(
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeout = 10000,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      const isLastRetry = i === retries - 1
      const isTimeout = error.name === 'AbortError' || error.code === 'ETIMEDOUT'

      if (isLastRetry || !isTimeout) {
        throw error
      }

      // Exponential backoff: wait 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Failed after retries')
}

// Custom fetch with NO CACHING - always fetches fresh data
async function fetchWithoutCache(
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeout = 10000,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...options,
        cache: 'no-store', // Disable all caching (Next.js and HTTP)
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      const isLastRetry = i === retries - 1
      const isTimeout = error.name === 'AbortError' || error.code === 'ETIMEDOUT'

      if (isLastRetry || !isTimeout) {
        throw error
      }

      // Exponential backoff: wait 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Failed after retries')
}

// Issue #5 FIX: Singleton public clients to reduce connection pool usage under load
let _publicClient: ReturnType<typeof createClient> | null = null
let _noCacheClient: ReturnType<typeof createClient> | null = null

/**
 * Creates a public Supabase client for Server Components
 *
 * This client:
 * - Does NOT use cookies (enables static generation and ISR)
 * - Should ONLY be used for public data (events, speakers, posts, etc.)
 * - Allows pages to be cached and served from CDN
 * - Improves performance by enabling ISR (Incremental Static Regeneration)
 * - Uses singleton pattern to reduce connection pool usage under load
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
  if (_publicClient) return _publicClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  _publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return _publicClient
}

/**
 * Creates a NO-CACHE public Supabase client for Server Components
 *
 * This client:
 * - Does NOT use cookies (like createPublicClient)
 * - Does NOT cache ANY requests (always fetches fresh data)
 * - Should be used for pages that need real-time data
 * - Disables Next.js caching with cache: 'no-store'
 * - Uses singleton pattern to reduce connection pool usage under load
 *
 * When to use:
 * - NOAI timeline, participants, archives pages
 * - Any page that must always show fresh data
 * - Admin-editable content that updates frequently
 * - Upcoming events on home page (Issue #4 FIX)
 *
 * When NOT to use:
 * - Pages that can benefit from caching (use createPublicClient instead)
 * - Admin panel pages (use createServerClient)
 * - Authenticated pages (use createServerClient)
 */
export function createNoCachePublicClient() {
  if (_noCacheClient) return _noCacheClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  _noCacheClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: fetchWithoutCache, // Use no-cache fetch
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return _noCacheClient
}
