export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER APPLICATIONS API
// ═══════════════════════════════════════════════════════════════════════
// Fetch applications for the currently logged-in user

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * GET /api/user/applications
 * Fetches all applications for the currently authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch user's email from user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const email = profile?.email || user.email

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      )
    }

    // Fetch all form responses (applications) for this user
    const { data: applications, error } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        template_id,
        status,
        status_v2,
        respondent_name,
        respondent_email,
        response_type,
        started_at,
        completed_at,
        is_complete,
        reviewed_at,
        reviewed_by,
        review_notes,
        approved_at,
        approved_by,
        rejected_at,
        rejected_by,
        shortlisted_by,
        waitlisted_at,
        rejection_reason,
        decision_notes,
        events (
          id,
          slug,
          title,
          description,
          start_date,
          end_date,
          location,
          featured_image,
          registration_deadline,
          registration_enabled
        )
      `)
      .eq('respondent_email', email)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching user applications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: applications || []
    })
  } catch (error) {
    console.error('User applications API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
