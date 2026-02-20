'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER PERFORMANCE TABLE
// ═══════════════════════════════════════════════════════════════════════
// Shows reviewer statistics and activity
// Phase 12: Analytics & Reporting

import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'

interface ReviewerPerformance {
  id: string
  name: string
  email: string
  applications_reviewed: number
  approved: number
  rejected: number
  avg_review_time_minutes: number
  last_active: string | null
}

interface ReviewerPerformanceTableProps {
  data: ReviewerPerformance[]
}

const columnHelper = createColumnHelper<ReviewerPerformance>()

export function ReviewerPerformanceTable({ data }: ReviewerPerformanceTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'applications_reviewed', desc: true }
  ])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Reviewer',
        cell: info => (
          <div>
            <div className="fw-medium">{info.getValue()}</div>
            <div className="small text-muted">{info.row.original.email}</div>
          </div>
        ),
      }),
      columnHelper.accessor('applications_reviewed', {
        header: 'Reviews',
        cell: info => (
          <span className="badge bg-primary fs-6">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('approved', {
        header: 'Approved',
        cell: info => (
          <span className="text-success fw-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('rejected', {
        header: 'Rejected',
        cell: info => (
          <span className="text-danger fw-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor(row => {
        const total = row.approved + row.rejected
        return total > 0 ? ((row.approved / total) * 100).toFixed(1) : 0
      }, {
        id: 'approval_rate',
        header: 'Approval Rate',
        cell: info => {
          const rate = Number(info.getValue())
          let badgeClass = 'bg-secondary'
          if (rate >= 70) badgeClass = 'bg-success'
          else if (rate >= 40) badgeClass = 'bg-warning'
          else if (rate > 0) badgeClass = 'bg-danger'
          return (
            <span className={`badge ${badgeClass}`}>{info.getValue()}%</span>
          )
        },
      }),
      columnHelper.accessor('avg_review_time_minutes', {
        header: 'Avg Review Time',
        cell: info => {
          const minutes = info.getValue()
          if (minutes < 60) {
            return `${minutes.toFixed(0)} min`
          }
          const hours = Math.floor(minutes / 60)
          const mins = Math.round(minutes % 60)
          return `${hours}h ${mins}m`
        },
      }),
      columnHelper.accessor('last_active', {
        header: 'Last Active',
        cell: info => {
          const date = info.getValue()
          if (!date) return <span className="text-muted">Never</span>

          const lastActive = new Date(date)
          const now = new Date()
          const diffHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60))

          let statusClass = 'text-success'
          let statusText = 'Active now'

          if (diffHours > 168) { // 7 days
            statusClass = 'text-danger'
            statusText = lastActive.toLocaleDateString()
          } else if (diffHours > 24) {
            statusClass = 'text-warning'
            statusText = `${Math.floor(diffHours / 24)} days ago`
          } else if (diffHours > 0) {
            statusClass = 'text-info'
            statusText = `${diffHours} hours ago`
          }

          return <span className={statusClass}>{statusText}</span>
        },
      }),
    ],
    []
  )

  const table = useReactTable({
    data,
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
  })

  // Calculate team stats
  const teamStats = useMemo(() => {
    const totalReviews = data.reduce((sum, r) => sum + r.applications_reviewed, 0)
    const totalApproved = data.reduce((sum, r) => sum + r.approved, 0)
    const totalRejected = data.reduce((sum, r) => sum + r.rejected, 0)
    const avgTime = data.length > 0
      ? data.reduce((sum, r) => sum + r.avg_review_time_minutes, 0) / data.length
      : 0

    return {
      totalReviewers: data.length,
      totalReviews,
      totalApproved,
      totalRejected,
      avgTime: avgTime.toFixed(0),
      overallApprovalRate: (totalApproved + totalRejected) > 0
        ? ((totalApproved / (totalApproved + totalRejected)) * 100).toFixed(1)
        : 0
    }
  }, [data])

  return (
    <div className="reviewer-performance-container">
      {/* Team Summary */}
      <div className="team-summary mb-4">
        <h6 className="mb-3">
          <i className="icofont-users-alt-4 me-2"></i>
          Team Performance Summary
        </h6>
        <div className="row g-3">
          <div className="col-6 col-md-2">
            <div className="summary-card text-center p-3 bg-light rounded">
              <div className="summary-value h4 mb-0">{teamStats.totalReviewers}</div>
              <div className="summary-label small text-muted">Reviewers</div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="summary-card text-center p-3 bg-light rounded">
              <div className="summary-value h4 mb-0">{teamStats.totalReviews}</div>
              <div className="summary-label small text-muted">Total Reviews</div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="summary-card text-center p-3 bg-light rounded">
              <div className="summary-value h4 mb-0 text-success">{teamStats.totalApproved}</div>
              <div className="summary-label small text-muted">Approved</div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="summary-card text-center p-3 bg-light rounded">
              <div className="summary-value h4 mb-0 text-danger">{teamStats.totalRejected}</div>
              <div className="summary-label small text-muted">Rejected</div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="summary-card text-center p-3 bg-light rounded">
              <div className="summary-value h4 mb-0">{teamStats.overallApprovalRate}%</div>
              <div className="summary-label small text-muted">Approval Rate</div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="summary-card text-center p-3 bg-light rounded">
              <div className="summary-value h4 mb-0">{teamStats.avgTime}m</div>
              <div className="summary-label small text-muted">Avg Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="table-controls mb-3">
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text">
            <i className="icofont-search-1"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search reviewers..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
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
                  <i className="icofont-users-alt-4 d-block mb-2" style={{ fontSize: '2rem' }}></i>
                  No reviewers assigned yet
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .reviewer-performance-container {
          padding: 1rem;
        }
        .summary-card {
          transition: transform 0.2s;
        }
        .summary-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

export default ReviewerPerformanceTable
