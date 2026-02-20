'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
// Dashboard for reviewers with paper and application review capabilities

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

interface ReviewerStats {
  papers: {
    total: number
    pending: number
    in_progress: number
    completed: number
    average_score: number
  }
  applications: {
    total: number
    pending: number
    reviewed: number
    approved: number
    rejected: number
    events_assigned: number
  }
  recent_activity: {
    paper_reviews: Array<{
      id: string
      review_status: string
      reviewed_at: string
      papers: {
        id: string
        title: string
      }
    }>
  }
}

export default function ReviewerDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReviewerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchStats()
    }
  }, [user?.id])

  async function fetchStats() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/reviewer/stats')
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || 'Failed to load statistics')
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={['reviewer']}>
      <div className="container-fluid">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-2">Reviewer Dashboard</h2>
            <p className="text-muted">
              Review papers and evaluate applications assigned to you
            </p>
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
          <div className="row g-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="card">
                  <div className="card-body">
                    <div className="placeholder-glow">
                      <span className="placeholder col-6 mb-2"></span>
                      <span className="placeholder col-4 d-block" style={{ height: '2rem' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Paper Review Stats */}
            <div className="row mb-3">
              <div className="col-12">
                <h5 className="text-muted">
                  <i className="icofont-paper me-2"></i>
                  Paper Reviews
                </h5>
              </div>
            </div>
            <div className="row g-4 mb-4">
              <div className="col-md-6 col-lg-3">
                <div className="card stat-card border-primary">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="stat-label">Pending Papers</span>
                      <span style={{ fontSize: '2rem' }}>📝</span>
                    </div>
                    <div className="stat-value text-primary">{stats?.papers.pending || 0}</div>
                    <p className="text-muted small mb-0 mt-2">
                      Papers awaiting your review
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card stat-card border-warning">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="stat-label">In Progress</span>
                      <span style={{ fontSize: '2rem' }}>✏️</span>
                    </div>
                    <div className="stat-value text-warning">{stats?.papers.in_progress || 0}</div>
                    <p className="text-muted small mb-0 mt-2">
                      Paper reviews in progress
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card stat-card border-success">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="stat-label">Completed</span>
                      <span style={{ fontSize: '2rem' }}>✅</span>
                    </div>
                    <div className="stat-value text-success">{stats?.papers.completed || 0}</div>
                    <p className="text-muted small mb-0 mt-2">
                      Completed paper reviews
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card stat-card border-info">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="stat-label">Average Score</span>
                      <span style={{ fontSize: '2rem' }}>⭐</span>
                    </div>
                    <div className="stat-value text-info">{stats?.papers.average_score || 0}</div>
                    <p className="text-muted small mb-0 mt-2">
                      Your average review score
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Review Stats */}
            {stats?.applications.events_assigned && stats.applications.events_assigned > 0 && (
              <>
                <div className="row mb-3">
                  <div className="col-12">
                    <h5 className="text-muted">
                      <i className="icofont-users me-2"></i>
                      Application Reviews ({stats.applications.events_assigned} event{stats.applications.events_assigned > 1 ? 's' : ''})
                    </h5>
                  </div>
                </div>
                <div className="row g-4 mb-4">
                  <div className="col-md-6 col-lg-3">
                    <div className="card stat-card border-secondary">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="stat-label">Total Applications</span>
                          <span style={{ fontSize: '2rem' }}>📋</span>
                        </div>
                        <div className="stat-value text-secondary">{stats?.applications.total || 0}</div>
                        <p className="text-muted small mb-0 mt-2">
                          Applications in your events
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <div className="card stat-card border-primary">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="stat-label">Pending Review</span>
                          <span style={{ fontSize: '2rem' }}>⏳</span>
                        </div>
                        <div className="stat-value text-primary">{stats?.applications.pending || 0}</div>
                        <p className="text-muted small mb-0 mt-2">
                          Awaiting admin decision
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <div className="card stat-card border-success">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="stat-label">Approved</span>
                          <span style={{ fontSize: '2rem' }}>✅</span>
                        </div>
                        <div className="stat-value text-success">{stats?.applications.approved || 0}</div>
                        <p className="text-muted small mb-0 mt-2">
                          Approved by admin
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <div className="card stat-card border-danger">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="stat-label">Rejected</span>
                          <span style={{ fontSize: '2rem' }}>❌</span>
                        </div>
                        <div className="stat-value text-danger">{stats?.applications.rejected || 0}</div>
                        <p className="text-muted small mb-0 mt-2">
                          Rejected by admin
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Recent Activity */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Recent Paper Review Activity</h5>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : stats?.recent_activity.paper_reviews && stats.recent_activity.paper_reviews.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {stats.recent_activity.paper_reviews.map((review) => (
                      <div key={review.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <div>
                          <i className="icofont-check-circled text-success me-2"></i>
                          Reviewed: <strong>{review.papers?.title || 'Unknown Paper'}</strong>
                        </div>
                        <small className="text-muted">
                          {review.reviewed_at
                            ? formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true })
                            : 'Unknown time'}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="icofont-clock-time" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
                    <p className="mb-0 mt-2">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Quick Actions</h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <Link href="/reviewer/papers" className="btn btn-primary w-100">
                      <span className="me-2">📝</span>
                      Review Papers
                    </Link>
                  </div>
                  {stats?.applications.events_assigned && stats.applications.events_assigned > 0 && (
                    <div className="col-md-4">
                      <Link href="/reviewer/applications" className="btn btn-info w-100 text-white">
                        <span className="me-2">📋</span>
                        View Applications
                      </Link>
                    </div>
                  )}
                  <div className="col-md-4">
                    <Link href="/events" className="btn btn-success w-100">
                      <span className="me-2">📅</span>
                      View Events
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
