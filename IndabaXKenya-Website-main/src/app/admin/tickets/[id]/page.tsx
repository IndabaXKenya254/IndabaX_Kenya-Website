'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and manage individual ticket details

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface Ticket {
  id: string
  ticket_number: string
  ticket_type: string
  attendee_name: string
  attendee_email: string
  attendee_organization: string | null
  is_valid: boolean
  status: string
  qr_code_data: string
  pdf_url: string | null
  checked_in_at: string | null
  checked_in_by: string | null
  downloaded_at: string | null
  download_count: number
  generated_at: string
  created_at: string
  updated_at: string
  event: {
    id: string
    title: string
    slug: string
    start_date: string
    end_date: string
    location: string
    venue: string
  }
  user_profile?: {
    id: string
    name: string
    email: string
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createBrowserClient()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load ticket data
  useEffect(() => {
    loadTicket()
  }, [params.id])

  const loadTicket = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select(`
          *,
          event:events(id, title, slug, start_date, end_date, location, venue),
          user_profile:user_profiles(id, name, email)
        `)
        .eq('id', params.id)
        .single()

      if (fetchError) throw fetchError
      if (!data) throw new Error('Ticket not found')

      setTicket(data)

      // Generate QR code image - dynamically import to avoid SSR issues
      if (data.qr_code_data) {
        const QRCode = (await import('qrcode')).default
        const qrUrl = await QRCode.toDataURL(data.qr_code_data, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeUrl(qrUrl)
      }

    } catch (err: any) {
      console.error('Error loading ticket:', err)
      setError(err.message || 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  // Invalidate ticket
  const handleInvalidate = async () => {
    const confirmed = await showConfirm(
      'Invalidate Ticket?',
      'This will mark the ticket as invalid. The attendee will not be able to use it. Continue?'
    )

    if (!confirmed) return

    try {
      setUpdating(true)

      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          is_valid: false,
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      await showSuccess('Ticket Invalidated', 'The ticket has been marked as invalid')
      loadTicket()

    } catch (err: any) {
      console.error('Error invalidating ticket:', err)
      showError('Error', err.message || 'Failed to invalidate ticket')
    } finally {
      setUpdating(false)
    }
  }

  // Reactivate ticket
  const handleReactivate = async () => {
    const confirmed = await showConfirm(
      'Reactivate Ticket?',
      'This will restore the ticket to active status. Continue?'
    )

    if (!confirmed) return

    try {
      setUpdating(true)

      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          is_valid: true,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      await showSuccess('Ticket Reactivated', 'The ticket has been restored to active status')
      loadTicket()

    } catch (err: any) {
      console.error('Error reactivating ticket:', err)
      showError('Error', err.message || 'Failed to reactivate ticket')
    } finally {
      setUpdating(false)
    }
  }

  // Download PDF
  const handleDownloadPDF = () => {
    if (ticket?.pdf_url) {
      window.open(ticket.pdf_url, '_blank')
    } else {
      showError('PDF Not Available', 'The PDF file is not available for this ticket')
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading ticket details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !ticket) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid">
          <div className="alert alert-danger">
            <i className="icofont-warning me-2"></i>
            {error || 'Ticket not found'}
          </div>
          <Link href="/admin/tickets" className="btn btn-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Tickets
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link href="/admin/tickets" className="btn btn-link ps-0">
              <i className="icofont-arrow-left me-2"></i>
              Back to Tickets
            </Link>
            <h2 className="mb-0">Ticket Details</h2>
            <p className="text-muted mb-0">
              <code>{ticket.ticket_number}</code>
            </p>
          </div>
          <div className="d-flex gap-2">
            {ticket.is_valid ? (
              <button
                className="btn btn-danger"
                onClick={handleInvalidate}
                disabled={updating}
              >
                <i className="icofont-ban me-2"></i>
                Invalidate Ticket
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleReactivate}
                disabled={updating}
              >
                <i className="icofont-check-circled me-2"></i>
                Reactivate Ticket
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={!ticket.pdf_url}
            >
              <i className="icofont-download me-2"></i>
              Download PDF
            </button>
          </div>
        </div>

        <div className="row">
          {/* Left Column */}
          <div className="col-lg-8">
            {/* Status Badge */}
            <div className="mb-4">
              {ticket.is_valid ? (
                <span className="badge bg-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  <i className="icofont-check-circled me-2"></i>
                  Valid Ticket
                </span>
              ) : (
                <span className="badge bg-danger" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  <i className="icofont-ban me-2"></i>
                  Invalid Ticket
                </span>
              )}
              {ticket.checked_in_at && (
                <span className="badge bg-info ms-2" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  <i className="icofont-qr-code me-2"></i>
                  Checked In
                </span>
              )}
            </div>

            {/* Ticket Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Ticket Information</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Ticket Number</label>
                    <p className="mb-0">
                      <code className="text-primary" style={{ fontSize: '1.1rem' }}>
                        {ticket.ticket_number}
                      </code>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Ticket Type</label>
                    <p className="mb-0 text-capitalize">
                      <span className="badge bg-secondary">
                        {ticket.ticket_type || 'general'}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Status</label>
                    <p className="mb-0 text-capitalize">
                      <span className={`badge bg-${ticket.status === 'active' ? 'success' : ticket.status === 'used' ? 'secondary' : 'danger'}`}>
                        {ticket.status}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Generated</label>
                    <p className="mb-0">
                      {format(new Date(ticket.generated_at), 'PPP p')}
                      <br />
                      <small className="text-muted">
                        ({formatDistanceToNow(new Date(ticket.generated_at), { addSuffix: true })})
                      </small>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendee Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Attendee Information</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Name</label>
                    <p className="mb-0">
                      <strong>{ticket.attendee_name}</strong>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Email</label>
                    <p className="mb-0">
                      <a href={`mailto:${ticket.attendee_email}`}>
                        {ticket.attendee_email}
                      </a>
                    </p>
                  </div>
                  {ticket.attendee_organization && (
                    <div className="col-md-6 mb-3">
                      <label className="text-muted small">Organization</label>
                      <p className="mb-0">{ticket.attendee_organization}</p>
                    </div>
                  )}
                  {ticket.user_profile && (
                    <div className="col-md-6 mb-3">
                      <label className="text-muted small">User Profile</label>
                      <p className="mb-0">
                        <Link href={`/admin/users/${ticket.user_profile.id}`} className="text-primary">
                          View Profile
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Event Information</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small">Event</label>
                    <p className="mb-0">
                      <strong>{ticket.event?.title || 'N/A'}</strong>
                    </p>
                  </div>
                  {ticket.event?.start_date && (
                    <div className="col-md-6 mb-3">
                      <label className="text-muted small">Date</label>
                      <p className="mb-0">
                        {format(new Date(ticket.event.start_date), 'PPP')}
                        {ticket.event.end_date && ticket.event.end_date !== ticket.event.start_date && (
                          <> - {format(new Date(ticket.event.end_date), 'PPP')}</>
                        )}
                      </p>
                    </div>
                  )}
                  {ticket.event?.location && (
                    <div className="col-md-6 mb-3">
                      <label className="text-muted small">Location</label>
                      <p className="mb-0">{ticket.event.location}</p>
                    </div>
                  )}
                  {ticket.event?.venue && (
                    <div className="col-md-6 mb-3">
                      <label className="text-muted small">Venue</label>
                      <p className="mb-0">{ticket.event.venue}</p>
                    </div>
                  )}
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Actions</label>
                    <p className="mb-0">
                      <Link href={`/admin/events/${ticket.event?.id}`} className="btn btn-sm btn-outline-primary">
                        View Event Details
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Check-in Information</h5>
              </div>
              <div className="card-body">
                {ticket.checked_in_at ? (
                  <div className="alert alert-success">
                    <i className="icofont-check-circled me-2"></i>
                    <strong>Checked In</strong>
                    <p className="mb-0 mt-2">
                      Time: {format(new Date(ticket.checked_in_at), 'PPP p')}
                      <br />
                      <small className="text-muted">
                        ({formatDistanceToNow(new Date(ticket.checked_in_at), { addSuffix: true })})
                      </small>
                    </p>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <i className="icofont-info-circle me-2"></i>
                    This ticket has not been checked in yet.
                  </div>
                )}
              </div>
            </div>

            {/* Download History */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Download History</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Download Count</label>
                    <p className="mb-0">
                      <strong>{ticket.download_count || 0}</strong> {ticket.download_count === 1 ? 'time' : 'times'}
                    </p>
                  </div>
                  {ticket.downloaded_at && (
                    <div className="col-md-6 mb-3">
                      <label className="text-muted small">Last Downloaded</label>
                      <p className="mb-0">
                        {format(new Date(ticket.downloaded_at), 'PPP p')}
                        <br />
                        <small className="text-muted">
                          ({formatDistanceToNow(new Date(ticket.downloaded_at), { addSuffix: true })})
                        </small>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: '90px', zIndex: 100 }}>
              <div className="card-header">
                <h5 className="mb-0">QR Code</h5>
              </div>
              <div className="card-body text-center">
                {qrCodeUrl ? (
                  <>
                    <img
                      src={qrCodeUrl}
                      alt="Ticket QR Code"
                      className="img-fluid mb-3"
                      style={{ maxWidth: '300px' }}
                    />
                    <p className="text-muted small mb-0">
                      Scan this code at event check-in
                    </p>
                  </>
                ) : (
                  <div className="text-muted py-5">
                    <i className="icofont-qr-code" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3">QR Code not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
