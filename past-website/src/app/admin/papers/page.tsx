'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN PAPERS LIST PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and manage submitted papers
// Phase 9: Paper Submission & Review

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

interface Paper {
  id: string
  title: string
  abstract: string
  keywords: string[]
  paper_url: string
  status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
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
  reviewer: {
    id: string
    name: string
  } | null
}

interface Event {
  id: string
  title: string
  slug: string
}

const columnHelper = createColumnHelper<Paper>()

const statusColors: Record<string, string> = {
  submitted: 'bg-secondary',
  under_review: 'bg-warning text-dark',
  approved: 'bg-success',
  rejected: 'bg-danger',
}

const statusLabels: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function AdminPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'submitted_at', desc: true }
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')

  const supabase = createBrowserClient()

  // Fetch papers and events
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch events for filter
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, title, slug')
          .order('start_date', { ascending: false })

        setEvents(eventsData || [])

        // Fetch papers
        const { data: papersData, error: papersError } = await supabase
          .from('papers')
          .select(`
            *,
            user_profiles:user_id (id, name, email),
            events:event_id (id, title, slug),
            reviewer:reviewed_by (id, name)
          `)
          .order('submitted_at', { ascending: false })

        if (papersError) throw papersError
        setPapers(papersData || [])
      } catch (err) {
        console.error('Error fetching papers:', err)
        setError('Failed to load papers')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter papers
  const filteredPapers = useMemo(() => {
    let filtered = papers

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (eventFilter !== 'all') {
      filtered = filtered.filter(p => p.events?.id === eventFilter)
    }

    return filtered
  }, [papers, statusFilter, eventFilter])

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Paper Title',
        cell: info => (
          <div>
            <Link
              href={`/admin/papers/${info.row.original.id}`}
              className="fw-medium text-decoration-none"
            >
              {info.getValue().length > 50 ? info.getValue().substring(0, 50) + '...' : info.getValue()}
            </Link>
            {info.row.original.keywords && info.row.original.keywords.length > 0 && (
              <div className="mt-1">
                {info.row.original.keywords.slice(0, 3).map((kw, i) => (
                  <span key={i} className="badge bg-light text-dark me-1 small">
                    {kw}
                  </span>
                ))}
                {info.row.original.keywords.length > 3 && (
                  <span className="text-muted small">+{info.row.original.keywords.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor(row => row.user_profiles?.name || 'Unknown', {
        id: 'author',
        header: 'Author',
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
        cell: info => (
          <span className={`badge ${statusColors[info.getValue()]}`}>
            {statusLabels[info.getValue()]}
          </span>
        ),
      }),
      columnHelper.accessor('submitted_at', {
        header: 'Submitted',
        cell: info => (
          <span className="text-muted small">
            {new Date(info.getValue()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ),
      }),
      columnHelper.accessor(row => row.reviewer?.name || null, {
        id: 'reviewer',
        header: 'Reviewer',
        cell: info => {
          const value = info.getValue()
          return value ? (
            <span className="text-muted">{value}</span>
          ) : (
            <span className="text-muted fst-italic">Not assigned</span>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <div className="d-flex gap-2">
            <Link
              href={`/admin/papers/${info.row.original.id}`}
              className="btn btn-sm btn-primary"
            >
              <i className="icofont-eye-alt me-1"></i>
              Review
            </Link>
            {info.row.original.paper_url && (
              <a
                href={info.row.original.paper_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-secondary"
              >
                <i className="icofont-download"></i>
              </a>
            )}
          </div>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data: filteredPapers,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
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

  // Stats
  const stats = useMemo(() => {
    return {
      total: papers.length,
      submitted: papers.filter(p => p.status === 'submitted').length,
      under_review: papers.filter(p => p.status === 'under_review').length,
      approved: papers.filter(p => p.status === 'approved').length,
      rejected: papers.filter(p => p.status === 'rejected').length,
    }
  }, [papers])

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading papers...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="alert alert-danger" role="alert">
            <i className="icofont-warning me-2"></i>
            {error}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            <i className="icofont-paper me-2"></i>
            Paper Submissions
          </h1>
          <p className="text-muted mb-0">Review and manage submitted papers</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/paper-assignments" className="btn btn-primary">
            <i className="icofont-users-alt-4 me-2"></i>
            Assign to Reviewers
          </Link>
          <Link href="/admin" className="btn btn-outline-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md">
          <div className="card text-center">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.total}</h3>
              <small className="text-muted">Total Papers</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card text-center bg-secondary text-white">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.submitted}</h3>
              <small>Submitted</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card text-center bg-warning">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.under_review}</h3>
              <small>Under Review</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card text-center bg-success text-white">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.approved}</h3>
              <small>Approved</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card text-center bg-danger text-white">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.rejected}</h3>
              <small>Rejected</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label small">Search</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="icofont-search-1"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search papers..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label small">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">Event</label>
              <select
                className="form-select"
                value={eventFilter}
                onChange={e => setEventFilter(e.target.value)}
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setGlobalFilter('')
                  setStatusFilter('all')
                  setEventFilter('all')
                }}
              >
                <i className="icofont-refresh me-1"></i>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Papers Table */}
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
                        onClick={header.column.getToggleSortingHandler()}
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
                      <i className="icofont-paper d-block mb-2" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                      <h5>No Papers Found</h5>
                      <p className="mb-0">No papers match your current filters.</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
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

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredPapers.length
              )}{' '}
              of {filteredPapers.length} papers
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <i className="icofont-arrow-left"></i>
              </button>
              <button className="btn btn-outline-primary btn-sm" disabled>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </button>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <i className="icofont-arrow-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  )
}
