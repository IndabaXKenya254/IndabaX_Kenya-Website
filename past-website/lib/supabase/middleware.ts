// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SUPABASE MIDDLEWARE HELPER
// ═══════════════════════════════════════════════════════════════════════
// Updates and refreshes Supabase authentication sessions
// This ensures authentication context flows correctly to API routes and Server Components

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Middleware] Missing Supabase environment variables')
      // Return response without auth if env vars are missing
      return response
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Set cookie in response only (don't create new response)
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            // Remove from response cookies only
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    if (!supabase || !supabase.auth) {
      console.error('[Middleware] Failed to create Supabase client')
      return response
    }

    // IMPORTANT: Call getUser() to refresh the auth session
    // This establishes the authentication context for the request
    // Even for anonymous users, this is needed for RLS policies to work correctly
    await supabase.auth.getUser()

    return response
  } catch (error) {
    console.error('[Middleware] Error updating session:', error)
    // Return response even if auth fails - don't block the request
    return response
  }
}
