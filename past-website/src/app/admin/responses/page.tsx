'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN RESPONSES PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and manage form responses

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

interface Response {
  id: string
  respondent_name: string
  respondent_email: string
  status: string
  completion_percentage: number
  completed_at: string | null
  created_at: string
  event: {
    id: string
    slug: string
    title: string
    start_date: string
  }
  template: {
    id: string
    name: string
  }
}

export default function AdminResponsesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [responses, setResponses] = useState<Response[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>(searchParams.get('event_id') || '')
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || '')
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '')
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  })

  useEffect(() => {
    fetchEvents()
    fetchResponses()
  }, [selectedEvent, selectedStatus, searchQuery, pagination.page])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?status=all&limit=100')
      const result = await response.json()
      if (result.success) {
        setEvents(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchResponses = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (selectedEvent) params.set('event_id', selectedEvent)
      if (selectedStatus) params.set('status', selectedStatus)
      if (searchQuery) params.set('search', searchQuery)
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      const response = await fetch(`/api/admin/responses?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setResponses(result.data || [])
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch responses:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'badge bg-secondary',
      in_progress: 'badge bg-warning text-dark',
      completed: 'badge bg-success',
    }
    return badges[status] || 'badge bg-secondary'
  }

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Event', 'Status', 'Completion %', 'Completed At', 'Created At']
    const rows = responses.map(r => [
      r.respondent_name,
      r.respondent_email,
      r.event?.title || 'N/A',
      r.status,
      r.completion_percentage,
      r.completed_at ? new Date(r.completed_at).toLocaleString() : 'N/A',
      new Date(r.created_at).toLocaleString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Form Responses</h1>
          <button
            className="btn btn-success"
            onClick={exportToCSV}
            disabled={responses.length === 0}
          >
            <i className="icofont-download me-2"></i>
            Export to CSV
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Event</label>
                <select
                  className="form-select"
                  value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                >
                  <option value="">All Events</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="col-md-5">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setPagination(prev => ({ ...prev, page: 1 }))
                      fetchResponses()
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="icofont-ui-folder" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">No responses found</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Respondent</th>
                        <th>Event</th>
                        <th>Template</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Completed</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map(response => (
                        <tr key={response.id}>
                          <td>
                            <div>
                              <strong>{response.respondent_name || 'N/A'}</strong>
                              <br />
                              <small className="text-muted">{response.respondent_email}</small>
                            </div>
                          </td>
                          <td>
                            {response.event ? (
                              <div>
                                {response.event.title}
                                <br />
                                <small className="text-muted">
                                  {new Date(response.event.start_date).toLocaleDateString()}
                                </small>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>
                            {response.template?.name || 'N/A'}
                          </td>
                          <td>
                            <span className={getStatusBadge(response.status)}>
                              {response.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div className="progress" style={{ height: '20px' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: `${response.completion_percentage}%` }}
                                aria-valuenow={response.completion_percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                {response.completion_percentage}%
                              </div>
                            </div>
                          </td>
                          <td>
                            {response.completed_at ? (
                              <small>{new Date(response.completed_at).toLocaleString()}</small>
                            ) : (
                              <small className="text-muted">Not completed</small>
                            )}
                          </td>
                          <td>
                            <Link
                              href={`/admin/responses/${response.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="icofont-eye"></i> View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <nav>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                          <li
                            key={page}
                            className={`page-item ${pagination.page === page ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setPagination(prev => ({ ...prev, page }))}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        <li
                          className={`page-item ${
                            pagination.page === pagination.totalPages ? 'disabled' : ''
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
