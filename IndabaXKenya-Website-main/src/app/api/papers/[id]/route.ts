export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - INDIVIDUAL PAPER API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/papers/[id] - Get paper details
// PATCH /api/papers/[id] - Update paper status (review)
// Phase 9: Paper Submission & Review

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { createTicket } from '@/lib/tickets'
import { sendPaperApprovedEmail, sendPaperRejectedEmail } from '@/lib/email/send-paper-email'
import { getSiteUrl } from '@/lib/config'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/papers/[id]
 * Get paper details with full information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user is admin, reviewer, or the paper owner
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdminOrReviewer = profile && ['admin', 'reviewer'].includes(profile.role || '')

    // Get paper with related data
    const { data: paper, error } = await supabase
      .from('papers')
      .select(`
        *,
        user_profiles:user_id (id, name, email),
        events:event_id (id, title, slug),
        reviewer:reviewed_by (id, name, email),
        registrations:registration_id (id, status_v2)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Paper not found' } },
          { status: 404 }
        )
      }
      console.error('Paper query error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Only allow access to owner or admin/reviewer
    if (!isAdminOrReviewer && paper.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: paper
    })
  } catch (error) {
    console.error('Paper API error:', error)
    return handleError(error)
  }
}

/**
 * PATCH /api/papers/[id]
 * Update paper status (for review)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user is admin or reviewer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'reviewer'].includes(profile.role || '')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or reviewer access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, review_notes, rating } = body

    // Validate status
    const validStatuses = ['submitted', 'under_review', 'approved', 'rejected']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` } },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status

      // Set review fields when reviewing
      if (status === 'under_review') {
        updateData.reviewed_by = user.id
      } else if (status === 'approved' || status === 'rejected') {
        updateData.reviewed_by = user.id
        updateData.reviewed_at = new Date().toISOString()
      }
    }

    if (review_notes !== undefined) {
      updateData.review_notes = review_notes
    }

    if (rating !== undefined) {
      updateData.rating = rating
    }

    // Update paper
    const { data, error } = await supabase
      .from('papers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user_profiles:user_id (id, name, email),
        events:event_id (id, title, slug, start_date, location),
        reviewer:reviewed_by (id, name, email)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Paper not found' } },
          { status: 404 }
        )
      }
      console.error('Paper update error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Generate speaker ticket when paper is approved
    let ticketGenerated = false
    let ticketNumber: string | undefined
    let emailSent = false

    const userProfile = data?.user_profiles as any
    const event = data?.events as any

    if (status === 'approved' && data) {
      try {
        const ticketResult = await createTicket({
          eventId: data.event_id,
          userId: data.user_id,
          registrationId: null, // Papers don't have registrations
          paperId: data.id,     // Link to paper instead
          attendeeName: userProfile?.name || 'Speaker',
          attendeeEmail: userProfile?.email || '',
          eventTitle: event?.title || 'IndabaX Kenya Event',
          eventDate: event?.start_date || null,
          eventLocation: event?.location || null,
          ticketType: 'speaker', // Speaker ticket type
        })

        if (ticketResult.success && ticketResult.ticket) {
          ticketGenerated = true
          ticketNumber = ticketResult.ticket.ticket_number
          console.log(`Speaker ticket generated for paper ${id}: ${ticketNumber}`)

          // Send approval email with ticket info
          try {
            const baseUrl = getSiteUrl()
            emailSent = await sendPaperApprovedEmail({
              to: userProfile?.email || '',
              authorName: userProfile?.name || 'Speaker',
              paperTitle: data.title,
              eventTitle: event?.title || 'IndabaX Kenya Event',
              eventDate: event?.start_date || null,
              eventLocation: event?.location || null,
              ticketNumber: ticketNumber!, // Guaranteed to be string here
              ticketLink: `${baseUrl}/tickets/${ticketResult.ticket.id}`,
              rating: data.rating,
              reviewNotes: data.review_notes,
            })
            if (emailSent) {
              console.log(`Approval email sent to ${userProfile?.email} for paper ${id}`)
            }
          } catch (emailError) {
            console.error('Error sending approval email:', emailError)
          }
        } else {
          console.error(`Failed to generate speaker ticket for paper ${id}:`, ticketResult.error)
        }
      } catch (ticketError) {
        console.error('Error generating speaker ticket:', ticketError)
        // Don't fail the whole operation if ticket generation fails
      }
    }

    // Send rejection email when paper is rejected
    if (status === 'rejected' && data && userProfile?.email) {
      try {
        const baseUrl = getSiteUrl()
        emailSent = await sendPaperRejectedEmail({
          to: userProfile.email,
          authorName: userProfile?.name || 'Author',
          paperTitle: data.title,
          eventTitle: event?.title || 'IndabaX Kenya Event',
          eventUrl: `${baseUrl}/events/${event?.slug || ''}`,
          reviewNotes: data.review_notes,
        })
        if (emailSent) {
          console.log(`Rejection email sent to ${userProfile.email} for paper ${id}`)
        }
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      data,
      ticketGenerated,
      ticketNumber,
      emailSent,
      message: `Paper ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'} successfully${ticketGenerated ? '. Speaker ticket generated.' : ''}${emailSent ? ' Email notification sent.' : ''}`
    })
  } catch (error) {
    console.error('Paper update API error:', error)
    return handleError(error)
  }
}
