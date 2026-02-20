export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM TEMPLATES API
// ═══════════════════════════════════════════════════════════════════════
// CRUD operations for form templates
// Phase 3: Form Builder

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'
import { z } from 'zod'

// Validation schema for template creation
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().optional(),
  usage_type: z.enum(['initial_interest', 'detailed_survey', 'paper_submission', 'custom', 'application']),
  is_locked: z.boolean().default(false),
  locked_to_event_id: z.string().uuid().optional().nullable(),
  settings: z.object({
    validityPeriodDays: z.number().min(1).max(365).default(7),
    autoSave: z.boolean().default(true),
    allowResume: z.boolean().default(true),
    showProgress: z.boolean().default(true),
  }).optional(),
})

/**
 * GET /api/forms/templates
 * Get all form templates with pagination
 *
 * Query params:
 * - usage_type: Filter by usage type
 * - search: Search in name/description
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export async function GET(request: NextRequest) {
  // Use consistent admin middleware (checks admin_roles table)
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const usageType = searchParams.get('usage_type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build count query for total
    let countQuery = supabase
      .from('form_templates')
      .select('id', { count: 'exact', head: true })

    // Apply filters to count query
    if (usageType) {
      countQuery = countQuery.eq('usage_type', usageType)
    }

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { count: total, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting templates:', countError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to count templates',
          },
        },
        { status: 500 }
      )
    }

    // Build data query
    let query = supabase
      .from('form_templates')
      .select(`
        id,
        name,
        description,
        usage_type,
        is_locked,
        locked_to_event_id,
        settings,
        created_at,
        updated_at,
        created_by,
        user_profiles!form_templates_created_by_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (usageType) {
      query = query.eq('usage_type', usageType)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch templates',
          },
        },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalCount = total || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Return paginated response
    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    }, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/forms/templates
 * Create new form template
 */
export async function POST(request: NextRequest) {
  // Use consistent admin middleware (checks admin_roles table)
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  const { user } = authCheck.data

  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()
    const validation = createTemplateSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const templateData = validation.data

    // Create template
    const { data: template, error } = await supabase
      .from('form_templates')
      .insert({
        name: templateData.name,
        description: templateData.description,
        usage_type: templateData.usage_type,
        is_locked: templateData.is_locked,
        locked_to_event_id: templateData.locked_to_event_id,
        settings: templateData.settings || {
          validityPeriodDays: 7,
          autoSave: true,
          allowResume: true,
          showProgress: true,
        },
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create template',
          },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: template,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
