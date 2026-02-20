export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ANALYTICS API (PHASE 9)
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/analytics - Get registration analytics and funnel data

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Get analytics data
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createAdminClient()

    const { searchParams } = request.nextUrl
    const eventId = searchParams.get('event_id')
    const period = searchParams.get('period') || '30' // days

    // ═══════════════════════════════════════════════════════════════════
    // 1. FUNNEL DATA - Registration Pipeline
    // ═══════════════════════════════════════════════════════════════════

    let registrationsQuery = supabase
      .from('form_responses')
      .select('id, status, status_v2, response_type, created_at, completed_at')

    if (eventId) {
      registrationsQuery = registrationsQuery.eq('event_id', eventId)
    }

    const { data: registrations, error: regError } = await registrationsQuery

    if (regError) {
      console.error('Registrations query error:', regError)
    }

    // Calculate funnel stages
    const allRegistrations = registrations || []

    // Type for registration records
    type Registration = {
      id: string
      status: string | null
      status_v2: string | null
      response_type: string | null
      created_at: string | null
      completed_at: string | null
    }

    const funnel: Record<string, number> = {
      interested: allRegistrations.filter((r: Registration) =>
        r.response_type === 'initial_interest' || !r.response_type
      ).length,
      shortlisted: allRegistrations.filter((r: Registration) =>
        r.status_v2 === 'shortlisted' || r.status_v2 === 'survey_sent'
      ).length,
      surveyCompleted: allRegistrations.filter((r: Registration) =>
        r.status_v2 === 'survey_completed'
      ).length,
      accepted: allRegistrations.filter((r: Registration) =>
        r.status === 'approved' || r.status_v2 === 'approved'
      ).length,
      rejected: allRegistrations.filter((r: Registration) =>
        r.status === 'rejected' || r.status_v2 === 'rejected'
      ).length,
      pending: allRegistrations.filter((r: Registration) =>
        r.status === 'pending' || r.status_v2 === 'pending' || r.status_v2 === 'submitted'
      ).length
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. TICKETS DATA
    // ═══════════════════════════════════════════════════════════════════

    let ticketsQuery = supabase
      .from('tickets')
      .select('id, status, created_at, checked_in_at')

    if (eventId) {
      ticketsQuery = ticketsQuery.eq('event_id', eventId)
    }

    const { data: tickets } = await ticketsQuery

    type Ticket = {
      id: string
      status: string | null
      created_at: string | null
      checked_in_at: string | null
    }

    const ticketStats = {
      total: tickets?.length || 0,
      checkedIn: tickets?.filter((t: Ticket) => t.status === 'checked_in').length || 0,
      active: tickets?.filter((t: Ticket) => t.status === 'active').length || 0
    }

    funnel.ticketed = ticketStats.total
    funnel.checkedIn = ticketStats.checkedIn

    // ═══════════════════════════════════════════════════════════════════
    // 3. TIMELINE DATA - Registrations over time
    // ═══════════════════════════════════════════════════════════════════

    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Group registrations by date
    const timelineMap = new Map<string, number>()

    allRegistrations.forEach((reg: Registration) => {
      if (reg.created_at) {
        const date = new Date(reg.created_at).toISOString().split('T')[0]
        timelineMap.set(date, (timelineMap.get(date) || 0) + 1)
      }
    })

    // Fill in missing dates
    const timeline: { date: string; count: number; cumulative: number }[] = []
    let cumulative = 0

    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const count = timelineMap.get(dateStr) || 0
      cumulative += count
      timeline.push({ date: dateStr, count, cumulative })
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. REVIEWER PERFORMANCE
    // ═══════════════════════════════════════════════════════════════════

    // Get reviews by admin
    const { data: reviews } = await supabase
      .from('form_responses')
      .select('reviewed_by, reviewed_at, shortlisted_by, shortlisted_at')
      .not('reviewed_by', 'is', null)

    type ReviewRecord = {
      reviewed_by: string | null
      reviewed_at: string | null
      shortlisted_by: string | null
      shortlisted_at: string | null
    }

    const reviewerMap = new Map<string, { reviews: number; shortlists: number }>()

    reviews?.forEach((r: ReviewRecord) => {
      if (r.reviewed_by) {
        const current = reviewerMap.get(r.reviewed_by) || { reviews: 0, shortlists: 0 }
        current.reviews++
        reviewerMap.set(r.reviewed_by, current)
      }
      if (r.shortlisted_by) {
        const current = reviewerMap.get(r.shortlisted_by) || { reviews: 0, shortlists: 0 }
        current.shortlists++
        reviewerMap.set(r.shortlisted_by, current)
      }
    })

    // Get reviewer names
    const reviewerIds = Array.from(reviewerMap.keys())
    const { data: reviewerProfiles } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .in('id', reviewerIds)

    type UserProfile = {
      id: string
      name: string | null
      email: string | null
    }

    const reviewerPerformance = reviewerIds.map(id => {
      const profile = reviewerProfiles?.find((p: UserProfile) => p.id === id)
      const stats = reviewerMap.get(id) || { reviews: 0, shortlists: 0 }
      return {
        id,
        name: profile?.name || profile?.email || 'Unknown',
        email: profile?.email || '',
        reviews: stats.reviews,
        shortlists: stats.shortlists
      }
    }).sort((a, b) => b.reviews - a.reviews)

    // ═══════════════════════════════════════════════════════════════════
    // 5. SUMMARY STATS
    // ═══════════════════════════════════════════════════════════════════

    const summary = {
      totalApplications: allRegistrations.length,
      acceptanceRate: allRegistrations.length > 0
        ? Math.round((funnel.accepted / allRegistrations.length) * 100)
        : 0,
      conversionRate: funnel.interested > 0
        ? Math.round((funnel.accepted / funnel.interested) * 100)
        : 0,
      attendanceRate: ticketStats.total > 0
        ? Math.round((ticketStats.checkedIn / ticketStats.total) * 100)
        : 0,
      avgReviewTime: 0, // TODO: Calculate from review timestamps
      pendingReviews: funnel.pending
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. RETURN DATA
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      data: {
        funnel,
        timeline,
        ticketStats,
        reviewerPerformance,
        summary
      }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return handleError(error)
  }
}
