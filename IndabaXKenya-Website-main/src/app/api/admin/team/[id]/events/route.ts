export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TEAM MEMBER EVENTS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/team/[id]/events - Get linked events for a team member

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/admin/team/[id]/events
 * Get all events linked to a team member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params

    // Fetch linked events from junction table
    const { data, error } = await supabase
      .from('event_team_members')
      .select('event_id, display_order')
      .eq('team_member_id', id)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Team member events fetch error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data || [],
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
