'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM TEMPLATES LIST PAGE
// ═══════════════════════════════════════════════════════════════════════
// Admin page to manage form templates
// Phase 3: Form Builder

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'
import { format } from 'date-fns'
import { showConfirmation, showSuccess, showError } from '@/lib/sweetalert'

interface Template {
  id: string
  name: string
  description: string | null
  usage_type: string
  is_locked: boolean
  locked_to_event_id: string | null
  created_at: string
  updated_at: string
  user_profiles: {
    name: string
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [usageTypeFilter, setUsageTypeFilter] = useState('')
  // Issue #12 FIX: Add pagination state
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  })

  useEffect(() => {
    fetchTemplates(1, pagination.limit)
  }, [usageTypeFilter])

  const fetchTemplates = async (page: number = pagination.page, itemsPerPage: number = pagination.limit) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', itemsPerPage.toString())

      if (usageTypeFilter) {
        params.append('usage_type', usageTypeFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const url = `/api/forms/templates?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.data)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchTemplates(1, pagination.limit) // Reset to page 1 on search
  }

  // Issue #12 FIX: Add pagination handlers
  const handleNextPage = () => {
    if (pagination.hasNext) {
      fetchTemplates(pagination.page + 1, pagination.limit)
    }
  }

  const handlePreviousPage = () => {
    if (pagination.hasPrevious) {
      fetchTemplates(pagination.page - 1, pagination.limit)
    }
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    fetchTemplates(1, newLimit) // Reset to page 1 when changing items per page
  }

  const handleDelete = async (id: string) => {
    // Issue #12 FIX: Use SweetAlert2 instead of native confirm()
    const confirmed = await showConfirmation(
      'Delete Template',
      'Are you sure you want to delete this template? This action cannot be undone.',
      'Delete',
      'Cancel'
    )
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/forms/templates/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setTemplates(templates.filter(t => t.id !== id))
        showSuccess('Deleted', 'Template deleted successfully')
        // Refresh to get updated pagination
        fetchTemplates(pagination.page, pagination.limit)
      } else {
        showError('Error', data.error?.message || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      showError('Error', 'Failed to delete template')
    }
  }

  const getUsageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      application: 'Application Form',
      initial_interest: 'Interest Form',
      detailed_survey: 'Detailed Survey',
      paper_submission: 'Paper Submission',
      custom: 'Custom',
    }
    return labels[type] || type
  }

  const getUsageTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      application: 'badge bg-primary',
      initial_interest: 'badge bg-info',
      detailed_survey: 'badge bg-success',
      paper_submission: 'badge bg-warning',
      custom: 'badge bg-secondary',
    }
    return classes[type] || 'badge bg-secondary'
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-2">Form Templates</h2>
                <p className="text-muted">
                  Create and manage dynamic form templates for event registrations
                </p>
              </div>
              <Link href="/admin/templates/new" className="btn btn-primary">
                <i className="icofont-plus me-2"></i>
                Create Template
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={usageTypeFilter}
                      onChange={(e) => setUsageTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="application">Application Form</option>
                      <option value="initial_interest">Interest Form</option>
                      <option value="detailed_survey">Detailed Survey</option>
                      <option value="paper_submission">Paper Submission</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-outline-primary w-100" onClick={handleSearch}>
                      <i className="icofont-search me-2"></i>
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading templates...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="icofont-file-document" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                    <p className="mt-3 text-muted mb-2">No templates found</p>
                    <small>Create your first form template to get started</small>
                  </div>
                ) : (
                  <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Created By</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.map((template) => (
                          <tr key={template.id}>
                            <td>
                              <strong>{template.name}</strong>
                            </td>
                            <td>
                              {template.description ? (
                                <span className="text-muted">
                                  {template.description.length > 50
                                    ? template.description.substring(0, 50) + '...'
                                    : template.description}
                                </span>
                              ) : (
                                <span className="text-muted fst-italic">No description</span>
                              )}
                            </td>
                            <td>
                              <span className={getUsageTypeBadgeClass(template.usage_type)}>
                                {getUsageTypeLabel(template.usage_type)}
                              </span>
                            </td>
                            <td>
                              {template.is_locked ? (
                                <span className="badge bg-warning text-dark">
                                  <i className="icofont-lock me-1"></i>
                                  Locked
                                </span>
                              ) : (
                                <span className="badge bg-success">
                                  <i className="icofont-unlock me-1"></i>
                                  Active
                                </span>
                              )}
                            </td>
                            <td>
                              <small className="text-muted">
                                {template.user_profiles?.name || 'Unknown'}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {format(new Date(template.created_at), 'MMM d, yyyy')}
                              </small>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <Link
                                  href={`/admin/templates/${template.id}`}
                                  className="btn btn-outline-primary"
                                  title="Edit"
                                >
                                  <i className="icofont-edit"></i>
                                </Link>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDelete(template.id)}
                                  title="Delete"
                                  disabled={template.is_locked}
                                >
                                  <i className="icofont-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Issue #12 FIX: Pagination Controls */}
                  <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-3">
                      <div className="text-muted">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} templates
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
                        Page {pagination.page} of {pagination.totalPages || 1}
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
        </div>
      </div>
    </DashboardLayout>
  )
}
