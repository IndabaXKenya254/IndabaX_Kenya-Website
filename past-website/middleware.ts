// ═══════════════════════════════════════════════════════════════════════
// Edge Middleware - Response Optimization
// ═══════════════════════════════════════════════════════════════════════
// Runs on Vercel Edge Network for ultra-fast response times

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add aggressive caching for static assets
  if (request.nextUrl.pathname.startsWith('/images/') ||
      request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
  }

  // Add caching for API routes
  if (request.nextUrl.pathname.startsWith('/api/noai/')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    response.headers.set(
      'CDN-Cache-Control',
      'public, s-maxage=600'
    )
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const config = {
  matcher: [
    '/api/noai/:path*',
    '/images/:path*',
    '/_next/static/:path*',
  ],
}
