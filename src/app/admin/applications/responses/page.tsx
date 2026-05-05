'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SURVEY RESPONSE TRACKING (PHASE 5B)
// ═══════════════════════════════════════════════════════════════════════
// Track survey responses and follow up with non-responders

import { useState, useEffect, useMemo } from 'react'
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
import { formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface SurveyResponse {
  id: string
  respondent_name: string
  respondent_email: string
  status_v2: string
  shortlisted_at: string | null  // When survey was sent
  deadline_at: string | null      // Survey deadline
  completed_at: string | null     // When survey was completed
  completion_percentage: number
  event_id: string
  event?: {
    id: string
    title: string
    slug: string
  }
}

type ResponseFilter = 'all' | 'responded' | 'not_responded' | 'deadline_approaching' | 'expired'

// Issue #35 FIX: Track all application statuses, not just survey
type TrackingMode = 'survey' | 'all_applications'

// Modal state interfaces
interface ExtendModalState {
  isOpen: boolean
  applicationId: string | null
  applicationName: string
  currentDeadline: string | null
}


export default function ResponseTrackingPage() {
  const router = useRouter()
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<any>(null)
  const [filter, setFilter] = useState<ResponseFilter>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [events, setEvents] = useState<any[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  // Issue #35 FIX: Support tracking mode switch
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('survey')

  // Modal states
  const [extendModal, setExtendModal] = useState<ExtendModalState>({
    isOpen: false,
    applicationId: null,
    applicationName: '',
    currentDeadline: null
  })
  const [extendDays, setExtendDays] = useState(7)
  const [actionLoading, setActionLoading] = useState(false)
  // Track which row is currently being acted upon for per-row loading states
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'remind' | 'extend' | null>(null)

  // ═══════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchEvents()
    fetchResponses()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events')
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
      // Issue #35 FIX: Fetch based on tracking mode
      const statusParam = trackingMode === 'survey'
        ? 'status=shortlisted,survey_sent,survey_completed'
        : '' // All applications (no status filter)

      // Issue #41 FIX: Always filter by current event to prevent showing past responses from different events
      const eventParam = eventFilter !== 'all' ? `&event_id=${eventFilter}` : ''

      const url = `/api/admin/applications?${statusParam}${eventParam}&limit=1000`
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setResponses(result.data || [])
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to fetch responses' })
      }
    } catch (error) {
      console.error('Failed to fetch responses:', error)
      setAlert({ type: 'danger', message: 'An error occurred while fetching responses' })
    } finally {
      setLoading(false)
    }
  }

  // Issue #35 FIX: Re-fetch when tracking mode changes
  // Issue #41 FIX: Also re-fetch when event filter changes to prevent showing past responses
  useEffect(() => {
    fetchResponses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingMode, eventFilter])

  // ═══════════════════════════════════════════════════════════════════════
  // FILTER LOGIC
  // ═══════════════════════════════════════════════════════════════════════

  const filteredResponses = useMemo(() => {
    let filtered = responses

    // Event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(r => r.event_id === eventFilter)
    }

    // Response status filter
    const now = new Date()
    filtered = filtered.filter(response => {
      // ONLY survey_completed counts as responded - NOT completion_percentage
      // completion_percentage refers to the initial form, NOT the survey
      const hasResponded = response.status_v2 === 'survey_completed'
      const deadline = response.deadline_at ? new Date(response.deadline_at) : null
      const isExpired = deadline ? deadline < now : false
      const hoursUntilDeadline = deadline ? differenceInHours(deadline, now) : null
      const isApproaching = hoursUntilDeadline !== null && hoursUntilDeadline <= 48 && hoursUntilDeadline > 0

      switch (filter) {
        case 'responded':
          return hasResponded
        case 'not_responded':
          return !hasResponded && !isExpired
        case 'deadline_approaching':
          return !hasResponded && isApproaching
        case 'expired':
          return !hasResponded && isExpired
        default:
          return true
      }
    })

    return filtered
  }, [responses, filter, eventFilter])

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS (must be defined BEFORE columns useMemo)
  // ═══════════════════════════════════════════════════════════════════════

  // Open extend deadline modal
  const handleExtendDeadline = (applicationId: string) => {
    const response = responses.find(r => r.id === applicationId)
    if (response) {
      setExtendModal({
        isOpen: true,
        applicationId,
        applicationName: response.respondent_name,
        currentDeadline: response.deadline_at
      })
      setExtendDays(7)
    }
  }

  // Send reminder using the dedicated reminder API (uses template)
  const handleSendReminder = async (applicationId: string) => {
    const response = responses.find(r => r.id === applicationId)
    if (!response) return

    // Check if already completed - show clear error
    const hasResponded = response.status_v2 === 'survey_completed'
    if (hasResponded) {
      showError('Cannot Send Reminder', 'This applicant has already completed their survey.')
      return
    }

    // Confirm action
    const confirmed = await showConfirm(
      'Send Survey Reminder?',
      `Send reminder to ${response.respondent_name} (${response.respondent_email})?`
    )
    if (!confirmed) return

    // Set loading state for this specific row
    setLoadingRowId(applicationId)
    setLoadingAction('remind')
    setActionLoading(true)

    try {
      const apiResponse = await fetch(`/api/admin/applications/${applicationId}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await apiResponse.json()

      if (result.success) {
        showSuccess('Reminder Sent!', `Survey reminder sent to ${response.respondent_email}`)
        fetchResponses() // Refresh to update status if needed
      } else {
        showError('Failed to Send', result.error || 'Failed to send reminder')
      }
    } catch (error) {
      console.error('Send reminder error:', error)
      showError('Error', 'An error occurred while sending reminder')
    } finally {
      setLoadingRowId(null)
      setLoadingAction(null)
      setActionLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TABLE COLUMNS
  // ═══════════════════════════════════════════════════════════════════════

  const columns = useMemo<ColumnDef<SurveyResponse>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        accessorKey: 'respondent_name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <div className="fw-bold">{row.original.respondent_name}</div>
            <small className="text-muted">{row.original.respondent_email}</small>
          </div>
        ),
      },
      {
        accessorKey: 'event',
        header: 'Event',
        cell: ({ row }) => row.original.event?.title || 'N/A',
      },
      {
        accessorKey: 'shortlisted_at',
        header: 'Sent',
        cell: ({ row }) => {
          if (!row.original.shortlisted_at) return 'N/A'
          return formatDistanceToNow(new Date(row.original.shortlisted_at), { addSuffix: true })
        },
      },
      {
        accessorKey: 'deadline_at',
        header: 'Deadline',
        cell: ({ row }) => {
          if (!row.original.deadline_at) return 'N/A'
          const deadline = new Date(row.original.deadline_at)
          const now = new Date()
          const daysRemaining = differenceInDays(deadline, now)
          const hoursRemaining = differenceInHours(deadline, now)

          if (deadline < now) {
            return <span className="text-danger">Expired {formatDistanceToNow(deadline, { addSuffix: true })}</span>
          } else if (hoursRemaining <= 24) {
            return <span className="text-warning">{hoursRemaining}h remaining</span>
          } else {
            return <span className="text-info">{daysRemaining}d remaining</span>
          }
        },
      },
      {
        accessorKey: 'status_v2',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status_v2
          const deadline = row.original.deadline_at ? new Date(row.original.deadline_at) : null
          const isExpired = deadline ? deadline < new Date() : false

          // Issue #35 FIX: Show full status badge for all application modes
          const statusBadges: Record<string, { label: string; color: string }> = {
            submitted: { label: 'Submitted', color: 'bg-info' },
            in_review: { label: 'In Review', color: 'bg-primary' },
            shortlisted: { label: 'Shortlisted', color: 'bg-info' },
            survey_sent: { label: 'Survey Sent', color: 'bg-warning' },
            survey_completed: { label: 'Survey Done', color: 'bg-success' },
            approved: { label: 'Approved', color: 'bg-success' },
            rejected: { label: 'Rejected', color: 'bg-danger' },
            waitlisted: { label: 'Waitlisted', color: 'bg-secondary' },
            revoked: { label: 'Revoked', color: 'bg-dark' },
          }

          const badge = statusBadges[status] || { label: status || 'Unknown', color: 'bg-secondary' }

          if (status === 'survey_sent' && isExpired) {
            return <span className="badge bg-danger">Expired</span>
          }

          return <span className={`badge ${badge.color}`}>{badge.label}</span>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const hasResponded = row.original.status_v2 === 'survey_completed'
          const isLoadingRemind = loadingRowId === row.original.id && loadingAction === 'remind'
          const isLoadingExtend = loadingRowId === row.original.id && loadingAction === 'extend'
          const isAnyLoading = loadingRowId === row.original.id

          return (
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => router.push(`/admin/applications/${row.original.id}`)}
                disabled={isAnyLoading}
              >
                View
              </button>
              {!hasResponded && (
                <>
                  <button
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => handleSendReminder(row.original.id)}
                    title="Send Reminder"
                    disabled={isAnyLoading}
                  >
                    {isLoadingRemind ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="icofont-envelope me-1"></i>
                        Remind
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-info btn-sm"
                    onClick={() => handleExtendDeadline(row.original.id)}
                    title="Extend Deadline"
                    disabled={isAnyLoading}
                  >
                    {isLoadingExtend ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        Extending...
                      </>
                    ) : (
                      <>
                        <i className="icofont-clock-time me-1"></i>
                        Extend
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, loadingRowId, loadingAction, responses]
  )

  // ═══════════════════════════════════════════════════════════════════════
  // TABLE SETUP
  // ═══════════════════════════════════════════════════════════════════════

  const table = useReactTable({
    data: filteredResponses,
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
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  // Filter to only include non-completed applications for bulk actions
  const actionableRows = selectedRows.filter(row => {
    const hasResponded = row.original.status_v2 === 'survey_completed'
    return !hasResponded
  })
  const actionableCount = actionableRows.length

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL & BULK HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  // Execute deadline extension
  const executeExtendDeadline = async () => {
    if (!extendModal.applicationId) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/survey-deadlines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_id: extendModal.applicationId,
          extend_days: extendDays
        })
      })

      const result = await response.json()

      if (result.success) {
        showSuccess('Deadline Extended!', result.message || `Deadline extended by ${extendDays} days`)
        setExtendModal({ isOpen: false, applicationId: null, applicationName: '', currentDeadline: null })
        fetchResponses() // Refresh data
      } else {
        showError('Extension Failed', result.error?.message || 'Failed to extend deadline')
      }
    } catch (error) {
      console.error('Extend deadline error:', error)
      showError('Error', 'An error occurred while extending deadline')
    } finally {
      setActionLoading(false)
    }
  }

  // Bulk extend deadlines (only for non-completed applications)
  const handleBulkExtend = async () => {
    const selectedIds = actionableRows.map(row => row.original.id)
    if (selectedIds.length === 0) {
      showError('No Pending Applications', 'Please select applications that are still pending.')
      return
    }

    const confirmed = await showConfirm(
      'Extend Deadlines?',
      `Extend deadline by 7 days for ${selectedIds.length} pending application(s)?`
    )
    if (!confirmed) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/survey-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_ids: selectedIds,
          extend_days: 7
        })
      })

      const result = await response.json()

      if (result.success) {
        showSuccess('Deadlines Extended!', result.message || `Extended deadline for ${selectedIds.length} applications`)
        setRowSelection({})
        fetchResponses()
      } else {
        showError('Extension Failed', result.error?.message || 'Failed to extend deadlines')
      }
    } catch (error) {
      console.error('Bulk extend error:', error)
      showError('Error', 'An error occurred while extending deadlines')
    } finally {
      setActionLoading(false)
    }
  }

  // Bulk send reminders using dedicated reminder API (only for non-completed applications)
  const handleBulkRemind = async () => {
    const selectedIds = actionableRows.map(row => row.original.id)
    if (selectedIds.length === 0) {
      showError('No Pending Applications', 'Please select applications that are still pending.')
      return
    }

    // Confirm action
    const confirmed = await showConfirm(
      'Send Survey Reminders?',
      `Send reminders to ${selectedIds.length} pending applicant(s)?`
    )
    if (!confirmed) return

    setActionLoading(true)
    let successCount = 0
    let failCount = 0

    for (const id of selectedIds) {
      try {
        const apiResponse = await fetch(`/api/admin/applications/${id}/send-reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const result = await apiResponse.json()
        if (result.success) {
          successCount++
        } else {
          failCount++
          console.error(`Failed to send reminder to ${id}:`, result.error)
        }
      } catch (error) {
        failCount++
        console.error(`Error sending reminder to ${id}:`, error)
      }
    }

    if (failCount > 0) {
      showError('Partial Success', `Sent ${successCount} reminders, ${failCount} failed`)
    } else {
      showSuccess('Reminders Sent!', `Successfully sent ${successCount} reminder(s)`)
    }
    setRowSelection({})
    setActionLoading(false)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════════════

  const stats = useMemo(() => {
    const now = new Date()
    // IMPORTANT: Only survey_completed counts as "responded"
    // completion_percentage refers to the INITIAL form, NOT the survey
    return {
      total: responses.length,
      responded: responses.filter(r => r.status_v2 === 'survey_completed').length,
      notResponded: responses.filter(r => {
        const hasResponded = r.status_v2 === 'survey_completed'
        const deadline = r.deadline_at ? new Date(r.deadline_at) : null
        const isExpired = deadline ? deadline < now : false
        return !hasResponded && !isExpired
      }).length,
      approaching: responses.filter(r => {
        const hasResponded = r.status_v2 === 'survey_completed'
        const deadline = r.deadline_at ? new Date(r.deadline_at) : null
        const hoursRemaining = deadline ? differenceInHours(deadline, now) : null
        return !hasResponded && hoursRemaining !== null && hoursRemaining <= 48 && hoursRemaining > 0
      }).length,
      expired: responses.filter(r => {
        const hasResponded = r.status_v2 === 'survey_completed'
        const deadline = r.deadline_at ? new Date(r.deadline_at) : null
        const isExpired = deadline ? deadline < now : false
        return !hasResponded && isExpired
      }).length,
    }
  }, [responses])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>
              <i className="icofont-chart-line me-2"></i>
              Application Tracking
            </h2>
            <p className="text-muted">
              {trackingMode === 'survey'
                ? 'Track survey responses from shortlisted applicants'
                : 'Track all applications across all statuses'}
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            {/* Issue #35 FIX: Tracking mode toggle */}
            <div className="btn-group me-2 mb-2">
              <button
                className={`btn btn-sm ${trackingMode === 'survey' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTrackingMode('survey')}
              >
                <i className="icofont-paper me-1"></i>
                Survey Tracking
              </button>
              <button
                className={`btn btn-sm ${trackingMode === 'all_applications' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTrackingMode('all_applications')}
              >
                <i className="icofont-listine-dots me-1"></i>
                All Applications
              </button>
            </div>
            <button
              className="btn btn-secondary btn-sm mb-2"
              onClick={() => router.push('/admin/applications')}
            >
              <i className="icofont-arrow-left me-2"></i>
              Back
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card">
              <div className="card-body">
                <h6 className="text-muted">Total Forms</h6>
                <h3 className="mb-0">{stats.total}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-success">
              <div className="card-body">
                <h6 className="text-success">Responded</h6>
                <h3 className="mb-0 text-success">{stats.responded}</h3>
                <small className="text-muted">
                  {stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0}%
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-warning">
              <div className="card-body">
                <h6 className="text-warning">Pending</h6>
                <h3 className="mb-0 text-warning">{stats.notResponded}</h3>
                <small className="text-muted">
                  {stats.approaching} deadline approaching
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-danger">
              <div className="card-body">
                <h6 className="text-danger">Expired</h6>
                <h3 className="mb-0 text-danger">{stats.expired}</h3>
                <small className="text-muted">No response</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-4 mb-3 mb-md-0">
                <label className="form-label">Event Filter</label>
                <select
                  className="form-select"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                >
                  <option value="all">All Events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-8">
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'responded' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setFilter('responded')}
                  >
                    Responded ({stats.responded})
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'not_responded' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setFilter('not_responded')}
                  >
                    Pending ({stats.notResponded})
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'deadline_approaching' ? 'btn-info' : 'btn-outline-info'}`}
                    onClick={() => setFilter('deadline_approaching')}
                  >
                    Approaching ({stats.approaching})
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'expired' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setFilter('expired')}
                  >
                    Expired ({stats.expired})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="alert alert-info d-flex justify-content-between align-items-center">
            <span>
              <strong>{selectedCount}</strong> selected
              {actionableCount < selectedCount && (
                <span className="text-muted ms-2">
                  ({actionableCount} pending, {selectedCount - actionableCount} already completed)
                </span>
              )}
            </span>
            <div>
              <button
                className="btn btn-info btn-sm me-2"
                onClick={handleBulkExtend}
                disabled={actionLoading || actionableCount === 0}
                title={actionableCount === 0 ? 'No pending applications selected' : `Extend deadline for ${actionableCount} application(s)`}
              >
                {actionLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Extending...
                  </>
                ) : (
                  <>
                    <i className="icofont-clock-time me-2"></i>
                    Extend Deadlines (+7d)
                  </>
                )}
              </button>
              <button
                className="btn btn-warning btn-sm me-2"
                onClick={handleBulkRemind}
                disabled={actionLoading || actionableCount === 0}
                title={actionableCount === 0 ? 'No pending applications selected' : `Send reminders to ${actionableCount} application(s)`}
              >
                {actionLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="icofont-envelope me-2"></i>
                    Send Reminders
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setRowSelection({})}
                disabled={actionLoading}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Loading responses...</p>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-center py-5">
                <i className="icofont-inbox text-muted" style={{ fontSize: '48px' }}></i>
                <p className="text-muted mt-3">No application form responses found</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
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

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {table.getRowModel().rows.length} of {filteredResponses.length} responses
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
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

      {/* Extend Deadline Modal */}
      {extendModal.isOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Extend Deadline</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setExtendModal({ isOpen: false, applicationId: null, applicationName: '', currentDeadline: null })}
                />
              </div>
              <div className="modal-body">
                <p>
                  Extend deadline for <strong>{extendModal.applicationName}</strong>
                </p>
                {extendModal.currentDeadline && (
                  <p className="text-muted small">
                    Current deadline: {new Date(extendModal.currentDeadline).toLocaleDateString()}
                  </p>
                )}
                <div className="mb-3">
                  <label className="form-label">Extend by (days)</label>
                  <div className="btn-group w-100 mb-2" role="group">
                    {[3, 7, 14, 30].map(days => (
                      <button
                        key={days}
                        type="button"
                        className={`btn ${extendDays === days ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setExtendDays(days)}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    className="form-control"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value) || 7)}
                    min={1}
                    max={90}
                  />
                </div>
                <p className="text-muted small">
                  New deadline: <strong>{new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setExtendModal({ isOpen: false, applicationId: null, applicationName: '', currentDeadline: null })}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={executeExtendDeadline}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Extending...
                    </>
                  ) : (
                    'Extend Deadline'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
