export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN PRICING TIERS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/pricing - List all pricing tiers
// POST /api/admin/pricing - Create new pricing tier

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'
import type { PricingTier } from '@/app/api/pricing/route'

/**
 * GET /api/admin/pricing
 * List all pricing tiers (including inactive)
 *
 * Query Parameters:
 * - is_active: 'true' | 'false' (optional)
 * - featured: 'true' | 'false' (optional)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const isActive = searchParams.get('is_active')
    const featured = searchParams.get('featured')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('pricing_tiers')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (isActive === 'true') {
      query = query.eq('is_active', true)
    } else if (isActive === 'false') {
      query = query.eq('is_active', false)
    }

    if (featured === 'true') {
      query = query.eq('featured', true)
    } else if (featured === 'false') {
      query = query.eq('featured', false)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Pricing tiers list error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<PricingTier[]> = {
      success: true,
      data: (data || []) as PricingTier[],
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
 * POST /api/admin/pricing
 * Create a new pricing tier
 *
 * Request Body:
 * {
 *   "title": "Student Pass",
 *   "price": "FREE",
 *   "currency": "KSH" (optional, default: "KSH"),
 *   "period": "3 Days" (optional, default: "3 Days"),
 *   "description": "..." (optional),
 *   "featured": true/false (default: false),
 *   "badge": "Most Popular" (optional),
 *   "features": ["...", "..."],
 *   "requirements": ["...", "..."] (optional),
 *   "button_text": "Register Now" (default: "Register Now"),
 *   "button_link": "/register" (default: "/register"),
 *   "display_order": 0 (default: 0),
 *   "is_active": true/false (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Basic validation
    if (!body.title || !body.price || !Array.isArray(body.features)) {
      return handleValidationError('Missing required fields: title, price, and features array are required')
    }

    // Prepare data
    const pricingData = {
      title: body.title,
      price: body.price,
      currency: body.currency || 'KSH',
      period: body.period || '3 Days',
      description: body.description || null,
      featured: body.featured || false,
      badge: body.badge || null,
      features: body.features,
      requirements: body.requirements || [],
      button_text: body.button_text || 'Register Now',
      button_link: body.button_link || '/register',
      display_order: body.display_order || 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
    }

    // Insert pricing tier
    const { data, error } = await supabase
      .from('pricing_tiers')
      .insert([pricingData])
      .select()
      .single()

    if (error) {
      console.error('Pricing tier creation error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<PricingTier> = {
      success: true,
      data: data as PricingTier,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
