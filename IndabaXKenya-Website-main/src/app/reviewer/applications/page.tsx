'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER APPLICATIONS PAGE (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════
// Full-featured application review with TanStack Table, permissions, and locking

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert } from '@/components/admin/ui'
import { formatDistanceToNow } from 'date-fns'
import * as XLSX from 'xlsx'
import { useAuth } from '@/contexts/AuthContext'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface Application {
  id: string
  respondent_name: string
  respondent_email: string
  status_v2: string
  completion_percentage: number
  created_at: string
  completed_at: string | null
  is_locked: boolean
  locked_by_name: string | null
  lock_expires_at: string | null
  event: {
    id: string
    title: string
    slug: string
  }
  reviewer_permissions: {
    can_view: boolean
    can_review: boolean
    can_approve: boolean
    can_reject: boolean
  }
}

// ═══════════════════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    interested: { color: 'secondary', label: 'Interested' },
    pending: { color: 'warning', label: 'Pending Review' },
    shortlisted: { color: 'info', label: 'Shortlisted' },
    survey_sent: { color: 'primary', label: 'Survey Sent' },
    survey_completed: { color: 'success', label: 'Survey Completed' },
    approved: { color: 'success', label: 'Approved' },
    rejected: { color: 'danger', label: 'Rejected' },
    waitlisted: { color: 'warning', label: 'waitlisted' },
    attended: { color: 'dark', label: 'Attended' },
  }

  const config = statusConfig[status] || { color: 'secondary', label: status }

  return (
    <span className={`badge bg-${config.color}`}>
      {config.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// LOCK STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════

const LockIndicator = ({ application }: { application: Application }) => {
  if (!application.is_locked) return null

  const expiresIn = application.lock_expires_at
    ? formatDistanceToNow(new Date(application.lock_expires_at), { addSuffix: true })
    : 'unknown'

  return (
    <span className="badge bg-warning text-dark" title={`Locked by ${application.locked_by_name || 'Unknown'}`}>
      🔒 {application.locked_by_name || 'Locked'} (expires {expiresIn})
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function ReviewerApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()

  // State
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [events, setEvents] = useState<any[]>([])
  const [reviewerPermissions, setReviewerPermissions] = useState<Record<string, any>>({})
  const itemsPerPage = 20

  // Fetch applications
  useEffect(() => {
    fetchApplications()
  }, [statusFilter, currentPage])

  // Fetch assigned events on mount
  useEffect(() => {
    fetchAssignedEvents()
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('limit', String(itemsPerPage))
      params.append('offset', String((currentPage - 1) * itemsPerPage))

      const response = await fetch(`/api/reviewer/applications?${params}`)
      const result = await response.json()

      if (result.success) {
        setApplications(result.data || [])
        setReviewerPermissions(result.reviewer_permissions || {})
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to load applications' })
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      setAlert({ type: 'danger', message: 'An error occurred while fetching applications' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAssignedEvents = async () => {
    try {
      const response = await fetch('/api/reviewer/events')
      const result = await response.json()

      if (result.success) {
        setEvents(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch assigned events:', error)
    }
  }

  // Filter applications by event and search query (client-side)
  const filteredApplications = useMemo(() => {
    if (!applications) return []

    let filtered = applications

    // Filter by event
    if (eventFilter !== 'all') {
      filtered = filtered.filter((app: Application) => app.event?.id === eventFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((app: Application) =>
        app.respondent_name?.toLowerCase().includes(query) ||
        app.respondent_email?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [applications, eventFilter, searchQuery])

  // ═══════════════════════════════════════════════════════════════════════
  // TABLE COLUMNS
  // ═══════════════════════════════════════════════════════════════════════

  const columns = useMemo<ColumnDef<Application>[]>(
    () => [
      // Applicant column
      {
        accessorKey: 'respondent_name',
        header: 'Applicant',
        cell: ({ row }) => (
          <div>
            <strong>{row.original.respondent_name || 'N/A'}</strong>
            <div className="text-muted small">{row.original.respondent_email}</div>
          </div>
        ),
      },
      // Event column
      {
        accessorKey: 'event.title',
        header: 'Event',
        cell: ({ row }) => row.original.event?.title || 'N/A',
      },
      // Status column
      {
        accessorKey: 'status_v2',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status_v2} />,
      },
      // Lock status column
      {
        id: 'lock_status',
        header: 'Lock Status',
        cell: ({ row }) => <LockIndicator application={row.original} />,
      },
      // Progress column
      {
        accessorKey: 'completion_percentage',
        header: 'Progress',
        cell: ({ row }) => (
          <div className="progress" style={{ height: '20px', minWidth: '100px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${row.original.completion_percentage}%` }}
              aria-valuenow={row.original.completion_percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {row.original.completion_percentage}%
            </div>
          </div>
        ),
      },
      // Submitted column
      {
        accessorKey: 'created_at',
        header: 'Submitted',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
      },
      // Permissions column
      {
        id: 'permissions',
        header: 'Permissions',
        cell: ({ row }) => {
          const perms = row.original.reviewer_permissions
          return (
            <div className="small">
              {perms.can_review && <span className="badge bg-primary me-1">Review</span>}
              {perms.can_approve && <span className="badge bg-success me-1">Approve</span>}
              {perms.can_reject && <span className="badge bg-danger me-1">Reject</span>}
              {!perms.can_review && <span className="badge bg-secondary">View Only</span>}
            </div>
          )
        },
      },
      // Actions column
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-primary"
              onClick={() => router.push(`/reviewer/applications/${row.original.id}`)}
              disabled={!row.original.reviewer_permissions.can_view}
              title={!row.original.reviewer_permissions.can_view ? 'No permission to view' : 'View application'}
            >
              <i className="icofont-eye"></i> {row.original.reviewer_permissions.can_review ? 'Review' : 'View'}
            </button>
          </div>
        ),
      },
    ],
    [router]
  )

  // ═══════════════════════════════════════════════════════════════════════
  // TANSTACK TABLE INSTANCE
  // ═══════════════════════════════════════════════════════════════════════

  const table = useReactTable({
    data: filteredApplications,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT TO EXCEL
  // ═══════════════════════════════════════════════════════════════════════

  const handleExportToExcel = () => {
    if (filteredApplications.length === 0) {
      setAlert({ type: 'warning', message: 'No applications to export' })
      return
    }

    try {
      // Prepare data for Excel
      const exportData = filteredApplications.map((app: Application) => ({
        'Name': app.respondent_name || 'N/A',
        'Email': app.respondent_email || 'N/A',
        'Event': app.event?.title || 'N/A',
        'Status': app.status_v2 || 'N/A',
        'Progress': `${app.completion_percentage}%`,
        'Submitted': new Date(app.created_at).toLocaleDateString(),
        'Completed': app.completed_at ? new Date(app.completed_at).toLocaleDateString() : 'N/A',
        'Locked': app.is_locked ? `Yes (${app.locked_by_name})` : 'No',
      }))

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      worksheet['!cols'] = [
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 30 }, // Event
        { wch: 15 }, // Status
        { wch: 10 }, // Progress
        { wch: 12 }, // Submitted
        { wch: 12 }, // Completed
        { wch: 25 }, // Locked
      ]

      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications')

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `reviewer_applications_export_${timestamp}.xlsx`

      // Download file
      XLSX.writeFile(workbook, filename)

      setAlert({ type: 'success', message: `Exported ${filteredApplications.length} application(s) to ${filename}` })
    } catch (error) {
      console.error('Export error:', error)
      setAlert({ type: 'danger', message: 'Failed to export applications' })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <DashboardLayout allowedRoles={['reviewer']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>
              <i className="icofont-file-document me-2"></i>
              Review Applications
            </h2>
            <p className="text-muted">Evaluate applications assigned to you</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-outline-success"
              onClick={handleExportToExcel}
              disabled={filteredApplications.length === 0}
            >
              <i className="icofont-file-excel"></i> Export to Excel
            </button>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              {/* Event Filter */}
              <div className="col-md-3">
                <label className="form-label">Event</label>
                <select
                  className="form-select"
                  value={eventFilter}
                  onChange={(e) => {
                    setEventFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="all">All Events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="survey_sent">Survey Sent</option>
                  <option value="survey_completed">Survey Completed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>

              {/* Search */}
              <div className="col-md-6">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="icofont-ui-folder" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">No applications found</p>
                <p className="small">You may not be assigned to review any events yet, or there are no applications matching your filters.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getIsSorted() && (
                                <span className="ms-1">
                                  {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Info */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {filteredApplications.length} application(s)
                  </div>
                  <div>
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="mx-2">Page {currentPage}</span>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={filteredApplications.length < itemsPerPage}
                    >
                      Next
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
