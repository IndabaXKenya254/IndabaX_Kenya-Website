export const dynamic = 'force-dynamic'

// Issue #21: Check if current user has reviewer access
// Used by DashboardLayout to show portal switch button
// Also checks if a reviewer has applicant data (form_responses) for Switch to Applicant

import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, isReviewer: false, hasApplicantData: false })
    }

    const adminSupabase = createAdminClient()

    // Issue #21 FIX: Check BOTH reviewers table AND user_profiles.role
    // User is a reviewer if:
    // 1. They have an entry in the reviewers table (event assignment), OR
    // 2. They have role='reviewer' in user_profiles (may have lost assignment due to event deletion)
    const [
      { data: assignment },
      { data: userProfile },
      { data: formResponses }
    ] = await Promise.all([
      // Check reviewers table
      adminSupabase
        .from('reviewers')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(),
      // Check user_profiles.role
      adminSupabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', user.id)
        .single(),
      // Check if user has applicant data (form_responses) for Switch to Applicant
      adminSupabase
        .from('form_responses')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
    ])

    const isReviewer = !!assignment || userProfile?.role === 'reviewer'
    const hasApplicantData = !!formResponses

    return NextResponse.json({
      success: true,
      isReviewer,
      hasApplicantData,
      // Additional info for debugging
      hasReviewerAssignment: !!assignment,
      profileRole: userProfile?.role || null,
    })
  } catch (err) {
    console.error('Error checking reviewer status:', err)
    return NextResponse.json({ success: false, isReviewer: false, hasApplicantData: false })
  }
}
