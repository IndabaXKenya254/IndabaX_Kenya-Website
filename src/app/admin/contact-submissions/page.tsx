'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN CONTACT SUBMISSIONS PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and manage contact form submissions

import React, { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'
import { useAdminContactSubmissions } from '@/hooks/useAdminApi'
import type { ContactSubmission } from '@/types/api'

type StatusFilter = 'all' | 'new' | 'read' | 'resolved'

export default function AdminContactSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // React Query hook - automatic caching and deduplication
  const filters = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit,
    offset: (page - 1) * limit
  }), [statusFilter, page, limit])

  const { data: submissions, isLoading: loading, refetch } = useAdminContactSubmissions(filters)
  const totalCount = !submissions || submissions.length === 0 ? 0 : submissions.length

  const handleViewSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission)
    setAdminNotes(submission.admin_notes || '')
    setShowModal(true)

    // Mark as read if it's new
    if (submission.status === 'new') {
      handleUpdateStatus(submission.id, 'read')
    }
  }

  const handleUpdateStatus = async (id: string, status: 'new' | 'read' | 'resolved', notes?: string) => {
    try {
      const result = await adminApi.contactSubmissions.updateStatus(id, status, notes)
      if (result.success) {
        refetch()
        if (status === 'resolved') {
          showSuccess('Resolved!', 'Contact submission marked as resolved')
          setShowModal(false)
        }
      } else {
        showError('Update Failed', result.error || 'Failed to update submission')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showError('Error', 'Failed to update submission')
    }
  }

  const handleResolveWithNotes = async () => {
    if (!selectedSubmission) return

    try {
      const result = await adminApi.contactSubmissions.updateStatus(
        selectedSubmission.id,
        'resolved',
        adminNotes
      )
      if (result.success) {
        showSuccess('Resolved!', 'Contact submission marked as resolved')
        setShowModal(false)
        refetch()
      } else {
        showError('Update Failed', result.error || 'Failed to resolve submission')
      }
    } catch (error) {
      console.error('Error resolving submission:', error)
      showError('Error', 'Failed to resolve submission')
    }
  }

  const handleDelete = async (id: string, email: string) => {
    const confirmed = await showConfirm(
      'Delete Submission?',
      `Are you sure you want to delete the submission from ${email}? This action cannot be undone.`
    )

    if (confirmed) {
      const result = await adminApi.contactSubmissions.delete(id)
      if (result.success) {
        showSuccess('Deleted!', 'Contact submission has been deleted')
        refetch()
      } else {
        showError('Delete Failed', result.error || 'Failed to delete submission')
      }
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-primary'
      case 'read':
        return 'bg-warning text-dark'
      case 'resolved':
        return 'bg-success'
      default:
        return 'bg-secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i className="icofont-email me-2"></i>
            Contact Submissions
          </h2>
        </div>

        {/* Status Filter */}
        <div className="mb-4">
          <div className="btn-group" role="group">
            <button
              className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setStatusFilter('all')
                setPage(1)
              }}
            >
              All
            </button>
            <button
              className={`btn ${statusFilter === 'new' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setStatusFilter('new')
                setPage(1)
              }}
            >
              New
            </button>
            <button
              className={`btn ${statusFilter === 'read' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setStatusFilter('read')
                setPage(1)
              }}
            >
              Read
            </button>
            <button
              className={`btn ${statusFilter === 'resolved' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setStatusFilter('resolved')
                setPage(1)
              }}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <div className="alert alert-info">
            <i className="icofont-info-circle me-2"></i>
            No contact submissions found.
          </div>
        ) : (
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(submissions || []).map((submission) => (
                    <tr key={submission.id} className={submission.status === 'new' ? 'table-active' : ''}>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td>{submission.name}</td>
                      <td>
                        <a href={`mailto:${submission.email}`}>{submission.email}</a>
                      </td>
                      <td>{submission.subject || <em className="text-muted">No subject</em>}</td>
                      <td>{formatDate(submission.created_at)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleViewSubmission(submission)}
                        >
                          <i className="icofont-eye me-1"></i>
                          View
                        </button>
                        {submission.status !== 'resolved' && (
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleUpdateStatus(submission.id, 'resolved')}
                          >
                            <i className="icofont-check me-1"></i>
                            Resolve
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(submission.id, submission.email)}
                        >
                          <i className="icofont-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > limit && (
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} submissions
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: Math.ceil(totalCount / limit) }, (_, i) => i + 1)
                        .filter(p => {
                          // Show first page, last page, current page, and 2 pages around current
                          const totalPages = Math.ceil(totalCount / limit)
                          return p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)
                        })
                        .map((p, index, array) => {
                          // Add ellipsis if there's a gap
                          const showEllipsisBefore = index > 0 && p - array[index - 1] > 1
                          return (
                            <React.Fragment key={p}>
                              {showEllipsisBefore && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}
                              <li className={`page-item ${page === p ? 'active' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => setPage(p)}
                                >
                                  {p}
                                </button>
                              </li>
                            </React.Fragment>
                          )
                        })}
                      <li className={`page-item ${page === Math.ceil(totalCount / limit) ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPage(page + 1)}
                          disabled={page === Math.ceil(totalCount / limit)}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View/Edit Modal */}
        {showModal && selectedSubmission && (
          <>
            <div className="modal show d-block" tabIndex={-1}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Contact Submission Details
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Name:</strong>
                        <p>{selectedSubmission.name}</p>
                      </div>
                      <div className="col-md-6">
                        <strong>Email:</strong>
                        <p>
                          <a href={`mailto:${selectedSubmission.email}`}>
                            {selectedSubmission.email}
                          </a>
                        </p>
                      </div>
                    </div>

                    {selectedSubmission.subject && (
                      <div className="mb-3">
                        <strong>Subject:</strong>
                        <p>{selectedSubmission.subject}</p>
                      </div>
                    )}

                    <div className="mb-3">
                      <strong>Message:</strong>
                      <div className="p-3 bg-light rounded">
                        {selectedSubmission.message}
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Status:</strong>
                        <p>
                          <span className={`badge ${getStatusBadgeClass(selectedSubmission.status)}`}>
                            {selectedSubmission.status}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <strong>Submitted:</strong>
                        <p>{formatDate(selectedSubmission.created_at)}</p>
                      </div>
                    </div>

                    {selectedSubmission.resolved_at && (
                      <div className="mb-3">
                        <strong>Resolved:</strong>
                        <p>{formatDate(selectedSubmission.resolved_at)}</p>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label">
                        <strong>Admin Notes:</strong>
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes about this submission..."
                      />
                      <small className="text-muted">
                        These notes are for internal use only and will not be sent to the submitter.
                      </small>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                    {selectedSubmission.status !== 'resolved' && (
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleResolveWithNotes}
                      >
                        <i className="icofont-check me-1"></i>
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop show"></div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
