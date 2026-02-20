// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SUPABASE CLIENT (Browser)
// ═══════════════════════════════════════════════════════════════════════
// Use this client in Client Components (components with "use client")

import { createBrowserClient } from '@supabase/ssr'

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

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    })
    throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
