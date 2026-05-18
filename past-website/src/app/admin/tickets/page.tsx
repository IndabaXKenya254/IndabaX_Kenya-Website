'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN TICKETS MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// View, filter, and manage event tickets

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import * as XLSX from 'xlsx'

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
  checked_in_at: string | null
  checked_in_by: string | null
  downloaded_at: string | null
  download_count: number
  generated_at: string
  created_at: string
  pdf_url?: string | null
  event: {
    id: string
    title: string
    slug: string
  }
  user_profile?: {
    name: string
    email: string
  }
}

interface Stats {
  total: number
  valid: number
  used: number
  cancelled: number
  checkedIn: number
}

// ═══════════════════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const StatusBadge = ({ status, isValid }: { status: string; isValid: boolean }) => {
  if (!isValid) {
    return <span className="badge bg-danger">Invalid</span>
  }

  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'success', label: 'Active' },
    used: { color: 'secondary', label: 'Used' },
    cancelled: { color: 'danger', label: 'Cancelled' },
  }

  const config = statusConfig[status] || { color: 'secondary', label: status }

  return (
    <span className={`badge bg-${config.color}`}>
      {config.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function AdminTicketsPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  // State
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [stats, setStats] = useState<Stats>({
    total: 0,
    valid: 0,
    used: 0,
    cancelled: 0,
    checkedIn: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('id, title, slug')
          .order('start_date', { ascending: false })

        if (fetchError) throw fetchError
        setEvents(data || [])
      } catch (err) {
        console.error('Error fetching events:', err)
      }
    }

    fetchEvents()
  }, [])

  // Fetch tickets with pagination
  const fetchTickets = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      const offset = (page - 1) * pagination.limit

      // Build query with filters
      let query = supabase
        .from('tickets')
        .select(`
          *,
          event:events(id, title, slug),
          user_profile:user_profiles(name, email)
        `, { count: 'exact' })

      // Apply filters
      if (statusFilter !== 'all') {
        if (statusFilter === 'valid') {
          query = query.eq('is_valid', true)
        } else if (statusFilter === 'invalid') {
          query = query.eq('is_valid', false)
        } else if (statusFilter === 'checked_in') {
          query = query.not('checked_in_at', 'is', null)
        } else {
          query = query.eq('status', statusFilter)
        }
      }

      if (eventFilter !== 'all') {
        query = query.eq('event_id', eventFilter)
      }

      if (searchQuery) {
        query = query.or(`ticket_number.ilike.%${searchQuery}%,attendee_name.ilike.%${searchQuery}%,attendee_email.ilike.%${searchQuery}%`)
      }

      // Apply pagination and ordering
      const { data, error: fetchError, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1)

      if (fetchError) throw fetchError

      setTickets(data || [])

      // Update pagination info
      const total = count || 0
      setPagination(prev => ({
        ...prev,
        page,
        total,
        totalPages: Math.ceil(total / prev.limit)
      }))

      // Fetch stats separately (not paginated)
      const { data: allTickets } = await supabase
        .from('tickets')
        .select('is_valid, status, checked_in_at')

      const ticketData = allTickets || []
      setStats({
        total: ticketData.length,
        valid: ticketData.filter(t => t.is_valid).length,
        used: ticketData.filter(t => t.status === 'used').length,
        cancelled: ticketData.filter(t => t.status === 'cancelled').length,
        checkedIn: ticketData.filter(t => t.checked_in_at !== null).length,
      })

    } catch (err: any) {
      console.error('Error fetching tickets:', err)
      setError(err.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  // Fetch tickets on mount and when filters change
  useEffect(() => {
    fetchTickets(1) // Reset to page 1 when filters change
  }, [statusFilter, eventFilter, searchQuery])

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchTickets(pagination.page + 1)
    }
  }

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      fetchTickets(pagination.page - 1)
    }
  }

  // Export to Excel (export current filtered results)
  const handleExport = () => {
    const exportData = tickets.map(ticket => ({
      'Ticket Number': ticket.ticket_number,
      'Event': ticket.event?.title || 'N/A',
      'Attendee Name': ticket.attendee_name,
      'Email': ticket.attendee_email,
      'Organization': ticket.attendee_organization || 'N/A',
      'Type': ticket.ticket_type || 'general',
      'Status': ticket.is_valid ? ticket.status : 'invalid',
      'Checked In': ticket.checked_in_at ? 'Yes' : 'No',
      'Check-in Time': ticket.checked_in_at ? new Date(ticket.checked_in_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }) : 'N/A',
      'Downloaded': ticket.download_count > 0 ? 'Yes' : 'No',
      'Downloads': ticket.download_count,
      'Generated': new Date(ticket.generated_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets')

    const timestamp = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `tickets-${timestamp}.xlsx`)
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-0">Event Tickets</h2>
            <p className="text-muted mb-0">Manage and view all event tickets</p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/admin/tickets/export" className="btn btn-primary">
              <i className="icofont-download me-2"></i>
              Bulk Export
            </Link>
            <Link href="/admin/tickets/regenerate-qr" className="btn btn-warning">
              <i className="icofont-refresh me-2"></i>
              Regenerate QR Codes
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="icofont-warning me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-6 col-lg-3">
            <div className="card border-primary">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Total Tickets</p>
                    <h3 className="mb-0">{stats.total}</h3>
                  </div>
                  <i className="icofont-ticket" style={{ fontSize: '2rem', color: '#0d6efd' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card border-success">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Valid Tickets</p>
                    <h3 className="mb-0">{stats.valid}</h3>
                  </div>
                  <i className="icofont-check-circled" style={{ fontSize: '2rem', color: '#198754' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card border-info">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Checked In</p>
                    <h3 className="mb-0">{stats.checkedIn}</h3>
                  </div>
                  <i className="icofont-qr-code" style={{ fontSize: '2rem', color: '#0dcaf0' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card border-danger">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Invalid/Cancelled</p>
                    <h3 className="mb-0">{tickets.length - stats.valid}</h3>
                  </div>
                  <i className="icofont-close-circled" style={{ fontSize: '2rem', color: '#dc3545' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Status Filter</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="valid">Valid</option>
                  <option value="invalid">Invalid</option>
                  <option value="active">Active</option>
                  <option value="used">Used</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="checked_in">Checked In</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Event Filter</label>
                <select
                  className="form-select"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                >
                  <option value="all">All Events</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by ticket number, name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-success w-100"
                  onClick={handleExport}
                  disabled={tickets.length === 0}
                >
                  <i className="icofont-file-excel me-2"></i>
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                Tickets ({pagination.total})
              </h5>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-5">
                <i className="icofont-ticket" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                <p className="text-muted mt-3">No tickets found matching your filters</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Ticket #</th>
                        <th>Attendee</th>
                        <th>Event</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Check-in</th>
                        <th>Downloads</th>
                        <th>Generated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <code className="text-primary">{ticket.ticket_number}</code>
                        </td>
                        <td>
                          <div>
                            <strong>{ticket.attendee_name}</strong>
                            <br />
                            <small className="text-muted">{ticket.attendee_email}</small>
                            {ticket.attendee_organization && (
                              <>
                                <br />
                                <small className="text-muted">{ticket.attendee_organization}</small>
                              </>
                            )}
                          </div>
                        </td>
                        <td>{ticket.event?.title || 'N/A'}</td>
                        <td>
                          <span className="badge bg-secondary text-capitalize">
                            {ticket.ticket_type || 'general'}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={ticket.status} isValid={ticket.is_valid} />
                        </td>
                        <td>
                          {ticket.checked_in_at ? (
                            <div>
                              <i className="icofont-check-circled text-success me-1"></i>
                              <small>
                                {formatDistanceToNow(new Date(ticket.checked_in_at), {
                                  addSuffix: true,
                                })}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {ticket.download_count > 0 ? (
                            <span className="badge bg-info">
                              {ticket.download_count} {ticket.download_count === 1 ? 'time' : 'times'}
                            </span>
                          ) : (
                            <span className="text-muted">Not downloaded</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDistanceToNow(new Date(ticket.generated_at), {
                              addSuffix: true,
                            })}
                          </small>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              href={`/admin/tickets/${ticket.id}`}
                              className="btn btn-outline-primary"
                              title="View Details"
                            >
                              <i className="icofont-eye"></i>
                            </Link>
                            <button
                              className="btn btn-outline-secondary"
                              title="Download PDF"
                              onClick={() => {
                                if (ticket.pdf_url) {
                                  window.open(ticket.pdf_url, '_blank')
                                } else {
                                  alert('PDF not available for this ticket')
                                }
                              }}
                            >
                              <i className="icofont-download"></i>
                            </button>
                            <button
                              className="btn btn-outline-warning"
                              title="Regenerate QR Code"
                              onClick={async () => {
                                if (!confirm('Regenerate QR code for this ticket?')) return
                                try {
                                  const res = await fetch(`/api/admin/tickets/regenerate-qr?ticket_id=${ticket.id}`, { method: 'POST' })
                                  const data = await res.json()
                                  if (data.success) {
                                    alert(`QR code regenerated for ${ticket.ticket_number}`)
                                  } else {
                                    alert(`Failed: ${data.error || 'Unknown error'}`)
                                  }
                                } catch {
                                  alert('Failed to regenerate QR code')
                                }
                              }}
                            >
                              <i className="icofont-qr-code"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <div className="text-muted">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handlePreviousPage}
                      disabled={pagination.page <= 1}
                    >
                      <i className="icofont-rounded-left"></i> Previous
                    </button>
                    <button className="btn btn-outline-secondary" disabled>
                      Page {pagination.page} of {pagination.totalPages}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleNextPage}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next <i className="icofont-rounded-right"></i>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
