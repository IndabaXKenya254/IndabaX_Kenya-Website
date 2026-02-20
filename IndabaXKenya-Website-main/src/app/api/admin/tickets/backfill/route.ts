export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - BACKFILL TICKETS API
// ═══════════════════════════════════════════════════════════════════════
// Generate tickets for approved applications that don't have tickets yet

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createTicket } from '@/lib/tickets'

/**
 * POST /api/admin/tickets/backfill
 * Generate tickets for all approved applications that don't have tickets
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const adminClient = createAdminClient()

    // Find all approved applications without tickets
    const { data: approvedApps, error: fetchError } = await adminClient
      .from('form_responses')
      .select(`
        id,
        event_id,
        respondent_name,
        respondent_email,
        status_v2,
        events (
          id,
          title,
          start_date,
          location
        )
      `)
      .eq('status_v2', 'approved')

    if (fetchError) {
      console.error('Error fetching approved applications:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch approved applications' },
        { status: 500 }
      )
    }

    if (!approvedApps || approvedApps.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No approved applications found',
        data: { total: 0, generated: 0, existing: 0, failed: 0 }
      })
    }

    // Check which ones already have tickets
    const appIds = approvedApps.map((a: any) => a.id)
    const { data: existingTickets } = await adminClient
      .from('tickets')
      .select('registration_id')
      .in('registration_id', appIds)

    const existingTicketIds = new Set(existingTickets?.map((t: any) => t.registration_id) || [])

    // Filter to only apps without tickets
    const appsNeedingTickets = approvedApps.filter((app: any) => !existingTicketIds.has(app.id))

    let generated = 0
    let failed = 0

    // Generate tickets for each
    for (const app of appsNeedingTickets) {
      const event = app.events as any

      const result = await createTicket({
        eventId: app.event_id,
        userId: null,
        registrationId: app.id,
        attendeeName: app.respondent_name || 'Guest',
        attendeeEmail: app.respondent_email || '',
        eventTitle: event?.title || 'Event',
        eventDate: event?.start_date || null,
        eventLocation: event?.location || null,
      })

      if (result.success) {
        generated++
        console.log(`✓ Generated ticket for ${app.respondent_email}`)
      } else {
        failed++
        console.error(`✗ Failed to generate ticket for ${app.respondent_email}:`, result.error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfill complete: ${generated} tickets generated, ${existingTicketIds.size} already existed, ${failed} failed`,
      data: {
        total: approvedApps.length,
        generated,
        existing: existingTicketIds.size,
        failed
      }
    })
  } catch (error) {
    console.error('Ticket backfill error:', error)
    return handleError(error)
  }
}
