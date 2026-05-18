export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI PARTICIPANTS API - Team Members Management
// ═══════════════════════════════════════════════════════════════════════
// GET    /api/noai/participants?year=2025 - List participants
// POST   /api/noai/participants - Create participant (admin only)
// PATCH  /api/noai/participants - Update participant (admin only)
// DELETE /api/noai/participants - Delete participant (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/noai/participants?year=2025
 * Returns published participants, optionally filtered by year
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const includeAll = searchParams.get('all') === 'true' // Admin can request all including unpublished

    let query = supabase
      .from('noai_participants')
      .select('*')

    // Only filter by published if not requesting all (for public views)
    if (!includeAll) {
      query = query.eq('is_published', true)
    }

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    query = query
      .order('year', { ascending: false })
      .order('display_order', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Participants query error:', error)
      return handleDatabaseError(error)
    }

    // Group by year for easier frontend consumption
    const groupedByYear: Record<number, any[]> = {}
    data?.forEach(participant => {
      if (!groupedByYear[participant.year]) {
        groupedByYear[participant.year] = []
      }
      groupedByYear[participant.year].push(participant)
    })

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: year ? (data || []) : groupedByYear,
      count: data?.length || 0,
    }

    // Don't cache admin requests (when all=true), only cache public requests
    const cacheHeaders = includeAll
      ? { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      : { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }

    return NextResponse.json(response, {
      status: 200,
      headers: cacheHeaders
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/noai/participants
 * Create new participant (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { year, name, school, role, photo_url, achievement, bio, display_order, is_published } = body

    if (!year || !photo_url) {
      return handleValidationError('year and photo_url are required')
    }

    const { data, error } = await supabase
      .from('noai_participants')
      .insert({
        year: parseInt(year),
        name: name || null,
        school: school || null,
        role: role || 'contestant',
        photo_url,
        achievement: achievement || null,
        bio: bio || null,
        display_order: display_order || 0,
        is_published: is_published !== undefined ? is_published : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Participant creation error:', error)
      return handleDatabaseError(error)
    }

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
 * PATCH /api/noai/participants
 * Update participant (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { id, year, name, school, role, photo_url, achievement, bio, display_order, is_published } = body

    if (!id) {
      return handleValidationError('Participant ID is required')
    }

    const updateData: any = {}
    if (year !== undefined) updateData.year = parseInt(year)
    if (name !== undefined) updateData.name = name
    if (school !== undefined) updateData.school = school
    if (role !== undefined) updateData.role = role
    if (photo_url !== undefined) updateData.photo_url = photo_url
    if (achievement !== undefined) updateData.achievement = achievement
    if (bio !== undefined) updateData.bio = bio
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_published !== undefined) updateData.is_published = is_published

    const { data, error } = await supabase
      .from('noai_participants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Participant update error:', error)
      return handleDatabaseError(error)
    }

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
 * DELETE /api/noai/participants?id=<uuid>
 * Delete participant (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return handleValidationError('Participant ID is required')
    }

    const { error } = await supabase
      .from('noai_participants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Participant deletion error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: { id },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
