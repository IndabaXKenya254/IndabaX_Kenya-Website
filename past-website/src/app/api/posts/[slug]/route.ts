export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - POST DETAIL API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/posts/[slug] - Get single post with author info
// Created: Day 2 - Public API Endpoints

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  handleError,
  handleDatabaseError,
  handleNotFound,
  handleValidationError,
} from '@/lib/api-errors'
import { validateParam, postSlugSchema } from '@/lib/validations/api'
import { getDisplayName, generateInitialsAvatar } from '@/lib/utils/avatar'
import type { ApiSuccessResponse, PostDetail } from '@/types/api'

/**
 * GET /api/posts/welcome-indabax-2026
 * Returns a single post with author information
 *
 * Path Parameters:
 * - slug (required): Post slug (unique identifier)
 *
 * Response includes:
 * - Post details (title, content, excerpt, etc.)
 * - Author info (email) if available
 *
 * Note: RLS policy only shows published posts with published_at set
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerClient()

    // Validate path parameter
    const validation = validateParam(postSlugSchema, params.slug)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const slug = validation.data

    // Query post - select fields for detail page (author info fetched separately if needed)
    // Include Sauti Yetu fields for external link posts
    const { data, error } = await supabase
      .from('posts')
      .select('id, slug, title, excerpt, content, featured_image, author_id, author_name, author_image, status, category, published_at, created_at, updated_at, post_type, external_url, og_image, source_name')
      .eq('slug', slug)
      .eq('status', 'published') // Only published posts (RLS also enforces)
      .not('published_at', 'is', null) // Must have publish date
      .single() // Expect exactly one result (slug is unique)

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        // PGRST116 = no rows returned
        return handleNotFound(`Post '${slug}' not found or not published`)
      }

      console.error('Post detail query error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound(`Post '${slug}' not found`)
    }

    // Optionally fetch author info if author_id exists
    let authorInfo = undefined
    let authorName = data.author_name
    let authorImage = data.author_image

    if (data.author_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(data.author_id)
      if (userData?.user) {
        authorInfo = {
          id: userData.user.id,
          email: userData.user.email || '',
        }

        // Auto-fill author fields if missing
        if (!authorName && userData.user.email) {
          authorName = getDisplayName(userData.user.email)
        }
        if (!authorImage && authorName) {
          authorImage = generateInitialsAvatar(authorName, 200)
        }
      }
    }

    // Transform the data to match PostDetail type
    const postDetail: PostDetail = {
      ...data,
      author: authorInfo,
      author_name: authorName,
      author_image: authorImage,
    }

    // Success response
    const response: ApiSuccessResponse<PostDetail> = {
      success: true,
      data: postDetail,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        // Post details are fairly static - cache for 10 minutes
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
