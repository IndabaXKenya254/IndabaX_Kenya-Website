export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE POST API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/posts/[id] - Get single post
// PATCH /api/admin/posts/[id] - Update post
// DELETE /api/admin/posts/[id] - Delete post
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updatePostSchema } from '@/lib/validations/admin'
import { getDisplayName, generateInitialsAvatar } from '@/lib/utils/avatar'
import type { ApiSuccessResponse, Post } from '@/types/api'

/**
 * GET /api/admin/posts/[id]
 * Get a single post by ID (includes tags by default)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params

    // Fetch post
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Post fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Post')
    }

    const post: any = data

    // Fetch tags for this post
    const { data: tagData } = await supabase
      .from('post_tag_relations')
      .select('tag:post_tags(id, name, slug)')
      .eq('post_id', id)

    post.tags = tagData?.map(t => t.tag) || []

    const response: ApiSuccessResponse<Post> = {
      success: true,
      data: post as Post,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/posts/[id]
 * Update a post
 *
 * Request Body (all fields optional):
 * {
 *   "slug": "updated-slug",
 *   "title": "Updated Title",
 *   "excerpt": "Short excerpt...",
 *   "content": "Updated content...",
 *   "status": "published",
 *   "is_featured": true,
 *   "author_name": "John Doe",
 *   "author_image": "https://...",
 *   "tag_ids": ["uuid1", "uuid2"]
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params

    // Validate request body
    const body = await request.json()
    const validation = updatePostSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract relationships from validated data
    const { tag_ids, ...postUpdates } = validation.data

    // Normalize field aliases: featured_image_url -> featured_image
    if ('featured_image_url' in postUpdates && postUpdates.featured_image_url) {
      (postUpdates as any).featured_image = postUpdates.featured_image_url
    }
    delete (postUpdates as any).featured_image_url

    // Set default author info if author_name is being set but author_image is not
    if (postUpdates.author_name && !postUpdates.author_image) {
      (postUpdates as any).author_image = generateInitialsAvatar(postUpdates.author_name, 200)
    }

    // If changing to published status and no published_at, set to now
    if (postUpdates.status === 'published' && !postUpdates.published_at) {
      (postUpdates as any).published_at = new Date().toISOString()
    }

    // Update post
    const { data, error } = await supabase
      .from('posts')
      .update(postUpdates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Post update error:', error)

      // Check for duplicate slug
      if (error.code === '23505' && error.message.includes('slug')) {
        return handleValidationError('A post with this slug already exists.')
      }

      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Post')
    }

    // Update tag relationships (if provided)
    if (tag_ids !== undefined) {
      // Delete existing tag relationships
      await supabase
        .from('post_tag_relations')
        .delete()
        .eq('post_id', id)

      // Insert new tag relationships
      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map(tagId => ({
          post_id: id,
          tag_id: tagId,
        }))

        const { error: tagError } = await supabase
          .from('post_tag_relations')
          .insert(tagRelations)

        if (tagError) {
          console.error('Tag relations update error:', tagError)
        }
      }
    }

    const response: ApiSuccessResponse<Post> = {
      success: true,
      data: data as Post,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/posts/[id]
 * Delete a post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Post delete error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Success" },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
