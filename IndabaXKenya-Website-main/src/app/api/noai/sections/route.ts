export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI SECTIONS API - Page Content Management
// ═══════════════════════════════════════════════════════════════════════
// GET    /api/noai/sections - List all sections (public)
// POST   /api/noai/sections - Create section (admin only)
// PATCH  /api/noai/sections - Update section (admin only)
// DELETE /api/noai/sections - Delete section (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/noai/sections
 * Returns published sections ordered by display_order
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('noai_page_sections')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Sections query error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/noai/sections
 * Create new section (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { section_key, title, content, display_order, is_published } = body

    if (!section_key || !title) {
      return handleValidationError('section_key and title are required')
    }

    const { data, error } = await supabase
      .from('noai_page_sections')
      .insert({
        section_key,
        title,
        content: content || {},
        display_order: display_order || 0,
        is_published: is_published !== undefined ? is_published : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Section creation error:', error)
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
 * PATCH /api/noai/sections
 * Update section (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { id, title, content, display_order, is_published } = body

    if (!id) {
      return handleValidationError('Section ID is required')
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_published !== undefined) updateData.is_published = is_published

    const { data, error } = await supabase
      .from('noai_page_sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Section update error:', error)
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
 * DELETE /api/noai/sections?id=<uuid>
 * Delete section (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return handleValidationError('Section ID is required')
    }

    const { error } = await supabase
      .from('noai_page_sections')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Section deletion error:', error)
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
