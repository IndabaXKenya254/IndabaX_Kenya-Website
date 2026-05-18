// Enable ISR caching - revalidate every 60 seconds
export const revalidate = 60

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - POSTS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/posts - List published posts with pagination
// Created: Day 2 - Public API Endpoints

import { NextRequest, NextResponse } from 'next/server'

// Enable Edge Runtime for faster global response times
export const runtime = 'edge';

import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { validateQuery, postsQuerySchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, Post } from '@/types/api'

/**
 * GET /api/posts?category=news&limit=20&offset=0
 * Returns published posts ordered by published_at (newest first)
 *
 * Query Parameters:
 * - category (optional): Filter by category (news | announcement | article)
 * - limit (optional): Maximum number of results (1-100, default: 20)
 * - offset (optional): Number of results to skip (default: 0) for pagination
 *
 * Note: RLS policy only shows published posts with published_at set
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams

    // Validate query parameters
    const validation = validateQuery(postsQuerySchema, searchParams)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const { category, limit, offset } = validation.data

    // Build query - select only needed fields for performance
    // Include Sauti Yetu fields for external link posts
    let query = supabase
      .from('posts')
      .select('id, slug, title, excerpt, content, featured_image, category, author_id, status, published_at, created_at, updated_at, post_type, external_url, og_image, source_name', { count: 'exact' }) // Get total count for pagination
      .eq('status', 'published') // Only published posts (RLS also enforces)
      .not('published_at', 'is', null) // Must have publish date

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Apply pagination
    const rangeStart = offset || 0
    const rangeEnd = rangeStart + ((limit || 20) - 1)
    query = query.range(rangeStart, rangeEnd)

    // Order by published date (newest first)
    query = query.order('published_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Posts query error:', error)
      return handleDatabaseError(error)
    }

    // Success response with pagination info
    const response: ApiSuccessResponse<Post[]> = {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }

    // Add headers for pagination and caching
    const headers = new Headers()
    if (count !== null) {
      headers.set('X-Total-Count', count.toString())
    }
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    // Cache for 5 minutes on CDN, serve stale for 10 minutes while revalidating

    return NextResponse.json(response, { status: 200, headers })
  } catch (error) {
    return handleError(error)
  }
}
