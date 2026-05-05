'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL LOGS PAGE (PHASE 7 - DAY 3)
// ═══════════════════════════════════════════════════════════════════════
// View all sent emails

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

interface EmailLog {
  id: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  status: string
  sent_at: string
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export default function EmailLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  })

  useEffect(() => {
    fetchLogs(pagination.page)
  }, [])

  const fetchLogs = async (page: number, itemsPerPage: number = pagination.limit) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/emails/logs?page=${page}&limit=${itemsPerPage}`)
      const result = await response.json()
      if (result.success) {
        setLogs(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch email logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = () => {
    if (pagination.hasNext) {
      fetchLogs(pagination.page + 1)
    }
  }

  const handlePreviousPage = () => {
    if (pagination.hasPrevious) {
      fetchLogs(pagination.page - 1)
    }
  }

  // Issue #9 FIX: Add items-per-page handler
  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit }))
    fetchLogs(1, newLimit) // Reset to page 1 when changing items per page
  }

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      sent: 'bg-success',
      pending: 'bg-warning',
      failed: 'bg-danger',
      delivered: 'bg-primary'
    }
    return classes[status as keyof typeof classes] || 'bg-secondary'
  }

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Loading email logs...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Email Logs</h2>
            <p className="text-muted mb-0">View all sent emails</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/admin/emails/compose')}
          >
            <i className="icofont-plus me-2"></i>
            Compose Email
          </button>
        </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          {logs.length === 0 ? (
            <div className="text-center py-5">
              <i className="icofont-email" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
              <h5 className="mt-3">No Emails Sent</h5>
              <p className="text-muted">Start by composing your first email</p>
              <button
                className="btn btn-primary"
                onClick={() => router.push('/admin/emails/compose')}
              >
                <i className="icofont-plus me-2"></i>
                Compose Email
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Sent At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <div>
                            <div className="fw-bold">{log.recipient_name || log.recipient_email}</div>
                            {log.recipient_name && (
                              <small className="text-muted">{log.recipient_email}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '400px' }}>
                            {log.subject}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Not sent yet'}
                          </small>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => router.push(`/admin/emails/logs/${log.id}`)}
                          >
                            <i className="icofont-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Issue #9 FIX: Added items-per-page selector */}
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="text-muted">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} emails
                  </div>
                  {/* Items per page selector */}
                  <div className="d-flex align-items-center gap-2">
                    <label className="text-muted mb-0 small">Show:</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={pagination.limit}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-muted small">per page</span>
                  </div>
                </div>
                <div className="btn-group">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handlePreviousPage}
                    disabled={!pagination.hasPrevious}
                  >
                    <i className="icofont-rounded-left"></i> Previous
                  </button>
                  <button className="btn btn-outline-secondary" disabled>
                    Page {pagination.page} of {pagination.totalPages}
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleNextPage}
                    disabled={!pagination.hasNext}
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
