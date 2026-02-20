export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FETCH OPEN GRAPH METADATA API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/admin/fetch-og - Fetch OG metadata from external URL
// Used for Sauti Yetu (external link) posts
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin'
import { z } from 'zod'

const fetchOgSchema = z.object({
  url: z.string().url('Invalid URL'),
})

interface OgMetadata {
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  url: string
}

/**
 * Extract Open Graph metadata from HTML content
 */
function extractOgMetadata(html: string, url: string): OgMetadata {
  const getMetaContent = (property: string): string | null => {
    // Try og: prefix
    const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
    if (ogMatch) return ogMatch[1]

    // Try reverse order (content before property)
    const ogMatchReverse = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i'))
    if (ogMatchReverse) return ogMatchReverse[1]

    // Try twitter: prefix as fallback
    const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
    if (twitterMatch) return twitterMatch[1]

    return null
  }

  // Extract title - try OG first, then regular title tag
  let title = getMetaContent('title')
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    title = titleMatch ? titleMatch[1].trim() : null
  }

  // Extract description
  let description = getMetaContent('description')
  if (!description) {
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    description = descMatch ? descMatch[1] : null
  }

  // Extract image
  const image = getMetaContent('image')

  // Extract site name
  let siteName = getMetaContent('site_name')
  if (!siteName) {
    // Try to extract from URL
    try {
      const urlObj = new URL(url)
      siteName = urlObj.hostname.replace('www.', '')
    } catch {
      siteName = null
    }
  }

  return {
    title,
    description,
    image,
    siteName,
    url,
  }
}

/**
 * POST /api/admin/fetch-og
 * Fetch Open Graph metadata from an external URL
 *
 * Request Body:
 * {
 *   "url": "https://example.com/article"
 * }
 *
 * Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "title": "Article Title",
 *     "description": "Article description...",
 *     "image": "https://example.com/image.jpg",
 *     "siteName": "Example Site",
 *     "url": "https://example.com/article"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const body = await request.json()
    const validation = fetchOgSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: validation.error.issues[0].message },
        },
        { status: 400 }
      )
    }

    const { url } = validation.data

    // Fetch the URL with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IndabaXBot/1.0; +https://deeplearningindabaxkenya.com)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: { message: `Failed to fetch URL: ${response.status} ${response.statusText}` },
          },
          { status: 400 }
        )
      }

      const html = await response.text()
      const metadata = extractOgMetadata(html, url)

      return NextResponse.json({
        success: true,
        data: metadata,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Request timed out. The URL took too long to respond.' },
          },
          { status: 408 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: { message: `Failed to fetch URL: ${fetchError.message}` },
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Fetch OG error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred while fetching metadata' },
      },
      { status: 500 }
    )
  }
}
