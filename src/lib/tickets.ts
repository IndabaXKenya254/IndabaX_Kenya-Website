// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET GENERATION UTILITY
// ═══════════════════════════════════════════════════════════════════════
// Generate event tickets with QR codes for accepted applicants

import { createAdminClient } from '@/lib/supabase'

interface TicketData {
  ticketNumber: string
  qrCodeData: string
  eventId: string
  userId: string
  registrationId: string
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  eventDate: string
  eventLocation: string
}

/**
 * Generate a unique ticket number
 * Format: EVT-YYYY-XXXXX (e.g., EVT-2025-00123)
 */
export function generateTicketNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return `EVT-${year}-${random}`
}

/**
 * Generate QR code data (JSON string to be encoded)
 */
export function generateQRCodeData(ticket: {
  ticketNumber: string
  eventId: string
  userId: string
  attendeeName: string
  attendeeEmail: string
}): string {
  return JSON.stringify({
    type: 'INDABAX_TICKET',  // Required by check-in API validation
    ticket: ticket.ticketNumber,
    event: ticket.eventId,
    user: ticket.userId,
    name: ticket.attendeeName,
    email: ticket.attendeeEmail,
    issued: new Date().toISOString(),
  })
}

/**
 * Create a ticket in the database
 */
export async function createTicket(params: {
  eventId: string
  userId: string | null
  registrationId: string | null  // Can be null for paper-based tickets
  paperId?: string | null        // For speaker tickets from approved papers
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  eventDate: string | null
  eventLocation: string | null
  ticketType?: 'general' | 'vip' | 'speaker' | 'organizer'  // Type of ticket
}): Promise<{ success: boolean; ticket?: any; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Check if a valid (active) ticket already exists for this registration or paper
    // NOTE: Skip revoked/invalid tickets so a NEW ticket is generated on re-approval
    if (params.registrationId) {
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('*')
        .eq('registration_id', params.registrationId)
        .eq('is_valid', true)
        .eq('status', 'active')
        .maybeSingle()

      if (existingTicket) {
        return {
          success: true,
          ticket: existingTicket,
        }
      }
    }

    // For paper-based tickets, check by paper_id
    if (params.paperId) {
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('*')
        .eq('paper_id', params.paperId)
        .eq('is_valid', true)
        .eq('status', 'active')
        .maybeSingle()

      if (existingTicket) {
        return {
          success: true,
          ticket: existingTicket,
        }
      }
    }

    // Generate ticket number and QR code data
    const ticketNumber = generateTicketNumber()
    const qrCodeData = generateQRCodeData({
      ticketNumber,
      eventId: params.eventId,
      userId: params.userId || '',
      attendeeName: params.attendeeName,
      attendeeEmail: params.attendeeEmail,
    })

    // Create ticket record
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        event_id: params.eventId,
        user_id: params.userId,
        registration_id: params.registrationId,
        paper_id: params.paperId || null,
        ticket_number: ticketNumber,
        qr_code_data: qrCodeData,
        ticket_type: params.ticketType || 'general',
        attendee_name: params.attendeeName || 'Guest',  // Required field
        attendee_email: params.attendeeEmail || '',     // Required field
        is_valid: true,
        status: 'active',
        generated_at: new Date().toISOString(),
        download_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      ticket,
    }
  } catch (error) {
    console.error('Ticket generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate tickets for multiple registrations (bulk)
 */
export async function createTicketsBulk(registrations: Array<{
  registrationId: string
  eventId: string
  userId: string | null
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  eventDate: string | null
  eventLocation: string | null
}>): Promise<{
  success: number
  failed: number
  total: number
  results: Array<{ registrationId: string; success: boolean; ticketNumber?: string; error?: string }>
}> {
  const results = {
    success: 0,
    failed: 0,
    total: registrations.length,
    results: [] as Array<{ registrationId: string; success: boolean; ticketNumber?: string; error?: string }>,
  }

  for (const reg of registrations) {
    const result = await createTicket(reg)

    if (result.success && result.ticket) {
      results.success++
      results.results.push({
        registrationId: reg.registrationId,
        success: true,
        ticketNumber: result.ticket.ticket_number,
      })
    } else {
      results.failed++
      results.results.push({
        registrationId: reg.registrationId,
        success: false,
        error: result.error,
      })
    }
  }

  return results
}

/**
 * Invalidate a ticket (for cancellations or refunds)
 */
export async function invalidateTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('tickets')
      .update({
        is_valid: false,
        status: 'cancelled',
      })
      .eq('id', ticketId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Record ticket download
 */
export async function recordTicketDownload(ticketId: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    await supabase.rpc('increment_ticket_download', { ticket_id: ticketId })

    // If RPC doesn't exist, fallback to manual increment
    const { data: ticket } = await supabase
      .from('tickets')
      .select('download_count')
      .eq('id', ticketId)
      .single()

    if (ticket) {
      await supabase
        .from('tickets')
        .update({
          download_count: (ticket.download_count || 0) + 1,
          downloaded_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
    }
  } catch (error) {
    console.error('Error recording ticket download:', error)
  }
}
