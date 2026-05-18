export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TEMPLATE QUESTIONS API
// ═══════════════════════════════════════════════════════════════════════
// Create, update, delete questions for a template
// Phase 3: Form Builder

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'
import { z } from 'zod'

// Validation schema for question
const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    'short_answer',
    'paragraph',
    'multiple_choice',
    'checkboxes',
    'dropdown',
    'linear_scale',
    'multiple_choice_grid',
    'checkbox_grid',
    'date',
    'time',
    'file_upload',
    'title_description',
    'image',
    'video',
    'section_break',
  ]),
  title: z.string(),
  description: z.string().optional().nullable(),
  is_required: z.boolean().default(false),
  order_index: z.number(),
  config: z.any().optional().default({}),
  validation_rules: z.any().optional().nullable().default({}),
  conditional_logic: z.any().optional().nullable(),
})

const questionsArraySchema = z.object({
  questions: z.array(questionSchema),
})

/**
 * GET /api/forms/templates/[id]/questions
 * Get all questions for a template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id: templateId } = params

    // Fetch questions for this template
    const { data: questions, error } = await supabase
      .from('form_questions')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch questions',
          },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: questions || [],
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/forms/templates/[id]/questions
 * Create questions for a template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use consistent admin middleware (checks admin_roles table)
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id: templateId } = params

    // Validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('JSON parse error:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      )
    }

    console.log('POST - Received body:', JSON.stringify(body, null, 2))

    const validation = questionsArraySchema.safeParse(body)

    if (!validation.success) {
      console.error('POST - Validation error:', JSON.stringify(validation.error, null, 2))
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `${firstError.path.join('.')}: ${firstError.message}`,
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { questions } = validation.data

    // Insert questions
    const questionsToInsert = questions.map((q) => ({
      template_id: templateId,
      type: q.type,
      title: q.title,
      description: q.description,
      is_required: q.is_required,
      order_index: q.order_index,
      config: q.config,
      validation_rules: q.validation_rules,
      conditional_logic: q.conditional_logic,
    }))

    const { data: createdQuestions, error } = await supabase
      .from('form_questions')
      .insert(questionsToInsert)
      .select()

    if (error) {
      console.error('Error creating questions:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create questions',
          },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: createdQuestions,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/forms/templates/[id]/questions
 * Update questions for a template using UPSERT logic
 *
 * Issue #44 FIX: Preserve question IDs to maintain form_answers references
 * - Questions WITH existing IDs → UPDATE them (preserves FK references)
 * - Questions WITHOUT IDs → INSERT as new
 * - Existing questions NOT in request → DELETE them
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use consistent admin middleware (checks admin_roles table)
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id: templateId } = params

    // Validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('JSON parse error:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      )
    }

    console.log('PUT - Received body:', JSON.stringify(body, null, 2))

    const validation = questionsArraySchema.safeParse(body)

    if (!validation.success) {
      console.error('PUT - Validation error:', JSON.stringify(validation.error, null, 2))
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `${firstError.path.join('.')}: ${firstError.message}`,
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { questions } = validation.data

    // ═══════════════════════════════════════════════════════════════════
    // Issue #44 FIX: UPSERT logic to preserve question IDs
    // ═══════════════════════════════════════════════════════════════════

    // 1. Get existing question IDs for this template
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('form_questions')
      .select('id')
      .eq('template_id', templateId)

    if (fetchError) {
      console.error('Error fetching existing questions:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch existing questions',
          },
        },
        { status: 500 }
      )
    }

    const existingIdList = (existingQuestions || []).map(q => q.id)
    const existingIds = new Set(existingIdList)
    const incomingIdList = questions.filter(q => q.id).map(q => q.id)
    const incomingIds = new Set(incomingIdList)

    // 2. Separate into UPDATE vs INSERT
    const questionsToUpdate = questions.filter(q => q.id && existingIds.has(q.id))
    const questionsToInsert = questions.filter(q => !q.id)

    // 3. Find IDs to delete (exist in DB but not in incoming request)
    const idsToDelete = existingIdList.filter(id => !incomingIds.has(id))

    console.log(`Issue #44 FIX - Update: ${questionsToUpdate.length}, Insert: ${questionsToInsert.length}, Delete: ${idsToDelete.length}`)

    // 4. Delete questions that are no longer in the template
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('form_questions')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        console.error('Error deleting removed questions:', deleteError)
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to delete removed questions',
            },
          },
          { status: 500 }
        )
      }
    }

    // 5. Update existing questions (preserves their IDs!)
    const updatedQuestions: any[] = []
    for (const q of questionsToUpdate) {
      const { data: updated, error: updateError } = await supabase
        .from('form_questions')
        .update({
          type: q.type,
          title: q.title,
          description: q.description,
          is_required: q.is_required,
          order_index: q.order_index,
          config: q.config,
          validation_rules: q.validation_rules,
          conditional_logic: q.conditional_logic,
        })
        .eq('id', q.id)
        .eq('template_id', templateId)
        .select()
        .single()

      if (updateError) {
        console.error(`Error updating question ${q.id}:`, updateError)
        // Continue with other updates, don't fail entirely
      } else if (updated) {
        updatedQuestions.push(updated)
      }
    }

    // 6. Insert new questions
    let insertedQuestions: any[] = []
    if (questionsToInsert.length > 0) {
      const toInsert = questionsToInsert.map((q) => ({
        template_id: templateId,
        type: q.type,
        title: q.title,
        description: q.description,
        is_required: q.is_required,
        order_index: q.order_index,
        config: q.config,
        validation_rules: q.validation_rules,
        conditional_logic: q.conditional_logic,
      }))

      const { data: created, error: insertError } = await supabase
        .from('form_questions')
        .insert(toInsert)
        .select()

      if (insertError) {
        console.error('Error inserting new questions:', insertError)
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to create new questions',
            },
          },
          { status: 500 }
        )
      }

      insertedQuestions = created || []
    }

    // 7. Return all questions sorted by order_index
    const allQuestions = [...updatedQuestions, ...insertedQuestions].sort(
      (a, b) => a.order_index - b.order_index
    )

    const response = {
      success: true as const,
      data: allQuestions,
      meta: {
        updated: updatedQuestions.length,
        inserted: insertedQuestions.length,
        deleted: idsToDelete.length,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
