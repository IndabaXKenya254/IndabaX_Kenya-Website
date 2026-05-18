export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TEAM MEMBERS ADMIN API
// ═══════════════════════════════════════════════════════════════════════
// CRUD operations for team members management
// Requires authentication and admin role

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/middleware/admin'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

// Helper to invalidate all team-related caches
function invalidateTeamCache() {
  revalidatePath('/team')
  revalidatePath('/api/team')
  revalidatePath('/admin/team')
}

// Validation schema
const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  role: z.string().min(1, 'Role is required').max(255),
  photo_url: z.string().url('Invalid photo URL').optional().nullable().or(z.literal('')),
  bio: z.string().optional().nullable(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  twitter_url: z.string().url('Invalid Twitter URL').optional().nullable().or(z.literal('')),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  // Relationships
  event_ids: z.array(z.string().uuid()).optional(),
})

/**
 * GET /api/admin/team
 * List all team members (including inactive) with pagination
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {

    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('is_active')

    // Build query
    let query = supabase
      .from('team_members')
      .select('*', { count: 'exact' })

    // Filter by active status
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,role.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    query = query
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Team members query error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data || [],
      count: count || 0,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/admin/team
 * Create a new team member
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {

    const supabase = createServerClient()
    const body = await request.json()

    // Validate input
    const validation = teamMemberSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract event_ids from validated data
    const { event_ids, ...teamMemberData } = validation.data

    // Insert team member
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        name: teamMemberData.name,
        role: teamMemberData.role,
        photo_url: teamMemberData.photo_url || null,
        bio: teamMemberData.bio || null,
        linkedin_url: teamMemberData.linkedin_url || null,
        twitter_url: teamMemberData.twitter_url || null,
        display_order: teamMemberData.display_order,
        is_active: teamMemberData.is_active,
      })
      .select()
      .single()

    if (error) {
      console.error('Team member creation error:', error)
      return handleDatabaseError(error)
    }

    // Handle event linking if event_ids provided
    if (event_ids && event_ids.length > 0) {
      const eventRelations = event_ids.map((eventId, index) => ({
        event_id: eventId,
        team_member_id: data.id,
        display_order: index,
      }))

      const { error: eventError } = await supabase
        .from('event_team_members')
        .insert(eventRelations)

      if (eventError) {
        console.error('Event linking error (non-critical):', eventError)
      }
    }

    // Invalidate team caches after successful creation
    invalidateTeamCache()

    const response: ApiSuccessResponse<any> = {
      success: true,
      data,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/admin/team/:id
 * Update a team member
 */
export async function PUT(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Validate input
    const validation = teamMemberSchema.partial().safeParse(updateData)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract event_ids from validated data
    const { event_ids, ...teamMemberUpdates } = validation.data

    // Update team member
    const { data, error } = await supabase
      .from('team_members')
      .update(teamMemberUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Team member update error:', error)
      return handleDatabaseError(error)
    }

    // Handle event linking if event_ids provided
    if (event_ids !== undefined) {
      // Delete existing event links
      await supabase
        .from('event_team_members')
        .delete()
        .eq('team_member_id', id)

      // Insert new event links
      if (event_ids.length > 0) {
        const eventRelations = event_ids.map((eventId, index) => ({
          event_id: eventId,
          team_member_id: id,
          display_order: index,
        }))

        const { error: eventError } = await supabase
          .from('event_team_members')
          .insert(eventRelations)

        if (eventError) {
          console.error('Event linking error (non-critical):', eventError)
        }
      }
    }

    // Invalidate team caches after successful update
    invalidateTeamCache()

    const response: ApiSuccessResponse<any> = {
      success: true,
      data,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/team/:id
 * Delete a team member
 */
export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Delete team member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Team member deletion error:', error)
      return handleDatabaseError(error)
    }

    // Invalidate team caches after successful deletion
    invalidateTeamCache()

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: { deleted: true },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
