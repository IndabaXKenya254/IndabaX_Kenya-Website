export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SURVEY SUBMIT API (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════
// Submit completed survey

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

interface SubmitRequest {
  responses: Record<string, any>
}

/**
 * POST /api/survey/[token]/submit
 * Submit completed survey
 *
 * Body:
 * {
 *   responses: { questionId: answer, ... }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServerClient()
    const { token } = params

    // ═══════════════════════════════════════════════════════════════════
    // 1. Parse request body
    // ═══════════════════════════════════════════════════════════════════

    const body: SubmitRequest = await request.json()

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
      .select(`
        id,
        status,
        status_v2,
        is_complete,
        deadline_at,
        template_id,
        event_id,
        respondent_name,
        respondent_email,
        created_at,
        events (
          id,
          title
        )
      `)
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
          { success: false, error: 'Survey deadline expired. Cannot submit.' },
          { status: 410 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Validate all required questions are answered
    // ═══════════════════════════════════════════════════════════════════

    const { data: questions } = await supabase
      .from('form_questions')
      .select('id, title, is_required')
      .eq('template_id', formResponse.template_id)
      .order('order_index', { ascending: true })

    const missingRequired: string[] = []
    questions?.forEach(q => {
      if (q.is_required) {
        const answer = body.responses[q.id]
        if (answer === undefined || answer === null || answer === '') {
          missingRequired.push(q.title)
        } else if (Array.isArray(answer) && answer.length === 0) {
          missingRequired.push(q.title)
        }
      }
    })

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please answer all required questions',
          missingQuestions: missingRequired
        },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. Prepare for update
    // ═══════════════════════════════════════════════════════════════════

    const now = new Date().toISOString()

    // Note: Responses are stored directly in form_responses.responses (JSONB)
    // The form_answers table is for normalized storage but we use JSONB for simplicity

    // ═══════════════════════════════════════════════════════════════════
    // 7. Calculate time to complete
    // ═══════════════════════════════════════════════════════════════════

    const createdAt = new Date(formResponse.created_at)
    const completedAt = new Date()
    const timeToCompleteSeconds = Math.floor((completedAt.getTime() - createdAt.getTime()) / 1000)

    // ═══════════════════════════════════════════════════════════════════
    // 8. Update form_response to completed
    // ═══════════════════════════════════════════════════════════════════

    const { error: updateError } = await supabase
      .from('form_responses')
      .update({
        status: 'completed',
        status_v2: 'survey_completed',
        is_complete: true,
        responses: body.responses,  // Store final responses in JSON
        completion_percentage: 100,
        completed_at: now,
        time_to_complete_seconds: timeToCompleteSeconds
      })
      .eq('id', formResponse.id)

    if (updateError) {
      console.error('Failed to mark survey as completed:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to submit survey' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. Update original application status to survey_completed
    // ═══════════════════════════════════════════════════════════════════

    // Find the original application by email and event (for new-style shortlisting)
    // This updates the parent application record's status
    if (formResponse.respondent_email && formResponse.event_id) {
      const { error: appError } = await supabase
        .from('form_responses')
        .update({
          status_v2: 'survey_completed'
        })
        .eq('respondent_email', formResponse.respondent_email)
        .eq('event_id', formResponse.event_id)
        .eq('response_type', 'application')
        .in('status_v2', ['shortlisted', 'survey_sent'])

      if (appError) {
        console.error('Failed to update application status:', appError)
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 10. Send completion email (TODO)
    // ═══════════════════════════════════════════════════════════════════

    // TODO: Send survey completion email
    // await sendSurveyCompletionEmail({
    //   to: formResponse.respondent_email,
    //   name: formResponse.respondent_name,
    //   eventTitle: (formResponse.events as any)?.title
    // })

    // ═══════════════════════════════════════════════════════════════════
    // 11. Return success
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      message: 'Survey submitted successfully',
      data: {
        completedAt: now,
        timeToComplete: timeToCompleteSeconds
      }
    })
  } catch (error) {
    console.error('Survey submit error:', error)
    return handleError(error)
  }
}
