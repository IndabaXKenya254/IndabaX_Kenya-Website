'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - MY APPLICATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════
// View all applications submitted by the current user

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import Link from 'next/link'

interface Application {
  id: string
  event_id: string
  template_id: string
  status: string
  status_v2: string
  respondent_name: string
  respondent_email: string
  response_type: string
  started_at: string
  completed_at: string | null
  is_complete: boolean
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  approved_at: string | null
  approved_by: string | null
  rejected_at: string | null
  rejected_by: string | null
  shortlisted_by: string | null
  waitlisted_at: string | null
  rejection_reason: string | null
  decision_notes: string | null
  events: {
    id: string
    slug: string
    title: string
    description: string
    start_date: string | null
    end_date: string | null
    location: string | null
    featured_image: string | null
    registration_deadline: string | null
    registration_enabled: boolean
  } | null
}

// Helper: Check if user can modify their application (same logic as dashboard)
const canModifyApplication = (app: Application): boolean => {
  if (!app.events) return false

  // Check if deadline has passed
  const deadline = app.events.registration_deadline
  if (deadline && new Date(deadline) < new Date()) {
    return false
  }

  // Check if admin has reviewed/processed the application
  const adminProcessedStatuses = ['shortlisted', 'survey_sent', 'survey_completed', 'approved', 'rejected', 'attended']
  const hasAdminReviewed = app.reviewed_by ||
                           app.shortlisted_by ||
                           app.approved_by ||
                           app.rejected_by ||
                           (app.status_v2 && adminProcessedStatuses.includes(app.status_v2))

  return !hasAdminReviewed
}

interface Ticket {
  id: string
  ticket_number: string
  registration_id: string
  qr_code_data: string
  is_valid: boolean
  status: string
  generated_at: string
  invalidated_at?: string | null
  invalidation_reason?: string | null
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingTicket, setGeneratingTicket] = useState<string | null>(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchApplications()
    fetchTickets()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/user/applications')
      const result = await response.json()

      if (result.success) {
        setApplications(result.data)
      } else {
        setError(result.error || 'Failed to fetch applications')
      }
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/user/tickets')
      const result = await response.json()

      if (result.success) {
        setTickets(result.data)
      }
    } catch (err) {
      console.error('Error fetching tickets:', err)
    }
  }

  const getTicketForApplication = (applicationId: string): Ticket | undefined => {
    return tickets.find(t => t.registration_id === applicationId)
  }

  const handleGenerateTicket = async (applicationId: string) => {
    setGeneratingTicket(applicationId)
    try {
      const response = await fetch('/api/user/tickets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId })
      })

      const result = await response.json()

      if (result.success) {
        // Refresh tickets list
        await fetchTickets()
        alert('Ticket generated successfully!')
      } else {
        alert(result.error || 'Failed to generate ticket')
      }
    } catch (err) {
      console.error('Error generating ticket:', err)
      alert('Failed to generate ticket')
    } finally {
      setGeneratingTicket(null)
    }
  }

  const getStatusBadge = (app: Application) => {
    // Use status_v2 for new workflow
    const status = app.status_v2

    switch (status) {
      case 'approved':
        return <span className="badge bg-success">✅ Accepted</span>
      case 'rejected':
        return <span className="badge bg-danger">❌ Rejected</span>
      case 'waitlisted':
        return <span className="badge bg-warning">📋 Waitlisted</span>
      case 'shortlisted':
        return <span className="badge bg-info">📋 Shortlisted</span>
      case 'reviewed':
        return <span className="badge bg-primary">👀 Reviewed</span>
      case 'interested':
        return <span className="badge bg-secondary">📝 Submitted</span>
      case 'survey_sent':
        return <span className="badge bg-warning">📧 Survey Sent</span>
      case 'survey_completed':
        return <span className="badge bg-info">✅ Survey Complete</span>
      default:
        return <span className="badge bg-secondary">⏳ Pending</span>
    }
  }

  /**
   * Get status message showing current status and history if changed
   */
  const getStatusMessage = (app: Application) => {
    const currentStatus = app.status_v2

    // Handle status changes - show history
    if (currentStatus === 'pending' && app.approved_at) {
      // Revoked: Was approved, now back to pending
      return (
        <>
          <p className="text-warning small mb-2">
            <i className="icofont-history me-1"></i>
            <strong>Status Changed:</strong> Approval was revoked
          </p>
          <p className="text-muted small mb-2">
            Previously approved on {formatDate(app.approved_at)}
          </p>
        </>
      )
    }

    if (currentStatus === 'rejected' && app.approved_at) {
      // Was approved, then rejected
      return (
        <>
          <p className="text-danger small mb-2">
            <i className="icofont-close-circled me-1"></i>
            Rejected on {formatDate(app.rejected_at)}
          </p>
          <p className="text-muted small mb-2" style={{ textDecoration: 'line-through', opacity: 0.6 }}>
            Previously approved on {formatDate(app.approved_at)}
          </p>
          {(app.rejection_reason || app.decision_notes) && (
            <div className="alert alert-danger small mb-2">
              <strong>Reason:</strong> {app.rejection_reason || app.decision_notes}
            </div>
          )}
        </>
      )
    }

    // Current status messages (no history)
    if (currentStatus === 'approved') {
      return (
        <p className="text-success small mb-2">
          <i className="icofont-check-circled me-1"></i>
          Approved on {formatDate(app.approved_at)}
        </p>
      )
    }

    if (currentStatus === 'rejected') {
      return (
        <>
          <p className="text-danger small mb-2">
            <i className="icofont-close-circled me-1"></i>
            Rejected on {formatDate(app.rejected_at)}
          </p>
          {(app.rejection_reason || app.decision_notes) && (
            <div className="alert alert-danger small mb-2">
              <strong>Reason:</strong> {app.rejection_reason || app.decision_notes}
            </div>
          )}
        </>
      )
    }

    if (currentStatus === 'waitlisted') {
      return (
        <p className="text-warning small mb-2">
          <i className="icofont-clock-time me-1"></i>
          Waitlisted
          {app.decision_notes && (
            <div className="alert alert-warning small mt-2 mb-2">
              <strong>Note:</strong> {app.decision_notes}
            </div>
          )}
        </p>
      )
    }

    // Reviewed but pending decision
    if (app.reviewed_at) {
      return (
        <p className="text-info small mb-2">
          <i className="icofont-eye me-1"></i>
          Reviewed on {formatDate(app.reviewed_at)}
        </p>
      )
    }

    // Default: pending/in review
    return (
      <p className="text-muted small mb-2">
        <i className="icofont-clock-time me-1"></i>
        Awaiting review
      </p>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter and search applications
  const filteredApplications = applications.filter((app) => {
    // Skip applications with deleted events
    if (!app.events) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all' && app.status_v2 !== statusFilter) {
      return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesEventTitle = app.events?.title?.toLowerCase().includes(query) || false
      const matchesLocation = app.events?.location?.toLowerCase().includes(query) || false
      const matchesType = app.response_type?.toLowerCase().includes(query) || false

      if (!matchesEventTitle && !matchesLocation && !matchesType) {
        return false
      }
    }

    return true
  })

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your applications...</p>
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
            <h2 className="mb-2">My Applications</h2>
            <p className="text-muted">
              View and track the status of all your event applications
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        {applications.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="icofont-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by event title, location, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="icofont-close"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="interested">📝 Submitted</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="shortlisted">📋 Shortlisted</option>
                <option value="survey_sent">📧 Survey Sent</option>
                <option value="survey_completed">✅ Survey Complete</option>
                <option value="approved">✅ Accepted</option>
                <option value="rejected">❌ Rejected</option>
                <option value="waitlisted">📋 Waitlisted</option>
              </select>
            </div>
          </div>
        )}

        {/* Filter Results Info */}
        {(searchQuery || statusFilter !== 'all') && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="alert alert-info d-flex justify-content-between align-items-center">
                <span>
                  <i className="icofont-filter me-2"></i>
                  Showing {filteredApplications.length} of {applications.length} applications
                </span>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="mb-3">
                <i className="icofont-file-document" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
              </div>
              <h5 className="mb-2">No Applications Yet</h5>
              <p className="text-muted mb-4">
                You haven&apos;t submitted any applications. Browse events to get started!
              </p>
              <Link href="/events" className="btn btn-primary">
                <i className="icofont-calendar me-2"></i>
                Browse Events
              </Link>
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="mb-3">
                <i className="icofont-search-document" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
              </div>
              <h5 className="mb-2">No Applications Found</h5>
              <p className="text-muted mb-4">
                No applications match your search criteria. Try adjusting your filters.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
                <i className="icofont-refresh me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredApplications.map((app) => (
              <div key={app.id} className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <div className="row align-items-center">
                      {/* Event Image */}
                      <div className="col-md-2">
                        {app.events?.featured_image ? (
                          <img
                            src={app.events.featured_image}
                            alt={app.events.title}
                            className="img-fluid rounded"
                            style={{ height: '100px', width: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{ height: '100px' }}
                          >
                            <i className="icofont-calendar" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                          </div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="col-md-6">
                        <h5 className="mb-2">{app.events?.title || 'Event'}</h5>
                        <p className="text-muted small mb-2">
                          <i className="icofont-calendar me-1"></i>
                          {app.events?.start_date ? formatDate(app.events.start_date) : 'N/A'}
                          {app.events?.location && (
                            <>
                              <span className="mx-2">•</span>
                              <i className="icofont-location-pin me-1"></i>
                              {app.events.location}
                            </>
                          )}
                        </p>
                        <p className="text-muted small mb-2">
                          <strong>Type:</strong> {app.response_type || 'Application'}
                        </p>
                        <p className="text-muted small mb-0">
                          <strong>Submitted:</strong> {formatDate(app.started_at)}
                        </p>
                      </div>

                      {/* Status & Actions */}
                      <div className="col-md-4 text-md-end">
                        <div className="mb-3">
                          {getStatusBadge(app)}
                        </div>

                        {/* Show status message with history if changed */}
                        {getStatusMessage(app)}

                        {/* Show general feedback if available */}
                        {app.review_notes && !app.decision_notes && (
                          <div className="alert alert-info small mb-2">
                            <strong>Feedback:</strong> {app.review_notes}
                          </div>
                        )}

                        <div className="btn-group-vertical w-100" role="group">
                          {app.events?.slug && (
                            <Link
                              href={`/events/${app.events.slug}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="icofont-eye me-1"></i>
                              View Event
                            </Link>
                          )}

                          {/* Issue #25 FIX: Modify Application button - checks deadline + admin review */}
                          {canModifyApplication(app) && app.events?.slug && (
                            <Link
                              href={`/events/${app.events.slug}/register`}
                              className="btn btn-sm btn-outline-secondary mt-2"
                            >
                              <i className="icofont-edit me-1"></i>
                              Modify Application
                            </Link>
                          )}

                          {/* Show Download Ticket button if approved and ticket exists */}
                          {app.status_v2 === 'approved' && (() => {
                            const ticket = getTicketForApplication(app.id)
                            const isGenerating = generatingTicket === app.id

                            if (ticket && ticket.is_valid) {
                              return (
                                <Link
                                  href={`/dashboard/tickets/${ticket.id}`}
                                  className="btn btn-sm btn-success mt-2"
                                >
                                  <i className="icofont-ticket me-1"></i>
                                  Download Ticket
                                </Link>
                              )
                            } else {
                              return (
                                <button
                                  onClick={() => handleGenerateTicket(app.id)}
                                  disabled={isGenerating}
                                  className="btn btn-sm btn-warning mt-2"
                                >
                                  {isGenerating ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1"></span>
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <i className="icofont-plus me-1"></i>
                                      Generate Ticket
                                    </>
                                  )}
                                </button>
                              )
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {applications.length > 0 && (
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h3 className="mb-0">{applications.length}</h3>
                  <p className="text-muted small mb-0">Total Applications</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {applications.filter((a) => a.status_v2 === 'approved').length}
                  </h3>
                  <p className="small mb-0">Accepted</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-danger text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {applications.filter((a) => a.status_v2 === 'rejected').length}
                  </h3>
                  <p className="small mb-0">Rejected</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {applications.filter((a) => !['approved', 'rejected'].includes(a.status_v2)).length}
                  </h3>
                  <p className="small mb-0">Pending</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
