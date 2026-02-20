export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPLICANT DASHBOARD STATS API
// ═══════════════════════════════════════════════════════════════════════
// Get dashboard statistics for authenticated applicant
// Phase 2: Role-Based System

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

interface DashboardStats {
  activeApplications: number
  acceptedApplications: number
  rejectedApplications: number
  waitlistedApplications: number
  pendingReview: number
  profileCompleteness: number
}

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for authenticated user
 *
 * Returns:
 * - 200 OK: Dashboard statistics
 * - 401 Unauthorized: Not authenticated
 * - 500 Internal Error: Server error
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        },
        { status: 401 }
      )
    }

    // Get user profile to calculate completeness
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, name, phone, organization')
      .eq('id', user.id)
      .single()

    // Calculate profile completeness (only editable fields)
    let completeness = 0
    if (profile) {
      const fields = [profile.name, profile.phone, profile.organization]
      const filledFields = fields.filter(f => f && f.trim().length > 0).length
      completeness = Math.round((filledFields / fields.length) * 100)
    }

    // Get user's email from profile or auth
    const userEmail = profile?.email || user.email

    // Query form_responses table (the active table for applications)
    const { data: applications, error: appError } = await supabase
      .from('form_responses')
      .select('status_v2')
      .eq('respondent_email', userEmail)

    let activeApplications = 0
    let acceptedApplications = 0
    let rejectedApplications = 0
    let waitlistedApplications = 0
    let pendingReview = 0

    if (!appError && applications) {
      // Count applications by status_v2

      // Active: Applications currently being processed (pending, interested, shortlisted, surveys, waitlisted)
      activeApplications = applications.filter(a =>
        ['pending', 'interested', 'shortlisted', 'survey_sent', 'survey_completed', 'waitlisted'].includes(a.status_v2)
      ).length

      acceptedApplications = applications.filter(a => a.status_v2 === 'approved').length

      rejectedApplications = applications.filter(a => a.status_v2 === 'rejected').length

      waitlistedApplications = applications.filter(a => a.status_v2 === 'waitlisted').length

      // Pending Review: Submitted and awaiting initial review
      pendingReview = applications.filter(a =>
        ['pending', 'interested'].includes(a.status_v2)
      ).length
    }

    const stats: DashboardStats = {
      activeApplications,
      acceptedApplications,
      rejectedApplications,
      waitlistedApplications,
      pendingReview,
      profileCompleteness: completeness,
    }

    const response: ApiSuccessResponse<DashboardStats> = {
      success: true,
      data: stats,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
