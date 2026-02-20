'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAPER REVIEW PAGE
// ═══════════════════════════════════════════════════════════════════════
// View paper details and approve/reject with notes
// Phase 9: Paper Submission & Review

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

interface Paper {
  id: string
  title: string
  abstract: string
  keywords: string[]
  paper_url: string
  supplementary_files: Record<string, string>[] | null
  status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  review_notes: string | null
  rating: number | null
  submitted_at: string
  reviewed_at: string | null
  updated_at: string
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
    email: string
  } | null
  registrations: {
    id: string
    status: string
  } | null
}

interface ReviewerAssignment {
  id: string
  review_status: string
  review_score: number | null
  review_recommendation: string | null
  review_comments: string | null
  assigned_at: string
  reviewed_at: string | null
  reviewer: {
    id: string
    name: string
    email: string
  }
  events: {
    id: string
    title: string
    paper_review_mode: string
  }
}

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

export default function PaperReviewPage() {
  const params = useParams()
  const router = useRouter()
  const paperId = params.id as string

  const [paper, setPaper] = useState<Paper | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [reviewerAssignments, setReviewerAssignments] = useState<ReviewerAssignment[]>([])

  const supabase = createBrowserClient()

  // Fetch paper details and reviewer assignments
  useEffect(() => {
    async function fetchPaper() {
      try {
        const { data, error: fetchError } = await supabase
          .from('papers')
          .select(`
            *,
            user_profiles:user_id (id, name, email),
            events:event_id (id, title, slug),
            reviewer:reviewed_by (id, name, email),
            registrations:registration_id (id, status)
          `)
          .eq('id', paperId)
          .single()

        if (fetchError) throw fetchError
        setPaper(data)
        setReviewNotes(data.review_notes || '')
        setRating(data.rating || 0)

        // Fetch reviewer assignments for this paper
        const { data: assignments, error: assignmentsError } = await supabase
          .from('paper_reviewer_assignments')
          .select(`
            id,
            review_status,
            review_score,
            review_recommendation,
            review_comments,
            assigned_at,
            reviewed_at,
            reviewer_id,
            events (id, title, paper_review_mode)
          `)
          .eq('paper_id', paperId)
          .order('assigned_at', { ascending: false })

        if (!assignmentsError && assignments) {
          // Fetch reviewer profiles separately
          const reviewerIds = Array.from(new Set(assignments.map((a: any) => a.reviewer_id).filter(Boolean)))
          if (reviewerIds.length > 0) {
            const { data: reviewers } = await supabase
              .from('user_profiles')
              .select('id, name, email')
              .in('id', reviewerIds)

            const reviewerMap = new Map((reviewers || []).map(r => [r.id, r]))

            const enrichedAssignments = assignments.map((a: any) => ({
              ...a,
              reviewer: reviewerMap.get(a.reviewer_id) || null
            }))
            setReviewerAssignments(enrichedAssignments as unknown as ReviewerAssignment[])
          } else {
            setReviewerAssignments(assignments as unknown as ReviewerAssignment[])
          }
        }
      } catch (err) {
        console.error('Error fetching paper:', err)
        setError('Failed to load paper')
      } finally {
        setLoading(false)
      }
    }

    if (paperId) {
      fetchPaper()
    }
  }, [paperId])

  // Start review (change status to under_review)
  const handleStartReview = async () => {
    if (!paper) return

    setSaving(true)
    try {
      const response = await fetch(`/api/papers/${paper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'under_review' }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed to start review')

      setPaper(prev => prev ? { ...prev, status: 'under_review' } : null)
      setSuccessMessage('Review started')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error starting review:', err)
      setError('Failed to start review')
    } finally {
      setSaving(false)
    }
  }

  // Save review notes
  const handleSaveNotes = async () => {
    if (!paper) return

    setSaving(true)
    try {
      const response = await fetch(`/api/papers/${paper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: reviewNotes, rating }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed to save notes')

      setPaper(prev => prev ? { ...prev, review_notes: reviewNotes, rating } : null)
      setSuccessMessage('Notes saved')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error saving notes:', err)
      setError('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  // Approve paper
  const handleApprove = async () => {
    if (!paper) return
    if (!confirm('Are you sure you want to approve this paper?')) return

    setSaving(true)
    try {
      const response = await fetch(`/api/papers/${paper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          review_notes: reviewNotes,
          rating,
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed to approve paper')

      setSuccessMessage('Paper approved successfully!')
      setTimeout(() => router.push('/admin/papers'), 2000)
    } catch (err) {
      console.error('Error approving paper:', err)
      setError('Failed to approve paper')
    } finally {
      setSaving(false)
    }
  }

  // Reject paper
  const handleReject = async () => {
    if (!paper) return
    if (!reviewNotes.trim()) {
      alert('Please provide review notes explaining the rejection reason.')
      return
    }
    if (!confirm('Are you sure you want to reject this paper?')) return

    setSaving(true)
    try {
      const response = await fetch(`/api/papers/${paper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          review_notes: reviewNotes,
          rating,
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed to reject paper')

      setSuccessMessage('Paper rejected')
      setTimeout(() => router.push('/admin/papers'), 2000)
    } catch (err) {
      console.error('Error rejecting paper:', err)
      setError('Failed to reject paper')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading paper...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !paper) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="alert alert-danger" role="alert">
            <i className="icofont-warning me-2"></i>
            {error}
          </div>
          <Link href="/admin/papers" className="btn btn-outline-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Papers
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (!paper) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="alert alert-warning" role="alert">
            <i className="icofont-warning me-2"></i>
            Paper not found
          </div>
          <Link href="/admin/papers" className="btn btn-outline-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Papers
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Success/Error Messages */}
        {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="icofont-check-circled me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="icofont-warning me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <Link href="/admin/papers" className="btn btn-outline-secondary btn-sm mb-2">
            <i className="icofont-arrow-left me-1"></i>
            Back to Papers
          </Link>
          <h1 className="h3 mb-1">
            <i className="icofont-paper me-2"></i>
            Paper Review
          </h1>
          <span className={`badge ${statusColors[paper.status]} fs-6`}>
            {statusLabels[paper.status]}
          </span>
        </div>
        <div className="d-flex gap-2">
          {paper.paper_url && (
            <a
              href={paper.paper_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <i className="icofont-download me-2"></i>
              Download Paper
            </a>
          )}
        </div>
      </div>

      <div className="row">
        {/* Paper Details */}
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="icofont-info-circle me-2"></i>
                Paper Details
              </h5>
            </div>
            <div className="card-body">
              <h4 className="mb-3">{paper.title}</h4>

              <div className="mb-4">
                <h6 className="text-muted">Abstract</h6>
                <p className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                  {paper.abstract}
                </p>
              </div>

              {paper.keywords && paper.keywords.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-muted">Keywords</h6>
                  <div>
                    {paper.keywords.map((kw, i) => (
                      <span key={i} className="badge bg-primary me-2 mb-1">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {paper.supplementary_files && paper.supplementary_files.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-muted">Supplementary Files</h6>
                  <ul className="list-unstyled">
                    {paper.supplementary_files.map((file, i) => (
                      <li key={i} className="mb-1">
                        <a href={Object.values(file)[0]} target="_blank" rel="noopener noreferrer">
                          <i className="icofont-file-alt me-2"></i>
                          {Object.keys(file)[0]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Reviewer Feedback Section */}
          {reviewerAssignments.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="icofont-users-alt-4 me-2"></i>
                  Reviewer Feedback ({reviewerAssignments.length})
                </h5>
              </div>
              <div className="card-body">
                {reviewerAssignments.map((assignment, index) => (
                  <div key={assignment.id} className={index > 0 ? 'mt-4 pt-4 border-top' : ''}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <strong>{assignment.reviewer?.name || 'Unknown Reviewer'}</strong>
                        <div className="text-muted small">{assignment.reviewer?.email}</div>
                      </div>
                      <div className="text-end">
                        <span className={`badge ${
                          assignment.review_status === 'completed' ? 'bg-success' :
                          assignment.review_status === 'in_progress' ? 'bg-info' : 'bg-warning'
                        }`}>
                          {assignment.review_status === 'completed' ? 'Completed' :
                           assignment.review_status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                        <div className="text-muted small mt-1">
                          {assignment.events?.paper_review_mode === 'open' ? 'Open Review' : 'Blind Review'}
                        </div>
                      </div>
                    </div>

                    {assignment.review_status === 'completed' && (
                      <>
                        {/* Score and Recommendation */}
                        <div className="row mb-3">
                          <div className="col-sm-6">
                            <div className="bg-light p-3 rounded">
                              <div className="text-muted small mb-1">Score</div>
                              <div className="h4 mb-0">
                                {assignment.review_score !== null ? (
                                  <span className={`text-${
                                    assignment.review_score >= 7 ? 'success' :
                                    assignment.review_score >= 4 ? 'warning' : 'danger'
                                  }`}>
                                    {assignment.review_score}/10
                                  </span>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="bg-light p-3 rounded">
                              <div className="text-muted small mb-1">Recommendation</div>
                              <div className="h5 mb-0">
                                {assignment.review_recommendation === 'accept' && (
                                  <span className="badge bg-success fs-6">
                                    <i className="icofont-check-circled me-1"></i>
                                    Accept
                                  </span>
                                )}
                                {assignment.review_recommendation === 'revise' && (
                                  <span className="badge bg-warning text-dark fs-6">
                                    <i className="icofont-refresh me-1"></i>
                                    Revise
                                  </span>
                                )}
                                {assignment.review_recommendation === 'reject' && (
                                  <span className="badge bg-danger fs-6">
                                    <i className="icofont-close-circled me-1"></i>
                                    Reject
                                  </span>
                                )}
                                {!assignment.review_recommendation && (
                                  <span className="text-muted">N/A</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Comments */}
                        {assignment.review_comments && (
                          <div className="mb-3">
                            <div className="text-muted small mb-1">Review Comments</div>
                            <div className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                              {assignment.review_comments}
                            </div>
                          </div>
                        )}

                        {/* Review Date */}
                        {assignment.reviewed_at && (
                          <div className="text-muted small">
                            <i className="icofont-clock-time me-1"></i>
                            Reviewed on {new Date(assignment.reviewed_at).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {assignment.review_status !== 'completed' && (
                      <div className="text-muted fst-italic">
                        <i className="icofont-info-circle me-1"></i>
                        Review not yet submitted
                        {assignment.assigned_at && (
                          <span className="ms-2">
                            (Assigned on {new Date(assignment.assigned_at).toLocaleDateString('en-US', { dateStyle: 'medium' })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Section */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="icofont-pencil-alt-2 me-2"></i>
                Admin Review
              </h5>
              {paper.status === 'submitted' && (
                <button
                  className="btn btn-warning btn-sm"
                  onClick={handleStartReview}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : (
                    <i className="icofont-play me-1"></i>
                  )}
                  Start Review
                </button>
              )}
            </div>
            <div className="card-body">
              {/* Rating */}
              <div className="mb-4">
                <label className="form-label">Rating (Optional)</label>
                <div className="d-flex gap-2 align-items-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        color: rating >= star ? '#ffc107' : '#6c757d',
                        opacity: rating >= star ? 1 : 0.5,
                      }}
                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <i className="icofont-star"></i>
                    </button>
                  ))}
                  {rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setRating(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6c757d',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        marginLeft: '0.5rem',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Review Notes */}
              <div className="mb-4">
                <label className="form-label">Review Notes</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Enter your review notes, feedback, or reasons for approval/rejection..."
                />
                <div className="form-text">
                  These notes will be stored with the review. Required for rejection.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleSaveNotes}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : (
                    <i className="icofont-save me-1"></i>
                  )}
                  Save Notes
                </button>
                {['submitted', 'under_review'].includes(paper.status) && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={handleApprove}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="spinner-border spinner-border-sm me-1"></span>
                      ) : (
                        <i className="icofont-check me-1"></i>
                      )}
                      Approve Paper
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleReject}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="spinner-border spinner-border-sm me-1"></span>
                      ) : (
                        <i className="icofont-close me-1"></i>
                      )}
                      Reject Paper
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Author Info */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="icofont-user me-2"></i>
                Author Information
              </h6>
            </div>
            <div className="card-body">
              <p className="mb-1">
                <strong>{paper.user_profiles?.name || 'Unknown'}</strong>
              </p>
              <p className="text-muted mb-0">
                <i className="icofont-envelope me-1"></i>
                {paper.user_profiles?.email || 'No email'}
              </p>
            </div>
          </div>

          {/* Event Info */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="icofont-calendar me-2"></i>
                Event
              </h6>
            </div>
            <div className="card-body">
              <p className="mb-0">
                <span className="badge bg-info">{paper.events?.title || 'No Event'}</span>
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="icofont-clock-time me-2"></i>
                Timeline
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <small className="text-muted">Submitted:</small>
                  <div>
                    {new Date(paper.submitted_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </li>
                {paper.reviewed_at && (
                  <li className="mb-2">
                    <small className="text-muted">Reviewed:</small>
                    <div>
                      {new Date(paper.reviewed_at).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </li>
                )}
                {paper.reviewer && (
                  <li className="mb-0">
                    <small className="text-muted">Reviewed by:</small>
                    <div>{paper.reviewer.name}</div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="icofont-history me-2"></i>
                Status
              </h6>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${statusColors[paper.status]} fs-6`}>
                  {statusLabels[paper.status]}
                </span>
                {paper.rating !== null && paper.rating > 0 && (
                  <span className="badge bg-warning text-dark">
                    <i className="icofont-star me-1"></i>
                    {paper.rating}/5
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
