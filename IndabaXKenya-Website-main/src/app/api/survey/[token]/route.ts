export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SURVEY TOKEN VALIDATION API (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════
// Validate survey access token and return form data

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

/**
 * GET /api/survey/[token]
 * Validate survey access token and return survey data
 *
 * Returns:
 * - 200: Valid token, return form response + template
 * - 404: Invalid token
 * - 410: Survey already completed
 * - 410: Survey deadline expired
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServerClient()
    const { token } = params

    // ═══════════════════════════════════════════════════════════════════
    // 1. Find form_response by access_token
    // ═══════════════════════════════════════════════════════════════════

    const { data: formResponse, error: responseError } = await supabase
      .from('form_responses')
      .select(`
        id,
        template_id,
        event_id,
        user_id,
        respondent_name,
        respondent_email,
        response_type,
        status,
        status_v2,
        responses,
        is_complete,
        created_at,
        completed_at,
        deadline_at,
        last_saved_at,
        completion_percentage,
        events (
          id,
          title,
          slug,
          start_date,
          end_date
        ),
        form_templates (
          id,
          name,
          description,
          usage_type
        )
      `)
      .eq('access_token', token)
      .single()

    if (responseError || !formResponse) {
      console.error('Survey token lookup failed:', responseError)
      return NextResponse.json(
        { success: false, error: 'Invalid survey link' },
        { status: 404 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Check if survey already completed
    // ═══════════════════════════════════════════════════════════════════

    // IMPORTANT: For old-style shortlisting, the application record is reused for survey
    // - `status = 'completed'` means the INITIAL APPLICATION was completed (ignore this)
    // - `status_v2 = 'survey_completed'` means the SURVEY was completed (check this)
    // Only check status_v2 for survey completion, NOT the old status field
    const isSurveyCompleted = formResponse.status_v2 === 'survey_completed'

    if (isSurveyCompleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Survey already completed',
          message: 'You have already submitted this survey. Thank you for your response!',
          completed_at: formResponse.completed_at
        },
        { status: 410 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Check if deadline expired
    // ═══════════════════════════════════════════════════════════════════

    if (formResponse.deadline_at) {
      const deadline = new Date(formResponse.deadline_at)
      const now = new Date()

      if (now > deadline) {
        return NextResponse.json(
          {
            success: false,
            error: 'Survey deadline expired',
            message: `This survey expired on ${deadline.toLocaleDateString()}. Please contact us if you need an extension.`,
            deadline: formResponse.deadline_at
          },
          { status: 410 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Fetch template questions
    // ═══════════════════════════════════════════════════════════════════

    const { data: questions, error: questionsError } = await supabase
      .from('form_questions')
      .select('*')
      .eq('template_id', formResponse.template_id)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Failed to fetch questions:', questionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to load survey questions' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Fetch existing answers (for resume) or use responses JSON
    // ═══════════════════════════════════════════════════════════════════

    // First try form_answers table
    const { data: answers, error: answersError } = await supabase
      .from('form_answers')
      .select('*')
      .eq('response_id', formResponse.id)

    if (answersError) {
      console.error('Failed to fetch answers:', answersError)
    }

    // If no answers in form_answers, use responses JSON field
    let answerData = answers || []
    if (answerData.length === 0 && formResponse.responses && Object.keys(formResponse.responses).length > 0) {
      // Convert responses JSON to answer format for FormRenderer
      answerData = Object.entries(formResponse.responses).map(([questionId, value]) => ({
        question_id: questionId,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }))
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. Calculate time remaining
    // ═══════════════════════════════════════════════════════════════════

    let timeRemaining = null
    if (formResponse.deadline_at) {
      const deadline = new Date(formResponse.deadline_at)
      const now = new Date()
      timeRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000))
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. Return survey data
    // ═══════════════════════════════════════════════════════════════════

    // form_templates is returned as array from Supabase, get first item
    const template = Array.isArray(formResponse.form_templates)
      ? formResponse.form_templates[0]
      : formResponse.form_templates

    // Transform template to expected format
    const templateData = template ? {
      id: template.id,
      title: template.name,
      description: template.description,
      allow_resume: true,
      show_progress_bar: true
    } : null

    return NextResponse.json({
      success: true,
      data: {
        response: {
          ...formResponse,
          deadline: formResponse.deadline_at  // Map for frontend compatibility
        },
        template: templateData,
        questions: questions || [],
        answers: answerData,
        event: formResponse.events,
        user: {
          full_name: formResponse.respondent_name,
          email: formResponse.respondent_email
        },
        timeRemaining,
        canResume: true,
        showProgress: true
      }
    })
  } catch (error) {
    console.error('Survey token validation error:', error)
    return handleError(error)
  }
}
