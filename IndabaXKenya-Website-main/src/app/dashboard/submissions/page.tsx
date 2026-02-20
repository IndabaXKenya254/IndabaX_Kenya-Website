'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - MY SUBMISSIONS DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
// View submitted papers, check review status, and see feedback

import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { showSuccess, showError, showLoading, closeAlert, showValidationError } from '@/lib/sweetalert'

interface EventData {
  id: string
  title: string
  slug: string
  start_date: string
  location: string
}

interface Paper {
  id: string
  event_id: string
  title: string
  abstract: string
  keywords: string[]
  paper_url: string
  status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  review_notes: string | null
  rating: number | null
  supplementary_files: any
  events: EventData | EventData[] | null
}

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-secondary', icon: 'icofont-clock-time' },
  under_review: { label: 'Under Review', color: 'bg-warning', icon: 'icofont-eye' },
  approved: { label: 'Approved', color: 'bg-success', icon: 'icofont-check-circled' },
  rejected: { label: 'Rejected', color: 'bg-danger', icon: 'icofont-close-circled' }
}

// Helper to get event data (handles both object and array from Supabase)
const getEvent = (events: Paper['events']): EventData | null => {
  if (!events) return null
  if (Array.isArray(events)) return events[0] || null
  return events
}

export default function SubmissionsPage() {
  const { user } = useAuth()
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Form state
  const [events, setEvents] = useState<EventData[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    organization: '',
    bio: '',
    linkedin: '',
    eventId: '',
    submissionType: 'talk',
    title: '',
    abstract: '',
    keywords: '',
    track: '',
    agreeToTerms: false,
  })

  useEffect(() => {
    if (user) {
      fetchPapers()
      fetchEvents()
    }
  }, [user])

  const fetchPapers = async () => {
    try {
      const supabase = createBrowserClient()

      const { data, error: fetchError } = await supabase
        .from('papers')
        .select(`
          id,
          event_id,
          title,
          abstract,
          keywords,
          paper_url,
          status,
          submitted_at,
          reviewed_at,
          review_notes,
          rating,
          supplementary_files,
          events (
            id,
            title,
            slug,
            start_date,
            location
          )
        `)
        .eq('user_id', user?.id)
        .order('submitted_at', { ascending: false })

      if (fetchError) throw fetchError

      setPapers(data || [])
    } catch (err) {
      console.error('Error fetching papers:', err)
      setError('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderRating = (rating: number | null) => {
    if (rating === null) return <span className="text-muted">Not rated</span>

    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{ color: i <= rating ? '#ffc107' : '#e0e0e0', fontSize: '1.2rem' }}
        >
          ★
        </span>
      )
    }
    return <span>{stars}</span>
  }

  const getTrackLabel = (track: string) => {
    const tracks: Record<string, string> = {
      nlp: 'Natural Language Processing',
      cv: 'Computer Vision',
      rl: 'Reinforcement Learning',
      healthcare: 'Healthcare AI',
      agriculture: 'AgriTech AI',
      climate: 'Climate & Environment',
      ethics: 'AI Ethics & Fairness',
      other: 'Other'
    }
    return tracks[track] || track
  }

  // Fetch available events for submission
  const fetchEvents = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, title, slug, start_date, location')
        .in('status', ['published', 'upcoming'])
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })

      if (fetchError) throw fetchError
      setEvents(data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setLoadingEvents(false)
    }
  }

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        showError('Invalid File', 'Please upload a PDF file only.')
        e.target.value = ''
        return
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        showError('File Too Large', 'Maximum file size is 10MB.')
        e.target.value = ''
        return
      }

      setSelectedFile(file)
      setUploadProgress(0)
    }
  }

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null

    const formDataUpload = new FormData()
    formDataUpload.append('file', selectedFile)

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await fetch('/api/papers/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      clearInterval(progressInterval)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Upload failed')
      }

      setUploadProgress(100)
      return result.data.path
    } catch (error) {
      clearInterval(progressInterval)
      setUploadProgress(0)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const errors = []
    if (!formData.name.trim()) errors.push('Name is required')
    if (!formData.email.trim()) errors.push('Email is required')
    if (!formData.organization.trim()) errors.push('Organization is required')
    if (!formData.eventId) errors.push('Please select an event')
    if (!formData.title.trim()) errors.push('Submission title is required')
    if (!formData.abstract.trim()) errors.push('Abstract is required')
    if (!formData.track.trim()) errors.push('Please select a track')
    if (!selectedFile) errors.push('Please upload your paper (PDF)')
    if (!formData.agreeToTerms) errors.push('You must agree to the terms and conditions')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address')
    }

    if (errors.length > 0) {
      showValidationError(errors)
      return
    }

    setIsSubmitting(true)
    showLoading('Uploading your paper...')

    try {
      const paperPath = await uploadFile()

      if (!paperPath) {
        throw new Error('Failed to upload paper file')
      }

      closeAlert()
      showLoading('Submitting your paper...')

      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: formData.eventId,
          title: formData.title,
          abstract: formData.abstract,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
          paper_url: paperPath,
          supplementary_files: {
            presenter_name: formData.name,
            presenter_bio: formData.bio,
            linkedin: formData.linkedin,
            organization: formData.organization,
            submission_type: formData.submissionType,
            track: formData.track,
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Submission failed')
      }

      closeAlert()

      await showSuccess(
        'Submission Received!',
        `Thank you for your submission! Your paper ID is: ${result.data.id.slice(0, 8)}...\n\nYou can track your submission status in your dashboard.`,
        5000
      )

      // Reset form and close modal
      setUploadProgress(0)
      setSelectedFile(null)
      setFormData({
        name: '',
        email: user?.email || '',
        organization: '',
        bio: '',
        linkedin: '',
        eventId: '',
        submissionType: 'talk',
        title: '',
        abstract: '',
        keywords: '',
        track: '',
        agreeToTerms: false,
      })
      setShowModal(false)

      // Refresh papers list
      fetchPapers()
    } catch (error: any) {
      console.error('Submission error:', error)
      closeAlert()
      showError('Submission Failed', error.message || 'An error occurred while submitting your paper.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={['applicant', 'speaker', 'admin', 'reviewer']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-2">My Paper Submissions</h2>
                <p className="text-muted">
                  Track your submitted papers and view reviewer feedback
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                <i className="icofont-plus me-2"></i>
                New Submission
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your submissions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger">
            <i className="icofont-warning me-2"></i>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && papers.length === 0 && (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="icofont-paper" style={{ fontSize: '4rem', color: '#ccc' }}></i>
              <h4 className="mt-3">No Submissions Yet</h4>
              <p className="text-muted mb-4">
                You have not submitted any papers. Share your research with the IndabaX Kenya community!
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary btn-lg"
              >
                <i className="icofont-paper-plane me-2"></i>
                Submit Your First Paper
              </button>
            </div>
          </div>
        )}

        {/* Papers List */}
        {!loading && papers.length > 0 && (
          <div className="row">
            {papers.map((paper) => {
              const status = statusConfig[paper.status]
              const isExpanded = expandedPaper === paper.id
              const supplementary = paper.supplementary_files || {}

              return (
                <div key={paper.id} className="col-12 mb-4">
                  <div className="card shadow-sm">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="card-title mb-1">{paper.title}</h5>
                        <small className="text-muted">
                          {getEvent(paper.events)?.title || 'Unknown Event'} | Submitted {formatDate(paper.submitted_at)}
                        </small>
                      </div>
                      <span className={`badge ${status.color} px-3 py-2`}>
                        <i className={`${status.icon} me-1`}></i>
                        {status.label}
                      </span>
                    </div>

                    <div className="card-body">
                      {/* Quick Info Row */}
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <small className="text-muted d-block">Type</small>
                          <strong className="text-capitalize">
                            {supplementary.submission_type || 'Paper'}
                          </strong>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">Track</small>
                          <strong>{getTrackLabel(supplementary.track || 'other')}</strong>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">Rating</small>
                          {renderRating(paper.rating)}
                        </div>
                      </div>

                      {/* Keywords */}
                      {paper.keywords && paper.keywords.length > 0 && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">Keywords</small>
                          {paper.keywords.map((keyword, idx) => (
                            <span key={idx} className="badge bg-light text-dark me-1">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Review Feedback (if available) */}
                      {paper.status === 'approved' && (
                        <div className="alert alert-success mb-3">
                          <h6 className="alert-heading">
                            <i className="icofont-check-circled me-2"></i>
                            Congratulations! Your paper has been approved!
                          </h6>
                          {paper.review_notes && (
                            <p className="mb-0">{paper.review_notes}</p>
                          )}
                          {!paper.review_notes && (
                            <p className="mb-0">
                              You will receive a speaker ticket for this event. Check your tickets page.
                            </p>
                          )}
                        </div>
                      )}

                      {paper.status === 'rejected' && paper.review_notes && (
                        <div className="alert alert-warning mb-3">
                          <h6 className="alert-heading">
                            <i className="icofont-info-circle me-2"></i>
                            Reviewer Feedback
                          </h6>
                          <p className="mb-0">{paper.review_notes}</p>
                        </div>
                      )}

                      {paper.status === 'under_review' && (
                        <div className="alert alert-info mb-3">
                          <i className="icofont-eye me-2"></i>
                          Your paper is currently being reviewed. We will notify you when the review is complete.
                        </div>
                      )}

                      {/* Toggle Abstract */}
                      <button
                        className="btn btn-link p-0 text-primary"
                        onClick={() => setExpandedPaper(isExpanded ? null : paper.id)}
                      >
                        {isExpanded ? (
                          <>
                            <i className="icofont-simple-up me-1"></i>
                            Hide Abstract
                          </>
                        ) : (
                          <>
                            <i className="icofont-simple-down me-1"></i>
                            Show Abstract
                          </>
                        )}
                      </button>

                      {/* Abstract (Expanded) */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-light rounded">
                          <h6 className="mb-2">Abstract</h6>
                          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                            {paper.abstract}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="card-footer bg-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          {getEvent(paper.events) && (
                            <Link
                              href={`/events/${getEvent(paper.events)?.slug}`}
                              className="btn btn-sm btn-outline-secondary me-2"
                            >
                              <i className="icofont-calendar me-1"></i>
                              View Event
                            </Link>
                          )}
                        </div>
                        <small className="text-muted">
                          Paper ID: {paper.id.slice(0, 8)}...
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Submission Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">New Paper Submission</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  ></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {/* Event Selection */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">Select Event *</label>
                      <select
                        name="eventId"
                        value={formData.eventId}
                        onChange={handleFormChange}
                        className="form-select"
                        required
                        disabled={loadingEvents || isSubmitting}
                      >
                        <option value="">Choose an event...</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title} - {new Date(event.start_date).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Presenter Information */}
                    <h6 className="text-primary mb-3">Presenter Information</h6>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          className="form-control"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          className="form-control"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Organization *</label>
                        <input
                          type="text"
                          name="organization"
                          value={formData.organization}
                          onChange={handleFormChange}
                          className="form-control"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">LinkedIn (optional)</label>
                        <input
                          type="url"
                          name="linkedin"
                          value={formData.linkedin}
                          onChange={handleFormChange}
                          className="form-control"
                          placeholder="https://linkedin.com/in/yourprofile"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Brief Bio (optional)</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleFormChange}
                        className="form-control"
                        rows={3}
                        placeholder="Tell us about yourself (2-3 sentences)"
                        disabled={isSubmitting}
                      ></textarea>
                    </div>

                    {/* Submission Details */}
                    <h6 className="text-primary mb-3">Submission Details</h6>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Submission Type *</label>
                        <select
                          name="submissionType"
                          value={formData.submissionType}
                          onChange={handleFormChange}
                          className="form-select"
                          required
                          disabled={isSubmitting}
                        >
                          <option value="talk">Talk (15-20 min)</option>
                          <option value="workshop">Workshop (45-60 min)</option>
                          <option value="poster">Poster Presentation</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Track *</label>
                        <select
                          name="track"
                          value={formData.track}
                          onChange={handleFormChange}
                          className="form-select"
                          required
                          disabled={isSubmitting}
                        >
                          <option value="">Choose a track...</option>
                          <option value="nlp">Natural Language Processing</option>
                          <option value="cv">Computer Vision</option>
                          <option value="rl">Reinforcement Learning</option>
                          <option value="healthcare">Healthcare AI</option>
                          <option value="agriculture">AgriTech AI</option>
                          <option value="climate">Climate & Environment</option>
                          <option value="ethics">AI Ethics & Fairness</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        className="form-control"
                        placeholder="Give your submission a compelling title"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Abstract *</label>
                      <textarea
                        name="abstract"
                        value={formData.abstract}
                        onChange={handleFormChange}
                        className="form-control"
                        rows={5}
                        placeholder="Provide a clear and concise abstract (250-500 words)"
                        required
                        disabled={isSubmitting}
                      ></textarea>
                      <small className="text-muted">
                        Characters: {formData.abstract.length}
                      </small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Keywords (optional)</label>
                      <input
                        type="text"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleFormChange}
                        className="form-control"
                        placeholder="machine learning, neural networks, AI (comma-separated)"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* File Upload */}
                    <div className="mb-3">
                      <label className="form-label">Upload Paper (PDF) *</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="form-control"
                        required={!selectedFile}
                        disabled={isSubmitting}
                      />
                      {selectedFile && (
                        <small className="text-success d-block mt-1">
                          <i className="icofont-check-circled me-1"></i>
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </small>
                      )}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="progress mt-2" style={{ height: '20px' }}>
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            style={{ width: `${uploadProgress}%` }}
                          >
                            {uploadProgress}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleFormChange}
                        className="form-check-input"
                        id="agreeToTerms"
                        required
                        disabled={isSubmitting}
                      />
                      <label className="form-check-label" htmlFor="agreeToTerms">
                        I agree that my submission may be published and presented at IndabaX Kenya *
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting || !selectedFile}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <i className="icofont-paper-plane me-2"></i>
                          Submit Paper
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
