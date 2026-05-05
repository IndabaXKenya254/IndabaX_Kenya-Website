'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN APPLICATIONS PAGE (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Upgraded with TanStack Table, bulk operations, and lock status

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
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { Alert } from '@/components/admin/ui'
import { useAdminApplications } from '@/hooks/useAdminApi'
import { adminApi } from '@/lib/admin/api-client'
import { formatDistanceToNow } from 'date-fns'
import * as XLSX from 'xlsx'
import { ShortlistModal } from '@/components/admin/applications/ShortlistModal'
import { BulkAcceptModal } from '@/components/admin/BulkAcceptModal'

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

export default function AdminApplicationsPage() {
  const router = useRouter()

  // State
  const [alert, setAlert] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [events, setEvents] = useState<any[]>([])
  const [showShortlistModal, setShowShortlistModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)

  // Fetch events on mount
  useEffect(() => {
    fetch('/api/admin/events')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvents(data.data || [])
        }
      })
      .catch(err => console.error('Failed to fetch events:', err))
  }, [])

  // Fetch applications
  const { data: applications, isLoading, refetch } = useAdminApplications({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  })

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
      // Checkbox column for bulk selection
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="form-check-input"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="form-check-input"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 50,
      },
      // Applicant column (merged info)
      {
        id: 'applicant_info',
        header: 'Applicant Information',
        cell: ({ row }) => (
          <div>
            <strong>{row.original.respondent_name || 'N/A'}</strong>
            <div className="text-muted small">{row.original.respondent_email}</div>
          </div>
        ),
      },
      // Application column (merged timing info)
      {
        id: 'application_info',
        header: 'Application Information',
        cell: ({ row }) => (
          <div>
            <div><strong>Event:</strong> {row.original.event?.title || 'N/A'}</div>
            <div className="text-muted small">
              <strong>Submitted:</strong> {new Date(row.original.created_at).toLocaleDateString()}
              {row.original.completed_at && (
                <>
                  <br />
                  <strong>Completed:</strong> {new Date(row.original.completed_at).toLocaleDateString()}
                </>
              )}
            </div>
          </div>
        ),
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
      // Actions column
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-primary"
              onClick={() => router.push(`/admin/applications/${row.original.id}`)}
            >
              <i className="icofont-eye"></i> View
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
  // BULK OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const handleBulkShortlist = async (surveyTemplateId: string, deadlineDays: number, emailTemplateId: string | null) => {
    if (selectedCount === 0) return

    setAlert({ type: 'info', message: `Shortlisting ${selectedCount} applications and sending survey emails...` })

    try {
      const selectedIds = selectedRows.map(row => row.original.id)

      const response = await fetch('/api/admin/applications/bulk/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_ids: selectedIds,
          survey_template_id: surveyTemplateId,
          deadline_days: deadlineDays
        }),
      })

      const result = await response.json()

      if (result.success) {
        const { success, failed, total } = result.data
        setAlert({
          type: success === total ? 'success' : 'warning',
          message: `Shortlisted ${success} of ${total} application(s). ${failed > 0 ? `${failed} failed.` : ''}`
        })
        setRowSelection({})
        refetch()
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to shortlist applications' })
      }
    } catch (error) {
      console.error('Bulk shortlist error:', error)
      setAlert({ type: 'danger', message: 'An error occurred during bulk shortlist' })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BULK ACCEPT
  // ═══════════════════════════════════════════════════════════════════════

  const handleBulkAccept = async (templateId?: string, sendEmail?: boolean) => {
    if (selectedCount === 0) return

    setAlert({ type: 'info', message: `Accepting ${selectedCount} applications...` })

    try {
      const selectedIds = selectedRows.map(row => row.original.id)

      const response = await fetch('/api/admin/applications/bulk/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_ids: selectedIds,
          email_template_id: templateId,
          send_email: sendEmail
        }),
      })

      const result = await response.json()

      if (result.success) {
        const { success, failed, total, emails_sent, emails_failed } = result.data
        const emailStatus = sendEmail
          ? ` Emails: ${emails_sent} sent, ${emails_failed} failed.`
          : ''
        setAlert({
          type: success === total ? 'success' : 'warning',
          message: `Accepted ${success} of ${total} application(s).${emailStatus} ${failed > 0 ? `${failed} failed.` : ''}`
        })
        setRowSelection({})
        refetch()
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to accept applications' })
      }
    } catch (error) {
      console.error('Bulk accept error:', error)
      setAlert({ type: 'danger', message: 'An error occurred during bulk accept' })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BULK REJECT
  // ═══════════════════════════════════════════════════════════════════════

  const handleBulkReject = async () => {
    if (selectedCount === 0) return

    const confirmed = confirm(`Reject ${selectedCount} application(s) and send rejection emails?`)
    if (!confirmed) return

    setAlert({ type: 'info', message: `Rejecting ${selectedCount} applications...` })

    try {
      const selectedIds = selectedRows.map(row => row.original.id)

      const response = await fetch('/api/admin/applications/bulk/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_ids: selectedIds }),
      })

      const result = await response.json()

      if (result.success) {
        const { success, failed, total } = result.data
        setAlert({
          type: success === total ? 'success' : 'warning',
          message: `Rejected ${success} of ${total} application(s). ${failed > 0 ? `${failed} failed.` : ''}`
        })
        setRowSelection({})
        refetch()
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to reject applications' })
      }
    } catch (error) {
      console.error('Bulk reject error:', error)
      setAlert({ type: 'danger', message: 'An error occurred during bulk reject' })
    }
  }

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
      const filename = `applications_export_${timestamp}.xlsx`

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
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Applications</h2>
            <p className="text-muted">Review and manage event applications</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-outline-success me-2"
              onClick={handleExportToExcel}
              disabled={filteredApplications.length === 0}
            >
              <i className="icofont-file-excel"></i> Export to Excel
            </button>
            {selectedCount > 0 && (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => setShowAcceptModal(true)}
                >
                  <i className="icofont-check-circled"></i> Accept ({selectedCount})
                </button>
                <button
                  className="btn btn-danger me-2"
                  onClick={handleBulkReject}
                >
                  <i className="icofont-close-circled"></i> Reject ({selectedCount})
                </button>
                <button
                  className="btn btn-primary me-2"
                  onClick={() => setShowShortlistModal(true)}
                >
                  <i className="icofont-check"></i> Shortlist ({selectedCount})
                </button>
              </>
            )}
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
                  <option value="interested">Interested</option>
                  <option value="pending">Pending Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="survey_sent">Survey Sent</option>
                  <option value="survey_completed">Survey Completed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                  <option value="attended">Attended</option>
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
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-muted">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredApplications.length)}{' '}
                      of {filteredApplications.length} application(s)
                      {selectedCount > 0 && ` • ${selectedCount} selected`}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <label htmlFor="pageSize" className="text-muted mb-0 small">Show:</label>
                      <select
                        id="pageSize"
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1) // Reset to first page when changing page size
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={9999}>All</option>
                      </select>
                    </div>
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

      {/* Shortlist Modal */}
      <ShortlistModal
        isOpen={showShortlistModal}
        onClose={() => setShowShortlistModal(false)}
        onConfirm={handleBulkShortlist}
        selectedCount={selectedCount}
      />

      {/* Bulk Accept Modal */}
      <BulkAcceptModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        selectedCount={selectedCount}
        onConfirm={handleBulkAccept}
      />
    </DashboardLayout>
  )
}
