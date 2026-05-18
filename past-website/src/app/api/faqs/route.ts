export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FAQS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/faqs - List FAQs with optional category filter
// Created: Day 2 - Public API Endpoints

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { validateQuery, faqsQuerySchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, FAQ } from '@/types/api'

/**
 * GET /api/faqs?category=registration&classification=noai
 * Returns active FAQs ordered by category and display_order
 *
 * Query Parameters:
 * - category (optional): Filter by category (registration | venue | schedule | speakers | general)
 * - classification (optional): Filter by classification (website | noai)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams

    // Validate query parameters
    const validation = validateQuery(faqsQuerySchema, searchParams)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const { category, classification } = validation.data

    // Build query - select only needed fields for performance
    let query = supabase
      .from('faqs')
      .select('id, question, answer, category, classification, display_order, is_active, created_at, updated_at')
      .eq('is_active', true) // Only active FAQs (RLS policy)

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Apply classification filter if provided
    if (classification) {
      query = query.eq('classification', classification)
    }

    // Order by category, then display_order
    query = query
      .order('category', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('FAQs query error:', error)
      return handleDatabaseError(error)
    }

    // Success response
    const response: ApiSuccessResponse<FAQ[]> = {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        // FAQs change less frequently - cache for 10 minutes
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
