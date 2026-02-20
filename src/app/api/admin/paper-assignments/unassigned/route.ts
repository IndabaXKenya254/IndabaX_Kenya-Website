// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - GET UNASSIGNED APPLICATIONS
// ═══════════════════════════════════════════════════════════════════════
// Returns applications that haven't been assigned to a specific reviewer
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const reviewerId = searchParams.get('reviewer_id')

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'event_id is required' },
        { status: 400 }
      )
    }

    // Get all applications for the event
    const { data: applications, error: appError } = await supabaseAdmin
      .from('form_responses')
      .select(`
        id,
        status,
        submitted_at,
        responses,
        user:user_profiles(id, email, full_name),
        template:form_templates!inner(id, event_id)
      `)
      .eq('template.event_id', eventId)
      .in('status', ['pending', 'submitted', 'shortlisted'])
      .order('submitted_at', { ascending: false })

    if (appError) throw appError

    // If reviewer_id provided, filter out already assigned applications
    let filteredApplications = applications || []

    if (reviewerId) {
      const { data: existingAssignments } = await supabaseAdmin
        .from('paper_assignments')
        .select('application_id')
        .eq('reviewer_id', reviewerId)

      const assignedIds = new Set((existingAssignments || []).map(a => a.application_id))
      filteredApplications = filteredApplications.filter(app => !assignedIds.has(app.id))
    }

    // Format the response
    // Note: Supabase returns joined data as arrays, so we need to extract the first element
    const formattedApplications = filteredApplications.map((app: any) => {
      const user = Array.isArray(app.user) ? app.user[0] : app.user
      const responses = app.responses as Record<string, any> | null
      return {
        id: app.id,
        status: app.status,
        submitted_at: app.submitted_at,
        user_email: user?.email || 'Unknown',
        user_name: user?.full_name || user?.email || 'Unknown',
        // Extract name from responses if available
        applicant_name: responses?.name || responses?.full_name || user?.full_name || user?.email || 'Unknown'
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedApplications,
      total: formattedApplications.length
    })
  } catch (error) {
    console.error('Error fetching unassigned applications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
