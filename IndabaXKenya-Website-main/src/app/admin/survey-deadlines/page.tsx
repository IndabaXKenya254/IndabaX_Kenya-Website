'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SURVEY DEADLINE MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage and extend survey deadlines per user
// Phase 5: Form System - Per-User Deadline Extension

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

interface SurveyResponse {
  id: string
  response_type: string
  status: string
  deadline_at: string | null
  started_at: string | null
  last_saved_at: string | null
  completion_percentage: number | null
  user_id: string
  event_id: string
  user_profiles: {
    id: string
    name: string
    email: string
  } | null
  events: {
    id: string
    title: string
    slug: string
  } | null
}

interface Event {
  id: string
  title: string
  slug: string
}

const columnHelper = createColumnHelper<SurveyResponse>()

export default function SurveyDeadlinesPage() {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'deadline_at', desc: false }
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('in_progress')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Extension Modal
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [extendDays, setExtendDays] = useState(7)
  const [customDeadline, setCustomDeadline] = useState('')
  const [extensionType, setExtensionType] = useState<'days' | 'date'>('days')
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const supabase = createBrowserClient()

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch events
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, title, slug')
          .order('start_date', { ascending: false })

        setEvents(eventsData || [])

        // Fetch surveys
        let query = supabase
          .from('form_responses')
          .select(`
            id,
            response_type,
            status,
            deadline_at,
            started_at,
            last_saved_at,
            completion_percentage,
            user_id,
            event_id,
            user_profiles:user_id (id, name, email),
            events:event_id (id, title, slug)
          `)
          .eq('response_type', 'detailed_survey')
          .order('deadline_at', { ascending: true, nullsFirst: false })

        const { data: surveysData, error: surveysError } = await query

        if (surveysError) throw surveysError
        // Transform the data to handle Supabase's array return format for relations
        const transformedData = (surveysData || []).map(item => ({
          ...item,
          user_profiles: Array.isArray(item.user_profiles) ? item.user_profiles[0] || null : item.user_profiles,
          events: Array.isArray(item.events) ? item.events[0] || null : item.events,
        })) as unknown as SurveyResponse[]
        setSurveys(transformedData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load surveys')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter surveys
  const filteredSurveys = useMemo(() => {
    let filtered = surveys

    if (eventFilter !== 'all') {
      filtered = filtered.filter(s => s.event_id === eventFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    return filtered
  }, [surveys, eventFilter, statusFilter])

  // Check if deadline is soon (within 3 days) or past
  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return { status: 'none', class: 'text-muted' }

    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) {
      return { status: 'overdue', class: 'text-danger' }
    } else if (diffHours < 72) {
      return { status: 'soon', class: 'text-warning' }
    }
    return { status: 'ok', class: 'text-success' }
  }

  // Extend deadline for single survey
  const handleExtendSingle = async (surveyId: string) => {
    setSelectedSurveyId(surveyId)
    setShowExtendModal(true)
  }

  // Extend deadline for selected surveys
  const handleExtendSelected = () => {
    setSelectedSurveyId(null)
    setShowExtendModal(true)
  }

  // Execute extension
  const handleExtend = async () => {
    setSaving(true)
    try {
      const idsToExtend = selectedSurveyId
        ? [selectedSurveyId]
        : Object.keys(rowSelection).map(idx => filteredSurveys[parseInt(idx)].id)

      const body: Record<string, unknown> = {
        response_ids: idsToExtend,
      }

      if (extensionType === 'days') {
        body.extend_days = extendDays
      } else {
        body.new_deadline = customDeadline
      }

      const response = await fetch('/api/survey-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed to extend deadline')

      // Refresh data
      const { data: refreshedData } = await supabase
        .from('form_responses')
        .select(`
          id,
          response_type,
          status,
          deadline_at,
          started_at,
          last_saved_at,
          completion_percentage,
          user_id,
          event_id,
          user_profiles:user_id (id, name, email),
          events:event_id (id, title, slug)
        `)
        .eq('response_type', 'detailed_survey')
        .order('deadline_at', { ascending: true, nullsFirst: false })

      // Transform the data to handle Supabase's array return format for relations
      const transformedData = (refreshedData || []).map(item => ({
        ...item,
        user_profiles: Array.isArray(item.user_profiles) ? item.user_profiles[0] || null : item.user_profiles,
        events: Array.isArray(item.events) ? item.events[0] || null : item.events,
      })) as unknown as SurveyResponse[]
      setSurveys(transformedData)
      setShowExtendModal(false)
      setRowSelection({})
      setSuccessMessage(result.message)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error extending deadline:', err)
      setError('Failed to extend deadline')
    } finally {
      setSaving(false)
    }
  }

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.display({
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
      }),
      columnHelper.accessor(row => row.user_profiles?.name || 'Unknown', {
        id: 'user',
        header: 'User',
        cell: info => (
          <div>
            <div className="fw-medium">{info.getValue()}</div>
            <div className="small text-muted">{info.row.original.user_profiles?.email}</div>
          </div>
        ),
      }),
      columnHelper.accessor(row => row.events?.title || 'No Event', {
        id: 'event',
        header: 'Event',
        cell: info => (
          <span className="badge bg-info">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const status = info.getValue()
          const colors: Record<string, string> = {
            draft: 'bg-secondary',
            in_progress: 'bg-warning text-dark',
            completed: 'bg-success',
            submitted: 'bg-primary',
          }
          return (
            <span className={`badge ${colors[status] || 'bg-secondary'}`}>
              {status.replace('_', ' ')}
            </span>
          )
        },
      }),
      columnHelper.accessor('completion_percentage', {
        header: 'Progress',
        cell: info => {
          const percentage = info.getValue() || 0
          return (
            <div className="d-flex align-items-center gap-2">
              <div className="progress" style={{ width: '80px', height: '8px' }}>
                <div
                  className={`progress-bar ${percentage >= 100 ? 'bg-success' : 'bg-primary'}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <small className="text-muted">{percentage}%</small>
            </div>
          )
        },
      }),
      columnHelper.accessor('deadline_at', {
        header: 'Deadline',
        cell: info => {
          const deadline = info.getValue()
          if (!deadline) {
            return <span className="text-muted fst-italic">No deadline</span>
          }
          const { status, class: statusClass } = getDeadlineStatus(deadline)
          return (
            <div className={statusClass}>
              <div className="fw-medium">
                {new Date(deadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <small>
                {new Date(deadline).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {status === 'overdue' && ' (Overdue)'}
                {status === 'soon' && ' (Soon)'}
              </small>
            </div>
          )
        },
      }),
      columnHelper.accessor('last_saved_at', {
        header: 'Last Activity',
        cell: info => {
          const date = info.getValue()
          if (!date) return <span className="text-muted">Never</span>
          const lastActive = new Date(date)
          const now = new Date()
          const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <span className={diffDays > 7 ? 'text-danger' : 'text-muted'}>
              {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => handleExtendSingle(info.row.original.id)}
          >
            <i className="icofont-clock-time me-1"></i>
            Extend
          </button>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data: filteredSurveys,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  })

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    return {
      total: filteredSurveys.length,
      overdue: filteredSurveys.filter(s => s.deadline_at && new Date(s.deadline_at) < now).length,
      dueSoon: filteredSurveys.filter(s => {
        if (!s.deadline_at) return false
        const deadline = new Date(s.deadline_at)
        const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
        return diffHours >= 0 && diffHours < 72
      }).length,
      noDeadline: filteredSurveys.filter(s => !s.deadline_at).length,
    }
  }, [filteredSurveys])

  const selectedCount = Object.keys(rowSelection).length

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="icofont-check-circled me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="icofont-warning me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            <i className="icofont-clock-time me-2"></i>
            Application Form Deadlines
          </h1>
          <p className="text-muted mb-0">Manage and extend application form deadlines per user</p>
        </div>
        <div className="d-flex gap-2">
          {selectedCount > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleExtendSelected}
            >
              <i className="icofont-clock-time me-2"></i>
              Extend Selected ({selectedCount})
            </button>
          )}
          <Link href="/admin" className="btn btn-outline-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Dashboard
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.total}</h3>
              <small className="text-muted">Total Forms</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center bg-danger text-white">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.overdue}</h3>
              <small>Overdue</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center bg-warning">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.dueSoon}</h3>
              <small>Due Soon (72h)</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center bg-secondary text-white">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.noDeadline}</h3>
              <small>No Deadline</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="icofont-search-1"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search users..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={eventFilter}
                onChange={e => setEventFilter(e.target.value)}
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setGlobalFilter('')
                  setEventFilter('all')
                  setStatusFilter('in_progress')
                  setRowSelection({})
                }}
              >
                <i className="icofont-refresh me-1"></i>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                        className="px-3"
                      >
                        <div className="d-flex align-items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() && (
                            <i className={`icofont-arrow-${header.column.getIsSorted() === 'desc' ? 'down' : 'up'}`}></i>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-5 text-muted">
                      <i className="icofont-clock-time d-block mb-2" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                      <h5>No Forms Found</h5>
                      <p className="mb-0">No forms match your current filters.</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={row.getIsSelected() ? 'table-active' : ''}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Extend Deadline Modal */}
      {showExtendModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="icofont-clock-time me-2"></i>
                  Extend Deadline
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowExtendModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  {selectedSurveyId
                    ? 'Extend deadline for this survey'
                    : `Extend deadline for ${selectedCount} selected surveys`}
                </p>

                <div className="mb-3">
                  <div className="btn-group w-100" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="extensionType"
                      id="byDays"
                      checked={extensionType === 'days'}
                      onChange={() => setExtensionType('days')}
                    />
                    <label className="btn btn-outline-primary" htmlFor="byDays">
                      Extend by Days
                    </label>
                    <input
                      type="radio"
                      className="btn-check"
                      name="extensionType"
                      id="byDate"
                      checked={extensionType === 'date'}
                      onChange={() => setExtensionType('date')}
                    />
                    <label className="btn btn-outline-primary" htmlFor="byDate">
                      Set Specific Date
                    </label>
                  </div>
                </div>

                {extensionType === 'days' ? (
                  <div className="mb-3">
                    <label className="form-label">Extend by (days)</label>
                    <div className="d-flex gap-2">
                      {[3, 7, 14, 30].map(days => (
                        <button
                          key={days}
                          type="button"
                          className={`btn ${extendDays === days ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setExtendDays(days)}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <input
                        type="number"
                        className="form-control"
                        value={extendDays}
                        onChange={e => setExtendDays(parseInt(e.target.value) || 7)}
                        min={1}
                        max={365}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label">New Deadline Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={customDeadline}
                      onChange={e => setCustomDeadline(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowExtendModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExtend}
                  disabled={saving || (extensionType === 'date' && !customDeadline)}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="icofont-check me-2"></i>
                  )}
                  Extend Deadline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  )
}
