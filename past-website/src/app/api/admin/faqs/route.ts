export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN FAQS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/faqs - List all FAQs
// POST /api/admin/faqs - Create new FAQ
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createFaqSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Faq } from '@/types/api'

/**
 * GET /api/admin/faqs
 * List all FAQs for admin
 *
 * Query Parameters:
 * - category: 'registration' | 'venue' | 'schedule' | 'speakers' | 'general' (optional)
 * - is_active: 'true' | 'false' (optional)
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('faqs')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (category && ['registration', 'venue', 'schedule', 'speakers', 'general'].includes(category)) {
      query = query.eq('category', category)
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true)
    } else if (isActive === 'false') {
      query = query.eq('is_active', false)
    }

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('FAQs list error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Faq[]> = {
      success: true,
      data: (data || []) as Faq[],
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
 * POST /api/admin/faqs
 * Create a new FAQ
 *
 * Request Body:
 * {
 *   "question": "How do I register?",
 *   "answer": "You can register by...",
 *   "category": "registration" | "venue" | "schedule" | "speakers" | "general" (optional),
 *   "display_order": 0 (default: 0),
 *   "is_active": true (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()
    const validation = createFaqSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const faqData = validation.data

    // Insert FAQ
    const { data, error } = await supabase
      .from('faqs')
      .insert(faqData)
      .select()
      .single()

    if (error) {
      console.error('FAQ insert error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Faq> = {
      success: true,
      data: data as Faq,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
