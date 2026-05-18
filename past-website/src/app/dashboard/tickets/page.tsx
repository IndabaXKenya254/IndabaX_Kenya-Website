'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - MY TICKETS PAGE
// ═══════════════════════════════════════════════════════════════════════
// View all tickets for the current user

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import Link from 'next/link'

interface Ticket {
  id: string
  ticket_number: string
  qr_code_data: string
  is_valid: boolean
  status: string
  ticket_type: string | null
  paper_id: string | null
  generated_at: string
  downloaded_at: string | null
  checked_in_at: string | null
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

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/user/tickets')
      const result = await response.json()

      if (result.success) {
        setTickets(result.data)
      } else {
        setError(result.error || 'Failed to fetch tickets')
      }
    } catch (err) {
      console.error('Error fetching tickets:', err)
      setError('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  // Issue #29 FIX: Use consistent timezone (East Africa Time) across all pages
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA'
    return new Date(dateStr).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Nairobi',
    })
  }

  const getStatusBadge = (ticket: Ticket) => {
    if (!ticket.is_valid) {
      return <span className="badge bg-danger">Invalid</span>
    }

    switch (ticket.status) {
      case 'active':
        return <span className="badge bg-success">Active</span>
      case 'checked_in':
        return <span className="badge bg-info">Checked In</span>
      case 'cancelled':
        return <span className="badge bg-danger">Cancelled</span>
      case 'expired':
        return <span className="badge bg-secondary">Expired</span>
      default:
        return <span className="badge bg-secondary">{ticket.status}</span>
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your tickets...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
        <div className="container-fluid">
          <div className="alert alert-danger" role="alert">
            <i className="icofont-warning me-2"></i>
            {error}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-2">My Tickets</h2>
            <p className="text-muted">
              View and manage your event tickets
            </p>
          </div>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="mb-3">
                <i className="icofont-ticket" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
              </div>
              <h5 className="mb-2">No Tickets Yet</h5>
              <p className="text-muted mb-4">
                You don&apos;t have any event tickets. Tickets are automatically generated when your applications are accepted.
              </p>
              <Link href="/dashboard/applications" className="btn btn-primary">
                <i className="icofont-file-document me-2"></i>
                View Applications
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="col-md-6 col-lg-4">
                <div className={`card h-100 shadow-sm ${ticket.status === 'checked_in' ? 'border-info border-2' : ''}`}>
                  {ticket.events.featured_image && (
                    <div className="position-relative">
                      <img
                        src={ticket.events.featured_image}
                        className={`card-img-top ${ticket.status === 'checked_in' ? 'opacity-75' : ''}`}
                        alt={ticket.events.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      {ticket.status === 'checked_in' && (
                        <div
                          className="position-absolute top-50 start-50 translate-middle"
                          style={{
                            backgroundColor: 'rgba(13, 202, 240, 0.9)',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            transform: 'translate(-50%, -50%) rotate(-10deg)',
                          }}
                        >
                          <span className="text-white fw-bold small">
                            <i className="icofont-check-circled me-1"></i>
                            CHECKED IN
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{ticket.events.title}</h5>
                      <div className="d-flex flex-column gap-1 align-items-end">
                        {ticket.ticket_type === 'speaker' && (
                          <span className="badge bg-warning text-dark">
                            <i className="icofont-mic me-1"></i>Speaker
                          </span>
                        )}
                        {getStatusBadge(ticket)}
                      </div>
                    </div>

                    <p className="card-text text-muted small mb-2">
                      <i className="icofont-calendar me-1"></i>
                      {formatDate(ticket.events.start_date)}
                    </p>

                    {ticket.events.location && (
                      <p className="card-text text-muted small mb-2">
                        <i className="icofont-location-pin me-1"></i>
                        {ticket.events.location}
                      </p>
                    )}

                    <hr />

                    <div className="mb-2">
                      <small className="text-muted">Ticket Number</small>
                      <p className="mb-0">
                        <code>{ticket.ticket_number}</code>
                      </p>
                    </div>

                    {ticket.checked_in_at && (
                      <div className="alert alert-success small mb-2">
                        <i className="icofont-check-circled me-1"></i>
                        Checked in on {formatDate(ticket.checked_in_at)}
                      </div>
                    )}
                  </div>

                  <div className="card-footer bg-transparent">
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="btn btn-primary w-100"
                    >
                      <i className="icofont-eye me-1"></i>
                      View Ticket
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {tickets.length > 0 && (
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h3 className="mb-0">{tickets.length}</h3>
                  <p className="text-muted small mb-0">Total Tickets</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {tickets.filter((t) => t.status === 'active' && t.is_valid).length}
                  </h3>
                  <p className="small mb-0">Active</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {tickets.filter((t) => t.checked_in_at).length}
                  </h3>
                  <p className="small mb-0">Checked In</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-secondary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {tickets.filter((t) => !t.is_valid || t.status === 'cancelled' || t.status === 'expired').length}
                  </h3>
                  <p className="small mb-0">Inactive</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
