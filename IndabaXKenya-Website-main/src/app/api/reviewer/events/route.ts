export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER EVENTS API (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reviewer/events - Get events assigned to reviewer

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Map JSONB permissions to boolean format
// ═══════════════════════════════════════════════════════════════════════════

interface JsonbPermissions {
  canViewApplications?: boolean
  canApprove?: boolean
  canReject?: boolean
  canViewPII?: boolean
  canViewSurveyResponses?: boolean
  canViewPaperSubmissions?: boolean
}

interface MappedPermissions {
  can_view: boolean
  can_review: boolean
  can_approve: boolean
  can_reject: boolean
}

function mapPermissions(jsonbPerms: JsonbPermissions): MappedPermissions {
  return {
    can_view: jsonbPerms.canViewApplications ?? false,
    can_review: jsonbPerms.canViewApplications ?? false, // Must be able to view to review
    can_approve: jsonbPerms.canApprove ?? false,
    can_reject: jsonbPerms.canReject ?? false,
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const adminSupabase = createAdminClient()

    // Issue #23 FIX: Update reviewer last_active_at
    await adminSupabase
      .from('reviewers')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Get reviewer assignments (with JSONB permissions column)
    const { data: assignments, error } = await adminSupabase
      .from('reviewers')
      .select(`
        event_id,
        permissions,
        events!inner (
          id,
          title,
          slug,
          start_date,
          end_date
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true) // Issue #17: Only active assignments
      .order('events(start_date)', { ascending: false })

    if (error) {
      console.error('Failed to fetch reviewer events:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assigned events' },
        { status: 500 }
      )
    }

    // Transform to include event details with mapped permissions
    const eventsWithPermissions = (assignments || []).map((assignment: any) => {
      const jsonbPerms = assignment.permissions as JsonbPermissions
      return {
        ...assignment.events,
        permissions: mapPermissions(jsonbPerms)
      }
    })

    return NextResponse.json({
      success: true,
      data: eventsWithPermissions
    })
  } catch (error) {
    console.error('Reviewer events error:', error)
    return handleError(error)
  }
}
