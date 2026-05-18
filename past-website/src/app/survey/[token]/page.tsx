'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SURVEY PAGE (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════
// Token-based survey access for shortlisted applicants

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { getSwal } from '@/lib/sweetalert'
import { FormRenderer } from '@/components/forms/FormRenderer'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface SurveyData {
  response: any
  template: any
  questions: any[]
  answers: any[]
  event: any
  user: any
  timeRemaining: number | null
  canResume: boolean
  showProgress: boolean
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function SurveyPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // ═══════════════════════════════════════════════════════════════════
  // Fetch survey data on mount
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchSurveyData()
  }, [token])

  const fetchSurveyData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/survey/${token}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.message || result.error || 'Failed to load survey')
        setLoading(false)
        return
      }

      setSurveyData(result.data)
      setTimeRemaining(result.data.timeRemaining)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch survey:', err)
      setError('Failed to load survey. Please try again.')
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Countdown timer
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  // ═══════════════════════════════════════════════════════════════════
  // Format time remaining
  // ═══════════════════════════════════════════════════════════════════

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired'

    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s remaining`
    } else {
      return `${secs}s remaining`
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Auto-save handler
  // ═══════════════════════════════════════════════════════════════════

  const handleAutoSave = async (responses: Record<string, any>) => {
    try {
      const response = await fetch(`/api/survey/${token}/save`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      })

      const result = await response.json()

      if (!result.success) {
        console.error('Auto-save failed:', result.error)
        throw new Error(result.error)
      }

      // Update survey data with new completion percentage
      if (surveyData && result.data) {
        setSurveyData(prev => prev ? {
          ...prev,
          response: {
            ...prev.response,
            completion_percentage: result.data.completionPercentage,
            last_saved_at: result.data.lastSavedAt
          }
        } : null)
      }
    } catch (err) {
      console.error('Auto-save error:', err)
      throw err
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Submit handler
  // ═══════════════════════════════════════════════════════════════════

  const handleSubmit = async (responses: Record<string, any>) => {
    const Swal = await getSwal()
    try {
      const response = await fetch(`/api/survey/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      })

      const result = await response.json()

      if (!result.success) {
        // Issue #10 FIX: Use SweetAlert for error messages
        await Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: result.error || 'Failed to submit survey. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd',
        })
        return
      }

      // Issue #10 FIX: Show success confirmation popup before redirecting
      await Swal.fire({
        icon: 'success',
        title: 'Survey Submitted!',
        text: 'Thank you for completing the survey. Your responses have been saved.',
        confirmButtonText: 'Continue',
        confirmButtonColor: '#198754',
        allowOutsideClick: false,
      })

      // Redirect to completion page
      router.push(`/survey/${token}/complete`)
    } catch (err) {
      console.error('Submit error:', err)
      // Issue #10 FIX: Use SweetAlert for error messages
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to submit survey. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0d6efd',
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Get deadline color class
  // ═══════════════════════════════════════════════════════════════════

  const getDeadlineColorClass = (seconds: number) => {
    if (seconds <= 0) return 'text-danger'
    if (seconds < 3600) return 'text-danger' // < 1 hour
    if (seconds < 86400) return 'text-warning' // < 1 day
    return 'text-primary'
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Loading
  // ═══════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4>Loading Survey...</h4>
          <p className="text-muted">Please wait while we load your survey</p>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Error State
  // ═══════════════════════════════════════════════════════════════════

  if (error || !surveyData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-danger">
                <div className="card-body text-center p-5">
                  <i className="icofont-warning text-danger" style={{ fontSize: '4rem' }}></i>
                  <h3 className="mt-3 mb-3">Survey Not Available</h3>
                  <p className="text-muted mb-4">{error}</p>

                  {error?.includes('expired') && (
                    <div className="alert alert-warning">
                      <i className="icofont-info-circle me-2"></i>
                      Need more time? Contact us at <strong>applications@deeplearningindabaxkenya.com</strong>
                    </div>
                  )}

                  {error?.includes('completed') && (
                    <div className="alert alert-success">
                      <i className="icofont-check-circled me-2"></i>
                      Thank you for completing this survey!
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={() => router.push('/')}
                  >
                    <i className="icofont-home me-2"></i>
                    Go to Homepage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Survey Form
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        {/* Header */}
        <div className="row justify-content-center mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {/* Event Info */}
                <div className="d-flex align-items-start mb-3">
                  <i className="icofont-calendar text-primary me-3" style={{ fontSize: '2rem' }}></i>
                  <div>
                    <h4 className="mb-1">{surveyData.event?.title || 'Event'}</h4>
                    <p className="text-muted mb-0">
                      {surveyData.event?.start_date && new Date(surveyData.event.start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Survey Title */}
                <h2 className="mb-2">{surveyData.template?.title || 'Survey'}</h2>
                {surveyData.template?.description && (
                  <p className="text-muted">{surveyData.template.description}</p>
                )}

                {/* Deadline Warning */}
                {timeRemaining !== null && timeRemaining > 0 && (
                  <div className={`alert alert-${timeRemaining < 86400 ? 'warning' : 'info'} d-flex align-items-center mb-0 mt-3`}>
                    <i className="icofont-clock-time me-2" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <strong className={getDeadlineColorClass(timeRemaining)}>
                        {formatTimeRemaining(timeRemaining)}
                      </strong>
                      {surveyData.response.deadline && (
                        <div className="small text-muted mt-1">
                          Deadline: {new Date(surveyData.response.deadline).toLocaleString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expired Warning */}
                {timeRemaining !== null && timeRemaining <= 0 && (
                  <div className="alert alert-danger d-flex align-items-center mb-0 mt-3">
                    <i className="icofont-warning me-2" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <strong>Survey Deadline Expired</strong>
                      <div className="small mt-1">
                        This survey is no longer accepting responses. Contact us if you need an extension.
                      </div>
                    </div>
                  </div>
                )}

                {/* Resume Notice */}
                {surveyData.canResume && surveyData.response.last_saved_at && (
                  <div className="alert alert-success d-flex align-items-center mb-0 mt-3">
                    <i className="icofont-check-circled me-2"></i>
                    <div className="small">
                      Resuming from your last save (
                      {formatDistanceToNow(new Date(surveyData.response.last_saved_at), { addSuffix: true })}
                      )
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Survey Form */}
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {/* Progress Bar */}
                {surveyData.showProgress && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Progress</span>
                      <span className="small fw-bold">{surveyData.response.completion_percentage || 0}%</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{ width: `${surveyData.response.completion_percentage || 0}%` }}
                        aria-valuenow={surveyData.response.completion_percentage || 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Form Renderer */}
                {timeRemaining !== null && timeRemaining <= 0 ? (
                  <div className="alert alert-danger">
                    <i className="icofont-warning me-2"></i>
                    <strong>Survey Expired</strong>
                    <p className="mb-0 mt-2">
                      This survey can no longer be submitted. Please contact us if you need an extension.
                    </p>
                  </div>
                ) : (
                  <FormRenderer
                    template={surveyData.template}
                    questions={surveyData.questions}
                    initialResponses={surveyData.answers.reduce((acc, answer) => {
                      try {
                        acc[answer.question_id] = JSON.parse(answer.value)
                      } catch {
                        acc[answer.question_id] = answer.value
                      }
                      return acc
                    }, {} as Record<string, any>)}
                    autoSave={true}
                    autoSaveDelay={30000}
                    onAutoSave={handleAutoSave}
                    onSubmit={handleSubmit}
                    showProgress={surveyData.showProgress}
                    submitButtonText="Submit Survey"
                    // Issue #31: Enable localStorage draft saving as backup
                    draftKey={`survey-${token}`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
