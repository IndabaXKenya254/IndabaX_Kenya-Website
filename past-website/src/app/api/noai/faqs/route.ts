export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI FAQS API - FAQ Management
// ═══════════════════════════════════════════════════════════════════════
// GET    /api/noai/faqs?category=general - List FAQs
// POST   /api/noai/faqs - Create FAQ (admin only)
// PATCH  /api/noai/faqs - Update FAQ (admin only)
// DELETE /api/noai/faqs - Delete FAQ (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/noai/faqs?category=general
 * Returns published FAQs, optionally filtered by category
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let query = supabase
      .from('noai_faqs')
      .select('*')
      .eq('is_published', true)

    if (category) {
      query = query.eq('category', category)
    }

    query = query.order('display_order', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('FAQs query error:', error)
      return handleDatabaseError(error)
    }

    // Group by category if no filter applied
    let responseData: any = data || []
    if (!category && data) {
      const groupedByCategory: Record<string, any[]> = {}
      data.forEach(faq => {
        const cat = faq.category || 'general'
        if (!groupedByCategory[cat]) {
          groupedByCategory[cat] = []
        }
        groupedByCategory[cat].push(faq)
      })
      responseData = groupedByCategory
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: responseData,
      count: Array.isArray(responseData) ? responseData.length : data?.length || 0,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/noai/faqs
 * Create new FAQ (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { question, answer, category, display_order, is_published } = body

    if (!question || !answer) {
      return handleValidationError('question and answer are required')
    }

    const { data, error } = await supabase
      .from('noai_faqs')
      .insert({
        question,
        answer,
        category: category || 'general',
        display_order: display_order || 0,
        is_published: is_published !== undefined ? is_published : true,
      })
      .select()
      .single()

    if (error) {
      console.error('FAQ creation error:', error)
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
 * PATCH /api/noai/faqs
 * Update FAQ (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { id, question, answer, category, display_order, is_published } = body

    if (!id) {
      return handleValidationError('FAQ ID is required')
    }

    const updateData: any = {}
    if (question !== undefined) updateData.question = question
    if (answer !== undefined) updateData.answer = answer
    if (category !== undefined) updateData.category = category
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_published !== undefined) updateData.is_published = is_published

    const { data, error } = await supabase
      .from('noai_faqs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('FAQ update error:', error)
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
 * DELETE /api/noai/faqs?id=<uuid>
 * Delete FAQ (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return handleValidationError('FAQ ID is required')
    }

    const { error } = await supabase
      .from('noai_faqs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('FAQ deletion error:', error)
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
