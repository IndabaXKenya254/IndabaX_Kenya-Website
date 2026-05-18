// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SUPABASE CLIENT (Server)
// ═══════════════════════════════════════════════════════════════════════
// Use this client in Server Components and API Routes

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Custom fetch with timeout and retry logic for server-side
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

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithTimeout,
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Issue #2 FIX: Singleton admin client to reduce connection pool usage
// The admin client doesn't use cookies, so it can be safely reused across requests
let _adminClient: any = null

// Admin client with service role key (use with caution - only in API routes)
// This client bypasses RLS and should only be used in secure server-side contexts
export function createAdminClient() {
  if (_adminClient) return _adminClient

  // Import createClient from supabase-js for service role operations
  // This properly bypasses RLS unlike createServerClient
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')

  _adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: fetchWithTimeout,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return _adminClient
}
