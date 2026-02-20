export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN POSTS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/posts - List all posts (including drafts)
// POST /api/admin/posts - Create new post
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createPostSchema } from '@/lib/validations/admin'
import { getDisplayName, generateInitialsAvatar } from '@/lib/utils/avatar'
import type { ApiSuccessResponse, Post } from '@/types/api'

/**
 * GET /api/admin/posts
 * List all posts (including drafts) for admin
 *
 * Query Parameters:
 * - status: 'draft' | 'published' (optional)
 * - category: 'news' | 'announcement' | 'article' (optional)
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 * - include: 'tags' (optional, comma-separated)
 *
 * Returns:
 * - 200 OK: List of posts
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not an admin
 * - 500 Internal Error: Server error
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const postType = searchParams.get('post_type')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.eq('status', status)
    }

    if (category && ['news', 'announcement', 'event', 'blog', 'article'].includes(category)) {
      query = query.eq('category', category)
    }

    // Apply post type filter (normal or sauti_yetu)
    if (postType && ['normal', 'sauti_yetu'].includes(postType)) {
      query = query.eq('post_type', postType)
    }

    // Apply search filter (search in title and content)
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Posts list error:', error)
      return handleDatabaseError(error)
    }

    const posts = data || []

    // Optionally include relationships (query param: include=tags)
    const include = searchParams.get('include')
    const includeTags = include?.includes('tags')

    // Fetch tags for all posts (if requested)
    if (includeTags && posts.length > 0) {
      const postIds = posts.map(p => p.id)
      const { data: tagData } = await supabase
        .from('post_tag_relations')
        .select('post_id, tag:post_tags(id, name, slug)')
        .in('post_id', postIds)

      // Group tags by post_id
      const tagsByPost = tagData?.reduce((acc: any, item: any) => {
        if (!acc[item.post_id]) acc[item.post_id] = []
        acc[item.post_id].push(item.tag)
        return acc
      }, {}) || {}

      // Attach tags to posts
      posts.forEach((post: any) => {
        post.tags = tagsByPost[post.id] || []
      })
    }

    // Return results
    const response: ApiSuccessResponse<Post[]> = {
      success: true,
      data: posts as Post[],
      count: count || 0,
    }

    const headers = new Headers()
    if (count !== null) {
      headers.set('X-Total-Count', count.toString())
    }

    return NextResponse.json(response, { status: 200, headers })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/admin/posts
 * Create a new post
 *
 * Request Body:
 * {
 *   "slug": "my-post-slug",
 *   "title": "Post Title",
 *   "excerpt": "Short excerpt..." (optional),
 *   "content": "Full post content...",
 *   "featured_image": "https://..." (optional),
 *   "category": "news" | "announcement" | "article" (optional),
 *   "status": "draft" | "published" (default: draft),
 *   "published_at": "2025-10-23T12:00:00Z" (optional)
 * }
 *
 * Returns:
 * - 201 Created: Post created successfully
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not an admin
 * - 409 Conflict: Slug already exists
 * - 500 Internal Error: Server error
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { user } = authCheck.data

    // Validate request body
    const body = await request.json()
    const validation = createPostSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract relationships from validated data
    const { tag_ids, ...postData } = validation.data

    // Auto-generate slug from title if not provided
    let slug = postData.slug
    if (!slug) {
      // Generate slug from title
      slug = postData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 255) // Limit to max length

      // Check if slug exists and make it unique
      let uniqueSlug = slug
      let counter = 2
      let slugExists = true

      while (slugExists) {
        const { data: existingPost } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', uniqueSlug)
          .single()

        if (!existingPost) {
          slugExists = false
          slug = uniqueSlug
        } else {
          uniqueSlug = `${slug}-${counter}`
          counter++
        }
      }
    }

    // Normalize featured_image_url to featured_image
    const featuredImage = (postData as any).featured_image_url || postData.featured_image || ''

    // Set default author info if not provided
    const userEmail = authCheck.data.email || 'admin@deeplearningindabaxkenya.com'
    const authorName = postData.author_name || getDisplayName(userEmail)
    const authorImage = postData.author_image || generateInitialsAvatar(authorName, 200)

    // If status is 'published' and no published_at provided, set to now
    const insertData: any = {
      ...postData,
      slug,
      featured_image: featuredImage,
      author_id: user.id,
      author_name: authorName,
      author_image: authorImage,
    }

    // Remove the alias field if present
    delete insertData.featured_image_url

    if (postData.status === 'published' && !postData.published_at) {
      insertData.published_at = new Date().toISOString()
    }

    // Insert post
    const { data, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Post insert error:', error)

      // Check for duplicate slug
      if (error.code === '23505' && error.message.includes('slug')) {
        return handleValidationError('A post with this slug already exists.')
      }

      return handleDatabaseError(error)
    }

    // Insert post-tag relationships (if provided)
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tagId => ({
        post_id: data.id,
        tag_id: tagId,
      }))

      const { error: tagError } = await supabase
        .from('post_tag_relations')
        .insert(tagRelations)

      if (tagError) {
        console.error('Tag relations insert error:', tagError)
        // Non-critical - post still created
      }
    }

    const response: ApiSuccessResponse<Post> = {
      success: true,
      data: data as Post,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
