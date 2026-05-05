'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER PAPERS PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and review papers assigned to the reviewer
// Supports blind review mode (author info hidden based on event settings)

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

interface AssignedPaper {
  id: string
  paper_id: string
  reviewer_id: string
  event_id: string
  review_status: string
  assigned_at: string
  reviewed_at: string | null
  papers: {
    id: string
    title: string
    abstract: string
    keywords: string[]
    status: string
    submitted_at: string
    user_id: string
    paper_url: string
  }
  events: {
    id: string
    title: string
    paper_review_mode: string
  }
  // Author info (only populated if not blind review)
  author?: {
    id: string
    name: string
    email: string
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'warning', label: 'Pending' },
    in_progress: { color: 'info', label: 'In Progress' },
    completed: { color: 'success', label: 'Completed' },
  }

  const config = statusConfig[status] || { color: 'secondary', label: status }

  return (
    <span className={`badge bg-${config.color}`}>
      {config.label}
    </span>
  )
}

export default function ReviewerPapersPage() {
  const [assignments, setAssignments] = useState<AssignedPaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const supabase = createBrowserClient()

  useEffect(() => {
    if (user?.id) {
      fetchAssignedPapers()
    }
  }, [user?.id])

  async function fetchAssignedPapers() {
    try {
      setLoading(true)
      setError(null)

      // Fetch assignments for the current reviewer
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('paper_reviewer_assignments')
        .select(`
          *,
          papers (
            id,
            title,
            abstract,
            keywords,
            status,
            submitted_at,
            user_id,
            paper_url
          ),
          events (
            id,
            title,
            paper_review_mode
          )
        `)
        .eq('reviewer_id', user?.id)
        .order('assigned_at', { ascending: false })

      if (assignmentsError) throw assignmentsError

      // For non-blind reviews, fetch author info via API (bypasses RLS)
      const nonBlindAssignments = (assignmentsData || []).filter(
        (a: any) => a.events?.paper_review_mode === 'open'
      )

      if (nonBlindAssignments.length > 0) {
        const authorIds = Array.from(new Set(nonBlindAssignments.map((a: any) => a.papers?.user_id).filter(Boolean)))
        const eventIds = Array.from(new Set(nonBlindAssignments.map((a: any) => a.event_id).filter(Boolean)))

        if (authorIds.length > 0 && eventIds.length > 0) {
          // Use API to fetch author info (handles RLS securely)
          const response = await fetch('/api/reviewer/paper-authors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authorIds, eventId: eventIds[0] })
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              const authorMap = new Map(result.data.map((a: any) => [a.id, a]))

              // Merge author info into non-blind assignments
              assignmentsData?.forEach((assignment: any) => {
                if (assignment.events?.paper_review_mode === 'open' && assignment.papers?.user_id) {
                  assignment.author = authorMap.get(assignment.papers.user_id)
                }
              })
            }
          }
        }
      }

      setAssignments(assignmentsData || [])
    } catch (err: any) {
      console.error('Error fetching assigned papers:', err)
      setError(err.message || 'Failed to load assigned papers')
    } finally {
      setLoading(false)
    }
  }

  // Stats
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.review_status === 'pending').length,
    inProgress: assignments.filter(a => a.review_status === 'in_progress').length,
    completed: assignments.filter(a => a.review_status === 'completed').length,
  }

  return (
    <DashboardLayout allowedRoles={['reviewer']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">
              <i className="icofont-paper me-2"></i>
              My Paper Reviews
            </h1>
            <p className="text-muted mb-0">Review papers assigned to you</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card text-center">
              <div className="card-body py-3">
                <h3 className="mb-0">{stats.total}</h3>
                <small className="text-muted">Total Assigned</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card text-center border-warning">
              <div className="card-body py-3">
                <h3 className="mb-0 text-warning">{stats.pending}</h3>
                <small className="text-muted">Pending</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card text-center border-info">
              <div className="card-body py-3">
                <h3 className="mb-0 text-info">{stats.inProgress}</h3>
                <small className="text-muted">In Progress</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card text-center border-success">
              <div className="card-body py-3">
                <h3 className="mb-0 text-success">{stats.completed}</h3>
                <small className="text-muted">Completed</small>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mb-4">
            <i className="icofont-warning me-2"></i>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0">Loading assigned papers...</p>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="icofont-paper text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3">No Papers Assigned</h5>
              <p className="text-muted mb-0">You don't have any papers assigned for review yet.</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Assigned Papers</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Paper</th>
                    <th>Event</th>
                    <th>Author</th>
                    <th>Status</th>
                    <th>Assigned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const isBlindReview = assignment.events?.paper_review_mode !== 'open'

                    return (
                      <tr key={assignment.id}>
                        <td>
                          <div className="fw-medium">{assignment.papers?.title || 'Unknown'}</div>
                          {assignment.papers?.keywords && assignment.papers.keywords.length > 0 && (
                            <small className="text-muted">
                              {assignment.papers.keywords.slice(0, 3).join(', ')}
                              {assignment.papers.keywords.length > 3 && '...'}
                            </small>
                          )}
                        </td>
                        <td>
                          <small>{assignment.events?.title || 'Unknown'}</small>
                          <div>
                            {isBlindReview ? (
                              <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                <i className="icofont-eye-blocked me-1"></i>
                                Blind Review
                              </span>
                            ) : (
                              <span className="badge bg-info" style={{ fontSize: '0.65rem' }}>
                                <i className="icofont-eye me-1"></i>
                                Open Review
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {isBlindReview ? (
                            <span className="text-muted fst-italic">
                              <i className="icofont-eye-blocked me-1"></i>
                              Hidden
                            </span>
                          ) : assignment.author ? (
                            <div>
                              <div className="fw-medium">{assignment.author.name}</div>
                              <small className="text-muted">{assignment.author.email}</small>
                            </div>
                          ) : (
                            <span className="text-muted">Unknown</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={assignment.review_status} />
                        </td>
                        <td>
                          <small className="text-muted">
                            {assignment.assigned_at
                              ? formatDistanceToNow(new Date(assignment.assigned_at), { addSuffix: true })
                              : 'Unknown'
                            }
                          </small>
                        </td>
                        <td>
                          <Link
                            href={`/reviewer/papers/${assignment.paper_id}`}
                            className="btn btn-sm btn-primary"
                          >
                            <i className="icofont-eye me-1"></i>
                            Review
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
