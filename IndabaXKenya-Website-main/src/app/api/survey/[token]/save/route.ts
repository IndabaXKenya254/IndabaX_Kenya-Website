export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SURVEY AUTO-SAVE API (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════
// Auto-save survey responses

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

interface SaveRequest {
  responses: Record<string, any>
}

/**
 * PATCH /api/survey/[token]/save
 * Auto-save survey responses
 *
 * Body:
 * {
 *   responses: { questionId: answer, ... }
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServerClient()
    const { token } = params

    // ═══════════════════════════════════════════════════════════════════
    // 1. Parse request body
    // ═══════════════════════════════════════════════════════════════════

    const body: SaveRequest = await request.json()

    if (!body.responses || typeof body.responses !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request: responses must be an object' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Find form_response by access_token
    // ═══════════════════════════════════════════════════════════════════

    const { data: formResponse, error: responseError } = await supabase
      .from('form_responses')
      .select('id, status, status_v2, is_complete, deadline_at, template_id')
      .eq('access_token', token)
      .single()

    if (responseError || !formResponse) {
      return NextResponse.json(
        { success: false, error: 'Invalid survey link' },
        { status: 404 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Check if survey already completed
    // ═══════════════════════════════════════════════════════════════════

    // Only check status_v2 for survey completion (status='completed' is for initial application)
    if (formResponse.status_v2 === 'survey_completed') {
      return NextResponse.json(
        { success: false, error: 'Survey already completed' },
        { status: 410 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Check if deadline expired
    // ═══════════════════════════════════════════════════════════════════

    if (formResponse.deadline_at) {
      const deadline = new Date(formResponse.deadline_at)
      const now = new Date()

      if (now > deadline) {
        return NextResponse.json(
          { success: false, error: 'Survey deadline expired' },
          { status: 410 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Fetch questions to calculate progress
    // ═══════════════════════════════════════════════════════════════════

    const { data: questions } = await supabase
      .from('form_questions')
      .select('id, is_required')
      .eq('template_id', formResponse.template_id)

    // Calculate completion percentage
    const requiredQuestions = questions?.filter(q => q.is_required) || []
    const answeredRequired = requiredQuestions.filter(q => {
      const answer = body.responses[q.id]
      if (answer === undefined || answer === null || answer === '') return false
      if (Array.isArray(answer) && answer.length === 0) return false
      return true
    })

    const completionPercentage = requiredQuestions.length > 0
      ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
      : 100

    // ═══════════════════════════════════════════════════════════════════
    // 6. Upsert answers
    // ═══════════════════════════════════════════════════════════════════

    const now = new Date().toISOString()

    // Prepare answers array
    const answersToUpsert = Object.entries(body.responses).map(([questionId, value]) => ({
      response_id: formResponse.id,
      question_id: questionId,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      updated_at: now
    }))

    if (answersToUpsert.length > 0) {
      // Upsert answers (insert or update)
      const { error: answersError } = await supabase
        .from('form_answers')
        .upsert(answersToUpsert, {
          onConflict: 'response_id,question_id',
          ignoreDuplicates: false
        })

      if (answersError) {
        console.error('Failed to save answers:', answersError)
        return NextResponse.json(
          { success: false, error: 'Failed to save answers' },
          { status: 500 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. Update form_response with responses JSON and progress
    // ═══════════════════════════════════════════════════════════════════

    const { error: updateError } = await supabase
      .from('form_responses')
      .update({
        status: 'in_progress',
        responses: body.responses,  // Also save to JSON field for backup
        completion_percentage: completionPercentage,
        last_saved_at: now
      })
      .eq('id', formResponse.id)

    if (updateError) {
      console.error('Failed to update form_response:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update response' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. Return success
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      message: 'Responses saved',
      data: {
        completionPercentage,
        lastSavedAt: now
      }
    })
  } catch (error) {
    console.error('Survey save error:', error)
    return handleError(error)
  }
}
