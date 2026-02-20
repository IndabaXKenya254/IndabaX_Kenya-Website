'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAPER REVIEW PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and submit review for an assigned paper
// Supports blind review mode (author info hidden based on event settings)

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

interface PaperDetails {
  id: string
  title: string
  abstract: string
  keywords: string[]
  status: string
  submitted_at: string
  paper_url: string
  user_id: string
}

interface AssignmentDetails {
  id: string
  paper_id: string
  reviewer_id: string
  event_id: string
  review_status: string
  assigned_at: string
  reviewed_at: string | null
  review_score: number | null
  review_comments: string | null
  review_recommendation: string | null
  papers: PaperDetails
  events: {
    id: string
    title: string
    paper_review_mode: string
  }
  author?: {
    id: string
    name: string
    email: string
  }
}

export default function PaperReviewPage() {
  const params = useParams()
  const router = useRouter()
  const paperId = params.id as string

  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Review form state
  const [score, setScore] = useState<number>(5)
  const [comments, setComments] = useState('')
  const [recommendation, setRecommendation] = useState<string>('accept')

  const { user } = useAuth()
  const supabase = createBrowserClient()

  useEffect(() => {
    if (user?.id && paperId) {
      fetchPaperDetails()
    }
  }, [user?.id, paperId])

  async function fetchPaperDetails() {
    try {
      setLoading(true)
      setError(null)

      // Fetch assignment with paper and event details
      const { data: assignmentData, error: assignmentError } = await supabase
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
            paper_url,
            user_id
          ),
          events (
            id,
            title,
            paper_review_mode
          )
        `)
        .eq('paper_id', paperId)
        .eq('reviewer_id', user?.id)
        .single()

      if (assignmentError) {
        if (assignmentError.code === 'PGRST116') {
          throw new Error('You are not assigned to review this paper')
        }
        throw assignmentError
      }

      if (!assignmentData) {
        throw new Error('Paper assignment not found')
      }

      // Pre-fill form if review exists
      if (assignmentData.review_score !== null) {
        setScore(assignmentData.review_score)
      }
      if (assignmentData.review_comments) {
        setComments(assignmentData.review_comments)
      }
      if (assignmentData.review_recommendation) {
        setRecommendation(assignmentData.review_recommendation)
      }

      // Fetch author info for open reviews
      if (assignmentData.events?.paper_review_mode === 'open' && assignmentData.papers?.user_id) {
        const response = await fetch('/api/reviewer/paper-authors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authorIds: [assignmentData.papers.user_id],
            eventId: assignmentData.event_id
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.length > 0) {
            assignmentData.author = result.data[0]
          }
        }
      }

      setAssignment(assignmentData)
    } catch (err: any) {
      console.error('Error fetching paper details:', err)
      setError(err.message || 'Failed to load paper details')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()

    if (!assignment) return

    try {
      setSubmitting(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('paper_reviewer_assignments')
        .update({
          review_score: score,
          review_comments: comments,
          review_recommendation: recommendation,
          review_status: 'completed',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', assignment.id)

      if (updateError) throw updateError

      setSubmitSuccess(true)

      // Update local state
      setAssignment(prev => prev ? {
        ...prev,
        review_score: score,
        review_comments: comments,
        review_recommendation: recommendation,
        review_status: 'completed',
        reviewed_at: new Date().toISOString()
      } : null)

    } catch (err: any) {
      console.error('Error submitting review:', err)
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveDraft() {
    if (!assignment) return

    try {
      setSubmitting(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('paper_reviewer_assignments')
        .update({
          review_score: score,
          review_comments: comments,
          review_recommendation: recommendation,
          review_status: 'in_progress'
        })
        .eq('id', assignment.id)

      if (updateError) throw updateError

      // Update local state
      setAssignment(prev => prev ? {
        ...prev,
        review_score: score,
        review_comments: comments,
        review_recommendation: recommendation,
        review_status: 'in_progress'
      } : null)

      alert('Draft saved successfully!')

    } catch (err: any) {
      console.error('Error saving draft:', err)
      setError(err.message || 'Failed to save draft')
    } finally {
      setSubmitting(false)
    }
  }

  const isBlindReview = assignment?.events?.paper_review_mode !== 'open'
  const isCompleted = assignment?.review_status === 'completed'

  return (
    <DashboardLayout allowedRoles={['reviewer']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link href="/reviewer/papers" className="btn btn-outline-secondary btn-sm mb-2">
              <i className="icofont-arrow-left me-1"></i>
              Back to Papers
            </Link>
            <h1 className="h3 mb-1">
              <i className="icofont-paper me-2"></i>
              Paper Review
            </h1>
          </div>
          {assignment && (
            <div>
              {isBlindReview ? (
                <span className="badge bg-warning text-dark">
                  <i className="icofont-eye-blocked me-1"></i>
                  Blind Review
                </span>
              ) : (
                <span className="badge bg-info">
                  <i className="icofont-eye me-1"></i>
                  Open Review
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mb-4">
            <i className="icofont-warning me-2"></i>
            {error}
          </div>
        )}

        {/* Success Alert */}
        {submitSuccess && (
          <div className="alert alert-success mb-4">
            <i className="icofont-check-circled me-2"></i>
            Review submitted successfully!
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0">Loading paper details...</p>
            </div>
          </div>
        ) : !assignment ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="icofont-warning text-danger" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3">Paper Not Found</h5>
              <p className="text-muted mb-3">This paper doesn't exist or you're not assigned to review it.</p>
              <Link href="/reviewer/papers" className="btn btn-primary">
                Back to Papers
              </Link>
            </div>
          </div>
        ) : (
          <div className="row">
            {/* Paper Details */}
            <div className="col-lg-8">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Paper Details</h5>
                </div>
                <div className="card-body">
                  <h4 className="mb-3">{assignment.papers?.title}</h4>

                  {/* Keywords */}
                  {assignment.papers?.keywords && assignment.papers.keywords.length > 0 && (
                    <div className="mb-3">
                      {assignment.papers.keywords.map((keyword, idx) => (
                        <span key={idx} className="badge bg-secondary me-1">{keyword}</span>
                      ))}
                    </div>
                  )}

                  {/* Abstract */}
                  <div className="mb-4">
                    <h6 className="text-muted">Abstract</h6>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.papers?.abstract || 'No abstract provided'}</p>
                  </div>

                  {/* Paper Download */}
                  {assignment.papers?.paper_url && (
                    <div className="mb-3">
                      <a
                        href={assignment.papers.paper_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        <i className="icofont-download me-2"></i>
                        Download Paper
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Form */}
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    {isCompleted ? 'Your Review' : 'Submit Review'}
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmitReview}>
                    {/* Score */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">Score (1-10)</label>
                      <input
                        type="range"
                        className="form-range"
                        min="1"
                        max="10"
                        value={score}
                        onChange={(e) => setScore(parseInt(e.target.value))}
                        disabled={isCompleted}
                      />
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">1 (Poor)</span>
                        <span className="badge bg-primary fs-5">{score}</span>
                        <span className="text-muted small">10 (Excellent)</span>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">Recommendation</label>
                      <div className="btn-group w-100" role="group">
                        <input
                          type="radio"
                          className="btn-check"
                          name="recommendation"
                          id="rec-accept"
                          value="accept"
                          checked={recommendation === 'accept'}
                          onChange={(e) => setRecommendation(e.target.value)}
                          disabled={isCompleted}
                        />
                        <label className="btn btn-outline-success" htmlFor="rec-accept">
                          <i className="icofont-check-circled me-1"></i>
                          Accept
                        </label>

                        <input
                          type="radio"
                          className="btn-check"
                          name="recommendation"
                          id="rec-revise"
                          value="revise"
                          checked={recommendation === 'revise'}
                          onChange={(e) => setRecommendation(e.target.value)}
                          disabled={isCompleted}
                        />
                        <label className="btn btn-outline-warning" htmlFor="rec-revise">
                          <i className="icofont-refresh me-1"></i>
                          Revise
                        </label>

                        <input
                          type="radio"
                          className="btn-check"
                          name="recommendation"
                          id="rec-reject"
                          value="reject"
                          checked={recommendation === 'reject'}
                          onChange={(e) => setRecommendation(e.target.value)}
                          disabled={isCompleted}
                        />
                        <label className="btn btn-outline-danger" htmlFor="rec-reject">
                          <i className="icofont-close-circled me-1"></i>
                          Reject
                        </label>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">Review Comments</label>
                      <textarea
                        className="form-control"
                        rows={8}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide detailed feedback on the paper's strengths, weaknesses, and suggestions for improvement..."
                        disabled={isCompleted}
                        required
                      />
                    </div>

                    {/* Submit Buttons */}
                    {!isCompleted && (
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleSaveDraft}
                          disabled={submitting}
                        >
                          <i className="icofont-save me-1"></i>
                          Save Draft
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submitting || !comments.trim()}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <i className="icofont-check me-1"></i>
                              Submit Review
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="alert alert-info mb-0">
                        <i className="icofont-info-circle me-2"></i>
                        This review has been submitted and cannot be modified.
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              {/* Assignment Info */}
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">Assignment Details</h6>
                </div>
                <div className="card-body">
                  <dl className="mb-0">
                    <dt className="text-muted small">Event</dt>
                    <dd>{assignment.events?.title}</dd>

                    <dt className="text-muted small">Assigned</dt>
                    <dd>
                      {assignment.assigned_at
                        ? formatDistanceToNow(new Date(assignment.assigned_at), { addSuffix: true })
                        : 'Unknown'}
                    </dd>

                    <dt className="text-muted small">Status</dt>
                    <dd>
                      <span className={`badge bg-${
                        assignment.review_status === 'completed' ? 'success' :
                        assignment.review_status === 'in_progress' ? 'info' : 'warning'
                      }`}>
                        {assignment.review_status === 'completed' ? 'Completed' :
                         assignment.review_status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </dd>

                    {assignment.reviewed_at && (
                      <>
                        <dt className="text-muted small">Reviewed</dt>
                        <dd>
                          {formatDistanceToNow(new Date(assignment.reviewed_at), { addSuffix: true })}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              {/* Author Info (Open Review Only) */}
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">Author Information</h6>
                </div>
                <div className="card-body">
                  {isBlindReview ? (
                    <div className="text-center text-muted py-3">
                      <i className="icofont-eye-blocked" style={{ fontSize: '2rem' }}></i>
                      <p className="mb-0 mt-2">Hidden for blind review</p>
                    </div>
                  ) : assignment.author ? (
                    <dl className="mb-0">
                      <dt className="text-muted small">Name</dt>
                      <dd>{assignment.author.name}</dd>
                      <dt className="text-muted small">Email</dt>
                      <dd>{assignment.author.email}</dd>
                    </dl>
                  ) : (
                    <p className="text-muted mb-0">Author information unavailable</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
