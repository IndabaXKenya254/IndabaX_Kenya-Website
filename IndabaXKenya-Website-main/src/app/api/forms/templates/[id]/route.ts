export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SINGLE FORM TEMPLATE API
// ═══════════════════════════════════════════════════════════════════════
// Get, update, delete specific template
// Phase 3: Form Builder

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'
import { z } from 'zod'

// Validation schema for template update
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  usage_type: z.enum(['initial_interest', 'detailed_survey', 'paper_submission', 'custom', 'application']).optional(),
  is_locked: z.boolean().optional(),
  locked_to_event_id: z.string().uuid().optional().nullable(),
  settings: z.object({
    validityPeriodDays: z.number().min(1).max(365).optional(),
    autoSave: z.boolean().optional(),
    allowResume: z.boolean().optional(),
    showProgress: z.boolean().optional(),
  }).optional(),
})

/**
 * GET /api/forms/templates/[id]
 * Get single template with questions
 * NOTE: This endpoint is PUBLIC for event registration pages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params

    // Fetch template with questions
    const { data: template, error } = await supabase
      .from('form_templates')
      .select(`
        *,
        form_questions (
          id,
          type,
          title,
          description,
          is_required,
          order_index,
          config,
          validation_rules,
          conditional_logic,
          created_at
        ),
        user_profiles!form_templates_created_by_fkey (
          name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Template not found',
            },
          },
          { status: 404 }
        )
      }

      console.error('Error fetching template:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch template',
          },
        },
        { status: 500 }
      )
    }

    // Sort questions by order_index
    if (template.form_questions) {
      template.form_questions.sort((a: any, b: any) => a.order_index - b.order_index)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: template,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/forms/templates/[id]
 * Update template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use consistent admin middleware (checks admin_roles table)
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params

    // Validate request body
    const body = await request.json()
    const validation = updateTemplateSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const updateData = validation.data

    // Update template
    const { data: template, error } = await supabase
      .from('form_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Template not found',
            },
          },
          { status: 404 }
        )
      }

      console.error('Error updating template:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update template',
          },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: template,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/forms/templates/[id]
 * Delete template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use consistent admin middleware (checks admin_roles table)
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params

    // Check if template is locked to an event
    const { data: template } = await supabase
      .from('form_templates')
      .select('is_locked, locked_to_event_id')
      .eq('id', id)
      .single()

    if (template?.is_locked) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot delete locked template. Unlock it first.',
          },
        },
        { status: 403 }
      )
    }

    // Delete template (cascades to questions)
    const { error } = await supabase
      .from('form_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete template',
          },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: { message: 'Template deleted successfully' },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
