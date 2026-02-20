'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET VIEW PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and download event ticket

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'
import QRCode from 'qrcode'

interface Ticket {
  id: string
  ticket_number: string
  qr_code_data: string
  is_valid: boolean
  status: string
  generated_at: string
  downloaded_at: string | null
  checked_in_at: string | null
  // Issue #7 FIX: Add attendee information
  attendee_name: string | null
  attendee_email: string | null
  attendee_organization: string | null
  ticket_type: string | null
  events: {
    id: string
    slug: string
    title: string
    description: string
    start_date: string | null
    end_date: string | null
    location: string | null
    featured_image: string | null
  }
}

export default function TicketViewPage() {
  const params = useParams()
  const ticketId = params.ticketId as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      const response = await fetch('/api/user/tickets')
      const result = await response.json()

      if (result.success) {
        const foundTicket = result.data.find((t: Ticket) => t.id === ticketId)
        if (foundTicket) {
          setTicket(foundTicket)
          // Generate QR code with high error correction
          const qrUrl = await QRCode.toDataURL(foundTicket.qr_code_data, {
            width: 400,
            margin: 4,
            errorCorrectionLevel: 'H',  // Highest error correction (30% recovery)
            type: 'image/png',
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          setQrCodeUrl(qrUrl)
        } else {
          setError('Ticket not found')
        }
      } else {
        setError(result.error || 'Failed to fetch ticket')
      }
    } catch (err) {
      console.error('Error fetching ticket:', err)
      setError('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  // Issue #29 FIX: Use consistent timezone (East Africa Time) across all pages
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA'
    return new Date(dateStr).toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Nairobi',
    })
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'TBA'
    return new Date(dateStr).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi',
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your ticket...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !ticket) {
    return (
      <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
        <div className="container-fluid">
          <div className="alert alert-danger" role="alert">
            <i className="icofont-warning me-2"></i>
            {error || 'Ticket not found'}
          </div>
          <Link href="/dashboard/applications" className="btn btn-primary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Applications
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  // Handle case where events relation is not loaded
  if (!ticket.events) {
    return (
      <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
        <div className="container-fluid">
          <div className="alert alert-warning" role="alert">
            <i className="icofont-warning me-2"></i>
            Ticket found but event details are unavailable. Please contact support.
          </div>
          <Link href="/dashboard/tickets" className="btn btn-primary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Tickets
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4 no-print">
          <div className="col-12">
            <Link href="/dashboard/applications" className="btn btn-sm btn-outline-secondary mb-3">
              <i className="icofont-arrow-left me-2"></i>
              Back to Applications
            </Link>
            <h2 className="mb-2">Event Ticket</h2>
            <p className="text-muted">
              Present this ticket at the event for check-in
            </p>
          </div>
        </div>

        {/* Ticket Card */}
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg">
              <div className="card-body p-4">
                {/* Status Badge */}
                <div className="text-end mb-3">
                  {ticket.status === 'checked_in' ? (
                    <span className="badge bg-info fs-6">
                      <i className="icofont-check-circled me-1"></i>
                      Checked In
                    </span>
                  ) : ticket.status === 'cancelled' ? (
                    <span className="badge bg-danger fs-6">
                      <i className="icofont-close-circled me-1"></i>
                      Cancelled
                    </span>
                  ) : ticket.is_valid ? (
                    <span className="badge bg-success fs-6">
                      <i className="icofont-verification-check me-1"></i>
                      Valid Ticket
                    </span>
                  ) : (
                    <span className="badge bg-danger fs-6">
                      <i className="icofont-close-circled me-1"></i>
                      Invalid
                    </span>
                  )}
                </div>

                {/* Event Details */}
                <div className="text-center mb-4">
                  <h3 className="mb-3">{ticket.events.title}</h3>

                  {/* Issue #7 FIX: Display attendee name prominently */}
                  {ticket.attendee_name && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <div className="text-muted small mb-1">ATTENDEE</div>
                      <h4 className="mb-1 text-primary">{ticket.attendee_name}</h4>
                      {ticket.attendee_organization && (
                        <div className="text-muted small">{ticket.attendee_organization}</div>
                      )}
                      {ticket.ticket_type && (
                        <span className="badge bg-secondary mt-2 text-capitalize">
                          {ticket.ticket_type} Ticket
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mb-2">
                    <i className="icofont-calendar text-primary me-2"></i>
                    <strong>{formatDate(ticket.events.start_date)}</strong>
                  </div>
                  {ticket.events.start_date && (
                    <div className="mb-2">
                      <i className="icofont-clock-time text-primary me-2"></i>
                      {formatTime(ticket.events.start_date)}
                    </div>
                  )}
                  {ticket.events.location && (
                    <div className="mb-2">
                      <i className="icofont-location-pin text-primary me-2"></i>
                      {ticket.events.location}
                    </div>
                  )}
                </div>

                <hr />

                {/* QR Code */}
                <div className="text-center my-4">
                  {qrCodeUrl && (
                    <div className="position-relative d-inline-block">
                      <img
                        src={qrCodeUrl}
                        alt="Ticket QR Code"
                        className={`img-fluid ${ticket.status === 'checked_in' ? 'opacity-50' : ''}`}
                        style={{ maxWidth: '300px' }}
                      />
                      {/* Checked In Overlay */}
                      {ticket.status === 'checked_in' && (
                        <div
                          className="position-absolute top-50 start-50 translate-middle"
                          style={{
                            backgroundColor: 'rgba(25, 135, 84, 0.9)',
                            padding: '15px 25px',
                            borderRadius: '8px',
                            transform: 'translate(-50%, -50%) rotate(-15deg)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i className="icofont-check-circled text-white" style={{ fontSize: '24px' }}></i>
                            <span className="text-white fw-bold" style={{ fontSize: '18px', letterSpacing: '2px' }}>
                              CHECKED IN
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-3 text-muted small">
                    {ticket.status === 'checked_in'
                      ? 'This ticket has already been used for check-in'
                      : 'Scan this QR code at the event entrance'
                    }
                  </p>
                </div>

                <hr />

                {/* Ticket Information */}
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Ticket Number:</strong><br />
                      <code className="fs-5">{ticket.ticket_number}</code>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Issued:</strong><br />
                      {formatDate(ticket.generated_at)}
                    </p>
                  </div>
                </div>

                {ticket.checked_in_at && (
                  <div className="alert alert-success mt-3">
                    <i className="icofont-check-circled me-2"></i>
                    <strong>Checked In:</strong> {formatDate(ticket.checked_in_at)}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 text-center no-print">
                  <button
                    onClick={handlePrint}
                    className="btn btn-primary btn-lg"
                  >
                    <i className="icofont-print me-2"></i>
                    Print Ticket
                  </button>
                </div>

                {/* Footer */}
                <div className="text-center mt-4 pt-3 border-top">
                  <p className="text-muted small mb-0">
                    Please bring a valid ID to the event. This ticket is non-transferable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .admin-sidebar,
          .admin-header {
            display: none !important;
          }
          .admin-content {
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </DashboardLayout>
  )
}
