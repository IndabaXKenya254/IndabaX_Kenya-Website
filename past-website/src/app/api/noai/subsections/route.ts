export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI SUBSECTIONS API - Dynamic Content Blocks Management
// ═══════════════════════════════════════════════════════════════════════
// GET    /api/noai/subsections?parent=about_noai - List subsections
// POST   /api/noai/subsections - Create subsection (admin only)
// PATCH  /api/noai/subsections - Update subsection (admin only)
// DELETE /api/noai/subsections?id=<uuid> - Delete subsection (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/noai/subsections?parent=about_noai
 * Returns published subsections for a parent section, ordered by display_order
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const parent = searchParams.get('parent')

    let query = supabase
      .from('noai_subsections')
      .select('*')
      .eq('is_published', true)

    if (parent) {
      query = query.eq('parent_section_key', parent)
    }

    query = query.order('display_order', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Subsections query error:', error)
      return handleDatabaseError(error)
    }

    // Group by parent if no filter applied
    let responseData: any = data || []
    if (!parent && data) {
      const groupedByParent: Record<string, any[]> = {}
      data.forEach(subsection => {
        const parentKey = subsection.parent_section_key
        if (!groupedByParent[parentKey]) {
          groupedByParent[parentKey] = []
        }
        groupedByParent[parentKey].push(subsection)
      })
      responseData = groupedByParent
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: responseData,
      count: Array.isArray(responseData) ? responseData.length : data?.length || 0,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=60',
        'CDN-Cache-Control': 'public, s-maxage=600',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/noai/subsections
 * Create new subsection (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { parent_section_key, title, content, display_order, is_published, style_variant, icon } = body

    if (!parent_section_key) {
      return handleValidationError('parent_section_key is required')
    }

    const { data, error } = await supabase
      .from('noai_subsections')
      .insert({
        parent_section_key,
        title: title || '',
        content: content || {},
        display_order: display_order || 0,
        is_published: is_published !== undefined ? is_published : true,
        style_variant: style_variant || 'card',
        icon: icon || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Subsection creation error:', error)
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
 * PATCH /api/noai/subsections
 * Update subsection (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { id, title, content, display_order, is_published, style_variant, icon } = body

    if (!id) {
      return handleValidationError('Subsection ID is required')
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_published !== undefined) updateData.is_published = is_published
    if (style_variant !== undefined) updateData.style_variant = style_variant
    if (icon !== undefined) updateData.icon = icon

    const { data, error } = await supabase
      .from('noai_subsections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Subsection update error:', error)
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
 * DELETE /api/noai/subsections?id=<uuid>
 * Delete subsection (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return handleValidationError('Subsection ID is required')
    }

    const { error } = await supabase
      .from('noai_subsections')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Subsection deletion error:', error)
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
