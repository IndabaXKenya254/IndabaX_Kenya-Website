// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - MIDDLEWARE (OPTIMIZED)
// ═══════════════════════════════════════════════════════════════════════
// Handles Supabase authentication session refreshing and route protection
// OPTIMIZED: Reduced database calls to prevent Vercel timeout

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create response early
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Skip middleware for public routes to avoid unnecessary DB calls
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password',
    '/verify-email', '/about', '/contact', '/events', '/news', '/speakers', '/sponsors',
    '/gallery', '/schedule', '/team', '/venue', '/faq', '/noai', '/privacy-policy',
    '/terms-conditions', '/submit', '/maintenance']

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
  const isApiRoute = pathname.startsWith('/api/')
  const isSurveyRoute = pathname.startsWith('/survey/')

  // For public routes, API routes, and survey routes - just pass through with minimal overhead
  if (isPublicRoute || isApiRoute || isSurveyRoute) {
    return response
  }

  // Protected routes configuration
  const protectedRoutes: Record<string, string[]> = {
    '/dashboard': ['applicant', 'speaker', 'reviewer', 'admin'],
    '/admin': ['admin'],
    '/reviewer': ['reviewer', 'admin'],
  }

  // Check if current path matches any protected route
  const matchedRoute = Object.keys(protectedRoutes).find(route =>
    pathname.startsWith(route)
  )

  // Only create Supabase client and make DB calls for protected routes
  if (matchedRoute) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              response.cookies.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              response.cookies.set({ name, value: '', ...options })
            },
          },
        }
      )

      // Single auth call
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      // Handle auth errors - clear cookies and redirect to login
      if (authError?.code === 'refresh_token_not_found' || authError?.code === 'bad_jwt') {
        request.cookies.getAll().forEach(cookie => {
          if (cookie.name.includes('sb-')) {
            response.cookies.set({ name: cookie.name, value: '', maxAge: 0, path: '/' })
          }
        })
      }

      // No user - redirect to login
      if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Single combined query for profile and reviewer status
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      let finalRole = profileData?.role || 'applicant'

      // Only check reviewer status if needed (user is applicant trying to access reviewer routes)
      if (finalRole === 'applicant' && matchedRoute === '/reviewer') {
        const { data: reviewerData } = await supabase
          .from('reviewers')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (reviewerData) {
          finalRole = 'reviewer'
        }
      }

      const allowedRoles = protectedRoutes[matchedRoute]

      if (!allowedRoles.includes(finalRole)) {
        // Redirect to appropriate dashboard
        const redirectMap: Record<string, string> = {
          'applicant': '/dashboard',
          'speaker': '/dashboard',
          'reviewer': '/reviewer/dashboard',
          'admin': '/admin/dashboard'
        }
        const userDashboard = redirectMap[finalRole] || '/dashboard'

        if (pathname !== userDashboard && !pathname.startsWith(userDashboard + '/')) {
          return NextResponse.redirect(new URL(userDashboard, request.url))
        }
      }
    } catch (error) {
      console.error('[Middleware] Error:', error)
      // On error, allow request to continue - let page handle auth
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp)
     *
     * NOTE: API routes ARE included to ensure session tokens are refreshed
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
