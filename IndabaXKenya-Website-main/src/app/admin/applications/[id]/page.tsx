'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPLICATION DETAIL PAGE WITH LOCK (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Integrates review locking mechanism

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert } from '@/components/admin/ui'
import { LockIndicator } from '@/components/admin/LockIndicator'
import { ApplicationTimeline } from '@/components/admin/ApplicationTimeline'
import { useReviewLock } from '@/hooks/useReviewLock'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'
import { SendCustomEmailModal } from '@/components/admin/SendCustomEmailModal'

interface Application {
  id: string
  event_id?: string
  application_type: 'registration' | 'call_for_papers'

  // Personal Info
  name: string
  email: string
  phone?: string
  organization?: string
  country?: string

  // Registration Specific
  ticket_type?: 'general' | 'student' | 'speaker'
  dietary_requirements?: string
  tshirt_size?: string
  accessibility_needs?: string

  // Call for Papers Specific
  presentation_type?: 'talk' | 'workshop' | 'poster'
  presentation_title?: string
  abstract?: string
  keywords?: string
  track?: string
  bio?: string
  linkedin_url?: string
  file_url?: string

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted'
  status_v2?: 'interested' | 'pending' | 'shortlisted' | 'survey_sent' | 'survey_completed' | 'approved' | 'rejected' | 'waitlisted'
  admin_notes?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string

  // Relations
  event?: { title: string }
}

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [application, setApplication] = useState<Application | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [formQuestions, setFormQuestions] = useState<any[]>([])
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([])
  const [surveyResponse, setSurveyResponse] = useState<any>(null)
  const [originalApplication, setOriginalApplication] = useState<any>(null) // For when viewing survey record
  const [timeline, setTimeline] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [lockActionLoading, setLockActionLoading] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [reviewerNotes, setReviewerNotes] = useState('')
  const [reviewedBy, setReviewedBy] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  // ═══════════════════════════════════════════════════════════════════════
  // LOCK MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  const {
    lockStatus,
    hasLock,
    isLockedByOther,
    timeUntilExpiry,
    acquireLock,
    releaseLock,
    extendLock,
    forceUnlock,
  } = useReviewLock({
    applicationId: params.id as string,
    autoAcquire: true, // Acquire lock on page load
    autoExtend: true, // Auto-extend every 20 minutes
    autoRelease: true, // Release on page close
    onLockAcquired: () => {
      console.log('Lock acquired successfully')
    },
    onLockLost: () => {
      setAlert({
        type: 'warning',
        message: 'Your review lock has expired after 30 minutes of inactivity. Click "Acquire Lock" to continue reviewing, or refresh the page.'
      })
    },
    onLockConflict: (lockedBy) => {
      setAlert({ type: 'danger', message: `This application is being reviewed by ${lockedBy}` })
    },
  })

  // ═══════════════════════════════════════════════════════════════════════
  // LOAD APPLICATION
  // ═══════════════════════════════════════════════════════════════════════

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadApplication() }, [params.id])

  const loadApplication = async () => {
    setLoading(true)
    const response = await fetch(`/api/admin/applications/${params.id}`)
    const result = await response.json()
    if (result.success && result.data) {
      const rawData = result.data as any

      // Transform form_responses format to Application format
      const app: Application = {
        id: rawData.id,
        event_id: rawData.event_id,
        application_type: rawData.application_type || rawData.response_type || 'registration',

        // Map top-level fields
        name: rawData.respondent_name || rawData.name || '',
        email: rawData.respondent_email || rawData.email || '',
        status: rawData.status || 'pending',
        status_v2: rawData.status_v2, // Include status_v2 for new workflow
        admin_notes: rawData.admin_notes || '',
        submitted_at: rawData.completed_at || rawData.submitted_at || rawData.created_at,
        reviewed_at: rawData.reviewed_at,
        reviewed_by: rawData.reviewed_by,

        // Issue #23 FIX: Include event data from the API response
        event: rawData.events || null,

        // Extract fields from responses JSONB
        ...(rawData.responses || {}),

        // Keep raw data for access to responses
        responses: rawData.responses,
      } as any

      setApplication(app)
      setNotes(app.admin_notes || '')
      setReviewerNotes(rawData.review_notes || '')
      setReviewedBy(rawData.reviewed_by || null)

      // Create supabase client for fetching related data
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // ═══════════════════════════════════════════════════════════════════
      // FETCH FORM QUESTIONS - Get questions from the correct templates
      // ═══════════════════════════════════════════════════════════════════
      // Issue #44 FIX: Prefer template_snapshot (stored at submission time)
      // over fetching current template questions. This ensures correct
      // question-to-response mapping even if template was edited later.

      // Check if we're viewing a survey response (detailed_survey) directly
      // If so, we need to fetch the ORIGINAL application for this user/event
      const isViewingSurvey = rawData.response_type === 'detailed_survey'

      if (isViewingSurvey) {
        // Fetch the original application for this user/event
        const { data: origApp } = await supabase
          .from('form_responses')
          .select('id, template_id, responses, response_type, created_at, template_snapshot')
          .eq('respondent_email', rawData.respondent_email)
          .eq('event_id', rawData.event_id)
          .in('response_type', ['application', 'initial_interest', 'registration'])
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (origApp) {
          setOriginalApplication(origApp)

          // Issue #44: Prefer template_snapshot from original app if available
          if (origApp.template_snapshot && Array.isArray(origApp.template_snapshot)) {
            setFormQuestions(origApp.template_snapshot)
          } else if (origApp.template_id) {
            // Fallback: fetch current template questions from DB
            const { data: questions } = await supabase
              .from('form_questions')
              .select('id, title, description, type, order_index, config')
              .eq('template_id', origApp.template_id)
              .order('order_index', { ascending: true })

            if (questions) {
              setFormQuestions(questions)
            }
          }
        }

        // For the survey, set surveyResponse to the CURRENT record
        setSurveyResponse({
          id: rawData.id,
          responses: rawData.responses,
          template_id: rawData.template_id,
          status: rawData.status,
          is_complete: rawData.is_complete,
          completed_at: rawData.completed_at
        })

        // Fetch survey template questions
        if (rawData.template_id) {
          const { data: sQuestions } = await supabase
            .from('form_questions')
            .select('id, title, description, type, order_index, config')
            .eq('template_id', rawData.template_id)
            .order('order_index', { ascending: true })

          if (sQuestions) {
            setSurveyQuestions(sQuestions)
          }
        }
      } else {
        // Viewing an application record directly
        // Issue #44: Prefer template_snapshot stored at submission time
        if (rawData.template_snapshot && Array.isArray(rawData.template_snapshot)) {
          setFormQuestions(rawData.template_snapshot)
        } else if (rawData.template_id) {
          // Fallback: fetch current template questions from DB
          const { data: appTemplate } = await supabase
            .from('form_templates')
            .select('id, name')
            .eq('id', rawData.template_id)
            .single()

          if (appTemplate) {
            const { data: questions } = await supabase
              .from('form_questions')
              .select('id, title, description, type, order_index, config')
              .eq('template_id', appTemplate.id)
              .order('order_index', { ascending: true })

            if (questions) {
              setFormQuestions(questions)
            }
          }
        } else {
          // Fallback: If no template_id stored (legacy applications), use usage_type
          const { data: appTemplate } = await supabase
            .from('form_templates')
            .select('id, name')
            .eq('usage_type', 'application')
            .limit(1)
            .single()

          if (appTemplate) {
            const { data: questions } = await supabase
              .from('form_questions')
              .select('id, title, description, type, order_index, config')
              .eq('template_id', appTemplate.id)
              .order('order_index', { ascending: true })

            if (questions) {
              setFormQuestions(questions)
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // FETCH DETAILED SURVEY DATA
      // ═══════════════════════════════════════════════════════════════════

      // Skip if we're already viewing a survey (handled above)
      if (!isViewingSurvey) {
        // First, look for a separate detailed_survey record with the same email
        const { data: linkedSurvey } = await supabase
          .from('form_responses')
          .select('id, responses, template_id, status, is_complete, completed_at')
          .eq('respondent_email', rawData.respondent_email)
          .eq('response_type', 'detailed_survey')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Get the detailed survey template
        const { data: surveyTemplate } = await supabase
          .from('form_templates')
          .select('id, name')
          .eq('usage_type', 'detailed_survey')
          .limit(1)
          .maybeSingle()

        if (surveyTemplate) {
          // Fetch survey questions
          const { data: sQuestions } = await supabase
            .from('form_questions')
            .select('id, title, description, type, order_index, config')
            .eq('template_id', surveyTemplate.id)
            .order('order_index', { ascending: true })

          if (sQuestions) {
            setSurveyQuestions(sQuestions)
          }
        }

        if (linkedSurvey) {
          // Use the separate detailed_survey record
          setSurveyResponse(linkedSurvey)
        } else if (rawData.status_v2 === 'survey_completed' && rawData.responses) {
          // Survey was filled in the SAME record (legacy/alternative flow)
          // Use the current application's responses as survey data
          setSurveyResponse({
            id: rawData.id,
            responses: rawData.responses,
            template_id: surveyTemplate?.id,
            status: rawData.status,
            is_complete: true,
            completed_at: rawData.completed_at
          })
        }
      }

      // Fetch user profile if this is an authenticated user (not guest)
      if (rawData.user_id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', rawData.user_id)
          .single()

        if (profile) {
          setUserProfile(profile)
        }
      }
    } else {
      setAlert({ type: 'danger', message: result.error || 'Failed to load application' })
    }
    setLoading(false)

    // Load timeline
    loadTimeline()
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LOAD TIMELINE
  // ═══════════════════════════════════════════════════════════════════════

  const loadTimeline = async () => {
    setTimelineLoading(true)
    try {
      const response = await fetch(`/api/admin/applications/${params.id}/timeline`)
      const result = await response.json()

      if (result.success) {
        setTimeline(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load timeline:', error)
    }
    setTimelineLoading(false)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATUS CHANGE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleStatusChange = async (status: 'approved' | 'rejected' | 'pending' | 'waitlisted') => {
    // Check if application is loaded and user has lock
    if (!application) {
      showError('Error', 'Application data not loaded')
      return
    }

    if (!hasLock) {
      showError('Cannot Update', 'You must have the lock to update this application')
      return
    }

    // For approve/reject/waitlist, use the decision API which sends emails
    if (status === 'approved' || status === 'rejected' || status === 'waitlisted') {
      // Confirm action
      const actionText = status === 'approved' ? 'Approve' : status === 'rejected' ? 'Reject' : 'Waitlist'
      const actionPastTense = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'add to waitlist'

      const confirmResult = await showConfirm(
        `${actionText} Application?`,
        `This will ${actionPastTense} the application and send an email notification to ${application.email}. Continue?`
      )

      if (!confirmResult) return

      setUpdating(true)
      try {
        const response = await fetch(`/api/admin/applications/${params.id}/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: status,
            notes: notes
          })
        })

        const result = await response.json()

        if (result.success) {
          const successTitle = status === 'approved' ? 'Application Approved!' : status === 'rejected' ? 'Application Rejected' : 'Application Waitlisted'
          showSuccess(
            successTitle,
            result.emailSent
              ? `Application ${status} and email notification sent successfully.`
              : `Application ${status}, but email notification failed.`
          )
          loadApplication()
        } else {
          showError('Action Failed', result.error || `Failed to ${actionPastTense} application`)
        }
      } catch (error) {
        showError('Error', `An error occurred while processing the application`)
        console.error('Decision error:', error)
      }
      setUpdating(false)
    } else {
      // For pending status, just update without email
      setUpdating(true)
      try {
        const response = await fetch(`/api/admin/applications/${params.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            admin_notes: notes
          })
        })
        const result = await response.json()

        if (result.success) {
          showSuccess(
            'Status Updated!',
            `Application has been set to ${status}`
          )
          loadApplication()
        } else {
          // Handle error object or string
          const errorMessage = typeof result.error === 'object'
            ? (result.error?.message || JSON.stringify(result.error))
            : (result.error || 'Failed to update status')
          showError('Update Failed', errorMessage)
        }
      } catch (error) {
        console.error('Status update error:', error)
        showError('Error', 'An error occurred while updating status')
      }
      setUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!application) return

    // Check if user has lock
    if (!hasLock) {
      showError('Cannot Save', 'You must have the lock to save notes')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/applications/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: application.status,
          admin_notes: notes
        })
      })
      const result = await response.json()

      if (result.success) {
        showSuccess('Notes Saved!', 'Admin notes have been updated')
        loadApplication()
      } else {
        showError('Save Failed', result.error || 'Failed to save notes')
      }
    } catch (error) {
      showError('Error', 'An error occurred while saving notes')
    }
    setUpdating(false)
  }

  const handleShortlist = async (surveyTemplateId?: string) => {
    if (!application) return

    // Check if user has lock
    if (!hasLock) {
      showError('Cannot Shortlist', 'You must have the lock to shortlist this application')
      return
    }

    // Only show confirm dialog on first call (no template selected yet)
    if (!surveyTemplateId) {
      const confirmResult = await showConfirm(
        'Shortlist Applicant?',
        `This will send a survey link to ${application.email}. Continue?`
      )
      if (!confirmResult) return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/applications/${params.id}/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: surveyTemplateId ? JSON.stringify({ survey_template_id: surveyTemplateId }) : undefined,
      })

      const result = await response.json()

      if (result.success) {
        showSuccess(
          'Application Shortlisted!',
          result.data?.emailSent
            ? 'Survey email has been sent to the applicant'
            : 'Shortlisted successfully (email not sent)'
        )
        loadApplication() // Reload to show updated status
      } else if (result.code === 'SURVEY_TEMPLATE_REQUIRED') {
        // Show template selection dialog
        const templates = result.available_templates || []

        if (templates.length === 0) {
          showError(
            'No Survey Templates',
            'No survey templates are available. Please create a survey template first.'
          )
          setUpdating(false)
          return
        }

        // Import Swal dynamically
        const Swal = (await import('sweetalert2')).default

        // Build template options for select
        const templateOptions: { [key: string]: string } = {}
        templates.forEach((t: any) => {
          templateOptions[t.id] = t.name
        })

        const { value: selectedTemplateId } = await Swal.fire({
          title: 'Select Survey Template',
          html: `
            <p class="text-muted mb-3">This event doesn't have a survey template attached. Please select one to send to shortlisted applicants.</p>
            <p class="small text-info mb-2"><i class="icofont-info-circle"></i> You can also attach a default template to this event in Event Settings.</p>
          `,
          input: 'select',
          inputOptions: templateOptions,
          inputPlaceholder: 'Select a survey template',
          showCancelButton: true,
          confirmButtonText: 'Shortlist & Send Survey',
          confirmButtonColor: '#3b82f6',
          inputValidator: (value) => {
            if (!value) {
              return 'You must select a survey template'
            }
            return null
          }
        })

        if (selectedTemplateId) {
          // Recursively call with selected template
          setUpdating(false) // Reset before recursive call
          await handleShortlist(selectedTemplateId)
          return
        }
      } else {
        showError('Shortlist Failed', result.error || 'Failed to shortlist application')
      }
    } catch (error) {
      showError('Error', 'An error occurred while shortlisting')
      console.error('Shortlist error:', error)
    }
    setUpdating(false)
  }

  const handleSendReminder = async () => {
    if (!application) return

    // Check if user has lock
    if (!hasLock) {
      showError('Cannot Send Reminder', 'You must have the lock to send a reminder')
      return
    }

    // Confirm action
    const confirmResult = await showConfirm(
      'Send Survey Reminder?',
      `This will send a reminder email to ${application.email} to complete their survey. Continue?`
    )

    if (!confirmResult) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/applications/${params.id}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (result.success) {
        showSuccess(
          'Reminder Sent!',
          'Survey reminder email has been sent to the applicant'
        )
        loadApplication()
      } else {
        showError('Failed to Send Reminder', result.error || 'Failed to send reminder')
      }
    } catch (error) {
      showError('Error', 'An error occurred while sending reminder')
      console.error('Send reminder error:', error)
    }
    setUpdating(false)
  }

  const handleRevokeApproval = async (sendNotification: boolean = true) => {
    if (!application) return

    // Check if user has lock
    if (!hasLock) {
      showError('Cannot Revoke', 'You must have the lock to revoke approval')
      return
    }

    // Confirm action
    const confirmResult = await showConfirm(
      'Revoke Approval?',
      `This will move the application back to pending status.${sendNotification ? ` A notification will be sent to ${application.email}.` : ''} Continue?`
    )

    if (!confirmResult) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/applications/${params.id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendNotification,
          notes: notes
        })
      })

      const result = await response.json()

      if (result.success) {
        showSuccess(
          'Approval Revoked',
          result.message
        )
        loadApplication()
      } else {
        showError('Revoke Failed', result.error || 'Failed to revoke approval')
      }
    } catch (error) {
      showError('Error', 'An error occurred while revoking approval')
      console.error('Revoke error:', error)
    }
    setUpdating(false)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      // Old status values
      case 'accepted': return 'bg-success'
      case 'rejected': return 'bg-danger'
      case 'pending': return 'bg-warning'

      // New status_v2 values
      case 'interested': return 'bg-info'
      case 'shortlisted': return 'bg-primary'
      case 'survey_sent': return 'bg-primary'
      case 'survey_completed': return 'bg-success'
      case 'approved': return 'bg-success'
      case 'waitlisted': return 'bg-warning'
      case 'attended': return 'bg-dark'

      default: return 'bg-secondary'
    }
  }

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'interested': return 'INTERESTED'
      case 'pending': return 'PENDING REVIEW'
      case 'shortlisted': return 'SHORTLISTED'
      case 'survey_sent': return 'SURVEY SENT'
      case 'survey_completed': return 'SURVEY COMPLETED'
      case 'approved': return 'APPROVED'
      case 'rejected': return 'REJECTED'
      case 'waitlisted': return 'WAITLISTED'
      case 'attended': return 'ATTENDED'
      case 'accepted': return 'ACCEPTED'
      default: return status.toUpperCase()
    }
  }

  const getTypeBadgeClass = (type: string) => {
    return type === 'registration' ? 'bg-primary' : 'bg-info'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading application...</p>
        </div>
      </DashboardLayout>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: NOT FOUND
  // ═══════════════════════════════════════════════════════════════════════

  if (!application) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid">
          <div className="alert alert-danger">
            <i className="icofont-warning-alt me-2"></i>
            Application not found
          </div>
          <button className="btn btn-secondary" onClick={() => router.push('/admin/applications')}>
            ← Back to Applications
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const applicationType = (application as any).application_type || (application as any).response_type || 'initial_interest'
  const isRegistration = applicationType === 'registration' || applicationType === 'initial_interest'
  const isCallForPapers = applicationType === 'call_for_papers' || applicationType === 'detailed_survey'

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: MAIN CONTENT
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-8">
            <h2>
              <i className="icofont-paper me-2"></i>
              Application Details
              {/* Issue #23 FIX: Show event name */}
              {application.event?.title && (
                <small className="text-muted d-block fs-5 mt-1">
                  for {application.event.title}
                </small>
              )}
            </h2>
            <div className="mt-2">
              <span className={`badge ${getTypeBadgeClass(applicationType)} me-2`}>
                {applicationType.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className={`badge ${getStatusBadgeClass((application as any).status_v2 || application.status)} fs-6`}>
                {getStatusDisplayText((application as any).status_v2 || application.status)}
              </span>
            </div>
          </div>
          <div className="col-md-4 text-md-end">
            <button
              className="btn btn-primary me-2"
              onClick={() => setShowEmailModal(true)}
            >
              <i className="icofont-envelope me-2"></i>
              Send Email
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/admin/applications')}
            >
              <i className="icofont-arrow-left me-2"></i>
              Back to Applications
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Survey Record Info Banner */}
        {applicationType === 'detailed_survey' && (
          <div className="alert alert-info mb-4">
            <i className="icofont-info-circle me-2"></i>
            <strong>Viewing Survey Response:</strong> This is the detailed survey submitted after shortlisting.
            {originalApplication && (
              <span className="ms-2">
                <a href={`/admin/applications/${originalApplication.id}`} className="alert-link">
                  View Original Application →
                </a>
              </span>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* LOCK INDICATOR */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <LockIndicator
          hasLock={hasLock}
          isLockedByOther={isLockedByOther}
          lockedByName={lockStatus?.locked_by_email}
          lockedByEmail={lockStatus?.locked_by_email}
          timeUntilExpiry={timeUntilExpiry}
          onExtendLock={async () => {
            if (lockActionLoading) return
            setLockActionLoading(true)
            console.log('Extend lock clicked')
            try {
              const result = await extendLock()
              console.log('Extend lock result:', result)
              if (result) {
                showSuccess('Lock Extended', 'Your lock has been extended by 30 minutes')
              } else {
                showError('Failed to Extend', 'Could not extend lock. Please try again.')
              }
            } catch (err) {
              showError('Error', 'An error occurred while extending the lock')
            } finally {
              setLockActionLoading(false)
            }
          }}
          onReleaseLock={async () => {
            if (lockActionLoading) return
            setLockActionLoading(true)
            console.log('Release lock clicked')
            try {
              const result = await releaseLock()
              console.log('Release lock result:', result)
              if (result) {
                showSuccess('Lock Released', 'Lock has been released successfully')
                setTimeout(() => router.push('/admin/applications'), 1000)
              } else {
                showError('Failed to Release', 'Could not release lock. Please try again.')
                setLockActionLoading(false)
              }
            } catch (err) {
              showError('Error', 'An error occurred while releasing the lock')
              setLockActionLoading(false)
            }
          }}
          lockActionLoading={lockActionLoading}
          onForceUnlock={forceUnlock}
          isAdmin={isAdmin}
        />

        {/* READ-ONLY MODE WARNING */}
        {isLockedByOther && (
          <div className="alert alert-warning mb-4">
            <i className="icofont-info-circle me-2"></i>
            <strong>Read-Only Mode:</strong> You cannot make changes while another user is reviewing this application.
          </div>
        )}

        <div className="row">
          {/* Main Content - Application Details */}
          <div className="col-lg-8">
            {/* Issue #40 FIX: Merged Applicant Information Card */}
            <div className="card mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="icofont-user me-2"></i>
                  Applicant Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Full Name</label>
                    <p className="mb-0"><strong>{application.name}</strong></p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Email Address</label>
                    <p className="mb-0">
                      <a href={`mailto:${application.email}`}>{application.email}</a>
                    </p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Application Type</label>
                    <p className="mb-0">
                      <span className={`badge ${getTypeBadgeClass(applicationType)}`}>
                        {applicationType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Submitted At</label>
                    <p className="mb-0">
                      {new Date(application.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* User Profile details (if authenticated user) */}
                {userProfile && (
                  <>
                    <hr className="my-3" />
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label text-muted small">Phone</label>
                        <p className="mb-0">{userProfile.phone || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted small">Organization</label>
                        <p className="mb-0">{userProfile.organization || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label text-muted small">Role</label>
                        <p className="mb-0">
                          <span className="badge bg-primary">
                            {userProfile.role?.toUpperCase() || 'APPLICANT'}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted small">Email Verified</label>
                        <p className="mb-0">
                          {userProfile.email_verified ? (
                            <span className="badge bg-success">✓ Verified</span>
                          ) : (
                            <span className="badge bg-warning">Not Verified</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {userProfile.bio && (
                      <div className="mb-3">
                        <label className="form-label text-muted small">Bio</label>
                        <p className="mb-0">{userProfile.bio}</p>
                      </div>
                    )}
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label text-muted small">Account Created</label>
                        <p className="mb-0">
                          {new Date(userProfile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Form Responses - Initial Application */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="icofont-papers me-2"></i>
                  Initial Application Responses
                </h5>
              </div>
              <div className="card-body">
                {(() => {
                  // When viewing a survey, use the originalApplication's responses
                  // Otherwise, use the current application's responses
                  const rawData = application as any
                  const isViewingSurvey = rawData.application_type === 'detailed_survey' || rawData.response_type === 'detailed_survey'
                  const responses = isViewingSurvey && originalApplication
                    ? (originalApplication.responses || {})
                    : (rawData.responses || {})

                  // Issue #27 FIX: Check for responses first, regardless of question matching
                  const allResponseKeys = Object.keys(responses)
                  const responseKeys = allResponseKeys.filter(k => k !== 'name' && k !== 'email')

                  // Show info alert when viewing survey
                  if (isViewingSurvey && !originalApplication) {
                    return (
                      <div className="text-center py-4">
                        <i className="icofont-info-circle text-info" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mt-3 mb-0">
                          You are viewing a survey response record.
                          <span className="d-block mt-2 small">
                            The original application could not be found.
                            <a href={`/admin/applications?email=${rawData.email}`} className="ms-1">
                              Search by email →
                            </a>
                          </span>
                        </p>
                      </div>
                    )
                  }

                  // If no responses at all, show message
                  if (responseKeys.length === 0 && !responses.name && !responses.email) {
                    return <p className="text-muted">No responses recorded for this application.</p>
                  }

                  // Try to match questions if loaded
                  const answeredQuestions = formQuestions.filter(q => {
                    const answer = responses[q.id]
                    return answer !== undefined && answer !== null && answer !== ''
                  })

                  // Issue #27 FIX: If questions loaded but IDs don't match, show raw responses with helpful labels
                  if (formQuestions.length > 0 && answeredQuestions.length === 0 && responseKeys.length > 0) {
                    // Create a map of question titles by order for better labeling
                    const questionsByOrder = formQuestions.reduce((acc, q, idx) => {
                      // Skip section breaks and display-only types for labeling
                      if (!['section_break', 'title_description', 'page_break'].includes(q.type)) {
                        acc.push({ title: q.title, type: q.type, order: idx })
                      }
                      return acc
                    }, [] as { title: string; type: string; order: number }[])

                    // Try to match responses to questions by order (best effort)
                    let responseIndex = 0

                    return (
                      <div>
                        <div className="alert alert-info mb-3">
                          <i className="icofont-info-circle me-2"></i>
                          <small>Form questions were updated after this application was submitted. Showing responses in submitted order:</small>
                        </div>
                        {responseKeys.map((key, idx) => {
                          const value = responses[key]
                          // Try to find a matching question title by order
                          const matchedQuestion = questionsByOrder[responseIndex]
                          responseIndex++

                          // Determine label based on value type and matched question
                          let label = matchedQuestion?.title || `Question ${idx + 1}`

                          // If value looks like specific types, use better labels
                          if (typeof value === 'string') {
                            if (value.includes('@') && value.includes('.')) {
                              label = matchedQuestion?.title || 'Email'
                            } else if (/^\+?\d{10,15}$/.test(value.replace(/[\s-]/g, ''))) {
                              label = matchedQuestion?.title || 'Phone Number'
                            }
                          }

                          return (
                            <div key={key} className="mb-3 pb-2 border-bottom">
                              <label className="form-label text-muted small mb-1">
                                <strong>{label}</strong>
                              </label>
                              <div className="ms-3">
                                {/* Issue #3 FIX: Detect file upload objects */}
                                {(typeof value === 'object' && value !== null && !Array.isArray(value) && value.url) ? (
                                  <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                    <i className="icofont-file-document text-primary me-2"></i>
                                    <strong>{value.originalName || value.fileName || 'Download file'}</strong>
                                  </a>
                                ) : (Array.isArray(value) && value.length > 0 && value[0]?.url) ? (
                                  <ul className="mb-0 list-unstyled">
                                    {value.map((file: any, i: number) => (
                                      <li key={i} className="d-flex align-items-center mb-1">
                                        <i className="icofont-file-document text-primary me-2"></i>
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                          <strong>{file.originalName || file.fileName || 'File'}</strong>
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : Array.isArray(value) ? (
                                  <ul className="mb-0 list-unstyled">
                                    {value.map((item, i) => (
                                      <li key={i} className="d-flex align-items-center mb-1">
                                        <i className="icofont-check-circled text-success me-2"></i>
                                        <strong>{String(item)}</strong>
                                      </li>
                                    ))}
                                  </ul>
                                ) : typeof value === 'object' && value !== null ? (
                                  <pre className="bg-light p-2 rounded small mb-0">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  <p className="mb-0"><strong>{String(value)}</strong></p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }

                  // If still loading questions, show loading state with responses preview
                  if (formQuestions.length === 0 && responseKeys.length > 0) {
                    return (
                      <div>
                        <p className="text-muted mb-3">Loading question labels...</p>
                        {responseKeys.slice(0, 5).map((key, idx) => {
                          const value = responses[key]
                          return (
                            <div key={key} className="mb-3 pb-2 border-bottom">
                              <label className="form-label text-muted small mb-1">
                                <strong>Response {idx + 1}</strong>
                              </label>
                              <div className="ms-3">
                                {Array.isArray(value) ? (
                                  <span className="text-muted">{value.join(', ')}</span>
                                ) : (
                                  <span className="text-muted">{String(value).substring(0, 100)}{String(value).length > 100 ? '...' : ''}</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        {responseKeys.length > 5 && (
                          <p className="text-muted small">+ {responseKeys.length - 5} more responses</p>
                        )}
                      </div>
                    )
                  }

                  // Questions and answers match - show them properly
                  if (answeredQuestions.length > 0) {
                    // Issue #26 FIX: Helper to resolve option internal keys to display labels
                    // Options live in question.config.options (DB) or question.options (snapshot)
                    const resolveOptionLabel = (question: any, value: string): string => {
                      const options = question.options || question.config?.options
                      if (!options || !Array.isArray(options)) return value
                      const option = options.find((o: any) =>
                        o.id === value || o.value === value || o.key === value
                      )
                      return option?.label || option?.text || option?.title || value
                    }

                    // Issue #3, #6, #7, #47 FIX: Detect file upload objects and render as downloadable links
                    // Check for various file properties (url, fileName, originalName, path)
                    const hasFileProperties = (obj: any): boolean => {
                      if (!obj || typeof obj !== 'object') return false
                      return 'url' in obj || 'fileName' in obj || 'originalName' in obj || 'path' in obj
                    }

                    const isFileUploadValue = (val: any, questionType?: string): boolean => {
                      if (questionType === 'file_upload') return true
                      if (val && typeof val === 'object' && !Array.isArray(val) && hasFileProperties(val)) return true
                      if (Array.isArray(val) && val.length > 0 && hasFileProperties(val[0])) return true
                      return false
                    }

                    const renderFileUpload = (val: any) => {
                      const files = Array.isArray(val) ? val : [val]
                      return (
                        <ul className="mb-0 list-unstyled">
                          {files.map((file: any, idx: number) => {
                            const fileUrl = file?.url || file?.path || '#'
                            const fileName = file?.originalName || file?.fileName || file?.name || 'Uploaded File'
                            const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE'
                            return (
                              <li key={idx} className="mb-2">
                                <div className="d-flex align-items-center p-2 bg-light rounded border">
                                  <div className="me-3">
                                    <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>{fileExt}</span>
                                  </div>
                                  <div className="flex-grow-1">
                                    <strong className="d-block text-dark">{fileName}</strong>
                                    {file?.size && (
                                      <small className="text-muted">
                                        {file.size > 1024 * 1024
                                          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                          : `${(file.size / 1024).toFixed(1)} KB`}
                                      </small>
                                    )}
                                  </div>
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary ms-2"
                                    download
                                  >
                                    <i className="icofont-download me-1"></i>
                                    Download
                                  </a>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )
                    }

                    // Issue #26 FIX: Format grid responses as readable table
                    const renderGridAnswer = (answer: any, question: any) => {
                      if (typeof answer !== 'object' || answer === null || Array.isArray(answer)) return null
                      const rows = Object.entries(answer)
                      if (rows.length === 0) return null
                      return (
                        <table className="table table-sm table-bordered mb-0">
                          <tbody>
                            {rows.map(([rowKey, rowValue]) => (
                              <tr key={rowKey}>
                                <td className="fw-bold text-muted" style={{ width: '40%' }}>
                                  {rowKey}
                                </td>
                                <td>
                                  <strong>{Array.isArray(rowValue) ? rowValue.join(', ') : String(rowValue)}</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    }

                    return answeredQuestions.map((question) => {
                      const answer = responses[question.id]
                      const isGrid = question.type === 'multiple_choice_grid' || question.type === 'checkbox_grid'
                      const isFile = isFileUploadValue(answer, question.type)

                      return (
                        <div key={question.id} className="mb-4 pb-3 border-bottom">
                          <label className="form-label text-muted small mb-1">
                            <strong>{question.title}</strong>
                            {question.is_required && <span className="text-danger ms-1">*</span>}
                          </label>
                          {question.description && (
                            <p className="text-muted small mb-2">{question.description}</p>
                          )}
                          <div className="ms-3">
                            {isFile ? (
                              renderFileUpload(answer)
                            ) : isGrid && typeof answer === 'object' && !Array.isArray(answer) ? (
                              renderGridAnswer(answer, question)
                            ) : Array.isArray(answer) ? (
                              <ul className="mb-0 list-unstyled">
                                {answer.map((item, idx) => (
                                  <li key={idx} className="d-flex align-items-center mb-1">
                                    <i className="icofont-check-circled text-success me-2"></i>
                                    <strong>{typeof item === 'object' && item?.url ? (
                                      <a href={item.url} target="_blank" rel="noopener noreferrer">{item.originalName || item.fileName || 'File'}</a>
                                    ) : resolveOptionLabel(question, String(item))}</strong>
                                  </li>
                                ))}
                              </ul>
                            ) : typeof answer === 'object' && answer !== null ? (
                              <pre className="bg-light p-2 rounded mb-0">
                                {JSON.stringify(answer, null, 2)}
                              </pre>
                            ) : (
                              <p className="mb-0"><strong>{resolveOptionLabel(question, String(answer))}</strong></p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  }

                  // Fallback: Show raw responses with basic labels
                  return (
                    <div>
                      {responseKeys.map((key, idx) => {
                        const value = responses[key]
                        return (
                          <div key={key} className="mb-3 pb-2 border-bottom">
                            <label className="form-label text-muted small mb-1">
                              <strong>Response {idx + 1}</strong>
                            </label>
                            <div className="ms-3">
                              {/* Issue #3 FIX: Detect file upload objects in raw fallback */}
                              {(typeof value === 'object' && value !== null && !Array.isArray(value) && value.url) ? (
                                <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                  <i className="icofont-file-document text-primary me-2"></i>
                                  <strong>{value.originalName || value.fileName || 'Download file'}</strong>
                                </a>
                              ) : (Array.isArray(value) && value.length > 0 && value[0]?.url) ? (
                                <ul className="mb-0 list-unstyled">
                                  {value.map((file: any, i: number) => (
                                    <li key={i}>
                                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                                        <i className="icofont-file-document text-primary me-2"></i>
                                        <strong>{file.originalName || file.fileName || 'File'}</strong>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : Array.isArray(value) ? (
                                <ul className="mb-0">
                                  {value.map((item, i) => (
                                    <li key={i}><strong>{String(item)}</strong></li>
                                  ))}
                                </ul>
                              ) : typeof value === 'object' && value !== null ? (
                                <pre className="bg-light p-2 rounded small mb-0">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                <p className="mb-0"><strong>{String(value)}</strong></p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Detailed Application Responses (Shortlist Form) */}
            <div className="card mb-4">
              <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="icofont-list me-2"></i>
                  Shortlist Form Responses
                </h5>
                {surveyResponse ? (
                  <span className={`badge ${surveyResponse.is_complete ? 'bg-success' : 'bg-warning'}`}>
                    {surveyResponse.is_complete ? 'Completed' : 'In Progress'}
                  </span>
                ) : (
                  <span className="badge bg-secondary">Not Started</span>
                )}
              </div>
              <div className="card-body">
                {(() => {
                  if (surveyQuestions.length === 0) {
                    return <p className="text-muted">No shortlist form template found.</p>
                  }

                  if (!surveyResponse) {
                    return (
                      <div className="text-center py-4">
                        <i className="icofont-warning-alt text-warning" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mt-3 mb-0">
                          Shortlist form has not been started yet.
                          {(application as any).status_v2 === 'survey_sent' && (
                            <span className="d-block mt-2 small">
                              A form link was sent to the applicant. Awaiting completion.
                            </span>
                          )}
                        </p>
                      </div>
                    )
                  }

                  const responses = surveyResponse.responses || {}
                  const answeredQuestions = surveyQuestions.filter(q => {
                    const answer = responses[q.id]
                    return answer !== undefined && answer !== null && answer !== ''
                  })

                  if (answeredQuestions.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <i className="icofont-ui-edit text-info" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mt-3 mb-0">
                          Survey started but no answers recorded yet.
                        </p>
                      </div>
                    )
                  }

                  // Issue #6, #7, #47: File detection helpers for survey section
                  const hasFilePropsSurvey = (obj: any): boolean => {
                    if (!obj || typeof obj !== 'object') return false
                    return 'url' in obj || 'fileName' in obj || 'originalName' in obj || 'path' in obj
                  }
                  const isFileUploadValueSurvey = (val: any, questionType?: string): boolean => {
                    if (questionType === 'file_upload') return true
                    if (val && typeof val === 'object' && !Array.isArray(val) && hasFilePropsSurvey(val)) return true
                    if (Array.isArray(val) && val.length > 0 && hasFilePropsSurvey(val[0])) return true
                    return false
                  }
                  const renderFileUploadSurvey = (val: any) => {
                    const files = Array.isArray(val) ? val : [val]
                    return (
                      <ul className="mb-0 list-unstyled">
                        {files.map((file: any, idx: number) => {
                          const fileUrl = file?.url || file?.path || '#'
                          const fileName = file?.originalName || file?.fileName || file?.name || 'Uploaded File'
                          const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE'
                          return (
                            <li key={idx} className="mb-2">
                              <div className="d-flex align-items-center p-2 bg-light rounded border">
                                <div className="me-3">
                                  <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>{fileExt}</span>
                                </div>
                                <div className="flex-grow-1">
                                  <strong className="d-block text-dark">{fileName}</strong>
                                  {file?.size && (
                                    <small className="text-muted">
                                      {file.size > 1024 * 1024
                                        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                        : `${(file.size / 1024).toFixed(1)} KB`}
                                    </small>
                                  )}
                                </div>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary ms-2"
                                  download
                                >
                                  <i className="icofont-download me-1"></i>
                                  Download
                                </a>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )
                  }

                  return (
                    <>
                      {surveyResponse.completed_at && (
                        <div className="alert alert-success py-2 mb-4">
                          <i className="icofont-check-circled me-2"></i>
                          Completed on {new Date(surveyResponse.completed_at).toLocaleString()}
                        </div>
                      )}
                      {answeredQuestions.map((question) => {
                        const answer = responses[question.id]
                        const surveyOptions = question.options || question.config?.options
                        const resolveSurveyLabel = (val: string): string => {
                          if (!surveyOptions || !Array.isArray(surveyOptions)) return val
                          const opt = surveyOptions.find((o: any) => o.id === val || o.value === val || o.key === val)
                          return opt?.label || opt?.text || val
                        }
                        // Issue #6, #7, #47: Use improved file detection
                        const isFile = isFileUploadValueSurvey(answer, question.type)

                        return (
                          <div key={question.id} className="mb-4 pb-3 border-bottom">
                            <label className="form-label text-muted small mb-1">
                              <strong>{question.title}</strong>
                            </label>
                            {question.description && (
                              <p className="text-muted small mb-2">{question.description}</p>
                            )}
                            <div className="ms-3">
                              {isFile ? (
                                renderFileUploadSurvey(answer)
                              ) : Array.isArray(answer) ? (
                                <ul className="mb-0 list-unstyled">
                                  {answer.map((item, idx) => (
                                    <li key={idx} className="d-flex align-items-center mb-1">
                                      <i className="icofont-check-circled text-success me-2"></i>
                                      <strong>{typeof item === 'string' ? resolveSurveyLabel(item) : (typeof item === 'object' ? JSON.stringify(item) : String(item))}</strong>
                                    </li>
                                  ))}
                                </ul>
                              ) : typeof answer === 'object' && answer !== null ? (
                                <pre className="bg-light p-2 rounded small">
                                  {JSON.stringify(answer, null, 2)}
                                </pre>
                              ) : (
                                <p className="mb-0"><strong>{typeof answer === 'string' ? resolveSurveyLabel(answer) : String(answer)}</strong></p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Metadata */}
            <div className="card mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">
                  <i className="icofont-clock-time me-2"></i>
                  Metadata
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Submitted At</label>
                    <p className="mb-0">{formatDate(application.submitted_at)}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Reviewed At</label>
                    <p className="mb-0">{formatDate(application.reviewed_at)}</p>
                  </div>
                </div>

                {application.event && (
                  <div className="mb-3">
                    <label className="form-label text-muted small">Event</label>
                    <p className="mb-0">
                      <i className="icofont-calendar me-2"></i>
                      {application.event.title}
                    </p>
                  </div>
                )}

                <div className="mb-0">
                  <label className="form-label text-muted small">Application ID</label>
                  <p className="mb-0">
                    <code>{application.id}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Status & Actions */}
          <div className="col-lg-4">
            <div className="card mb-4 sticky-top" style={{ top: '90px', zIndex: 100 }}>
              <div className="card-header bg-dark text-white">
                <h5 className="mb-0">
                  <i className="icofont-flag me-2"></i>
                  Status & Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-muted small">Current Status</label>
                  <div>
                    <span className={`badge ${getStatusBadgeClass((application as any).status_v2 || application.status)} fs-6`}>
                      {getStatusDisplayText((application as any).status_v2 || application.status)}
                    </span>
                  </div>
                  {(application as any).status_v2 && application.status && (application as any).status_v2 !== application.status && (
                    <small className="text-muted d-block mt-2">
                      Legacy status: {application.status}
                    </small>
                  )}
                </div>

                {/* Status Workflow Tracker */}
                {(application as any).status_v2 && (
                  <div className="mb-3">
                    <label className="form-label text-muted small">Workflow Progress</label>
                    <div className="small">
                      {['interested', 'pending', 'shortlisted', 'survey_sent', 'survey_completed', 'approved'].map((step, idx) => {
                        const currentStatus = (application as any).status_v2
                        const statusOrder = ['interested', 'pending', 'shortlisted', 'survey_sent', 'survey_completed', 'approved']
                        const currentIdx = statusOrder.indexOf(currentStatus)
                        const stepIdx = statusOrder.indexOf(step)
                        const isComplete = stepIdx <= currentIdx
                        const isCurrent = step === currentStatus
                        const isRejected = currentStatus === 'rejected'
                        const isWaitlisted = currentStatus === 'waitlisted'

                        return (
                          <div key={step} className="d-flex align-items-center mb-1">
                            <i className={`icofont-${isComplete ? 'check-circled' : 'circle'} me-2 ${
                              isComplete ? 'text-success' : 'text-muted'
                            } ${isCurrent ? 'fw-bold' : ''}`}></i>
                            <span className={isCurrent ? 'fw-bold' : 'text-muted'}>
                              {getStatusDisplayText(step)}
                            </span>
                          </div>
                        )
                      })}
                      {(application as any).status_v2 === 'waitlisted' && (
                        <div className="d-flex align-items-center mb-1">
                          <i className="icofont-clock-time me-2 text-warning fw-bold"></i>
                          <span className="fw-bold text-warning">WAITLISTED</span>
                        </div>
                      )}
                      {(application as any).status_v2 === 'rejected' && (
                        <div className="d-flex align-items-center mb-1">
                          <i className="icofont-close-circled me-2 text-danger fw-bold"></i>
                          <span className="fw-bold text-danger">REJECTED</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <hr />

                {/* Shortlist Button - Only show for interested/pending applications */}
                {((application as any).status_v2 === 'interested' || (application as any).status_v2 === 'pending' || application.status === 'pending') && (
                  <>
                    <label className="form-label text-muted small">Quick Actions</label>
                    <div className="d-grid gap-2 mb-4">
                      <button
                        className="btn btn-info text-white"
                        onClick={() => handleShortlist()}
                        disabled={updating || !hasLock}
                        title={!hasLock ? 'You need the lock to shortlist' : 'Send survey link to applicant'}
                      >
                        <i className="icofont-star me-2"></i>
                        Shortlist Applicant
                        <div className="small text-white-50 mt-1">
                          <i className="icofont-envelope me-1"></i>
                          "Survey Invitation - Shortlisted Applicant"
                        </div>
                      </button>
                    </div>

                    <hr />
                  </>
                )}

                {/* Send Reminder Button - Only show for shortlisted/survey_sent applications */}
                {((application as any).status_v2 === 'shortlisted' || (application as any).status_v2 === 'survey_sent') && (
                  <>
                    <label className="form-label text-muted small">Quick Actions</label>
                    <div className="d-grid gap-2 mb-4">
                      <div className="alert alert-info py-2 mb-2">
                        <i className="icofont-info-circle me-1"></i>
                        Awaiting survey completion
                      </div>
                      <button
                        className="btn btn-warning"
                        onClick={handleSendReminder}
                        disabled={updating || !hasLock}
                        title={!hasLock ? 'You need the lock to send reminder' : 'Send survey reminder to applicant'}
                      >
                        {updating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className="icofont-alarm me-2"></i>
                            Send Survey Reminder
                            <div className="small text-white-50 mt-1">
                              <i className="icofont-envelope me-1"></i>
                              "Survey Reminder - Complete Your Application"
                            </div>
                          </>
                        )}
                      </button>
                    </div>

                    <hr />
                  </>
                )}

                <label className="form-label text-muted small">Decision Actions</label>
                <div className="d-grid gap-2 mb-4">
                  {/* Conditional buttons based on current status */}
                  {(() => {
                    const currentStatus = application.status_v2 || application.status

                    // APPROVED: Show revoke options
                    if (currentStatus === 'approved') {
                      return (
                        <>
                          <div className="alert alert-success py-2 mb-2">
                            <i className="icofont-check-circled me-1"></i>
                            This application has been <strong>approved</strong>
                          </div>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => handleRevokeApproval(true)}
                            disabled={updating || !hasLock}
                            title="Move back to pending and notify applicant"
                          >
                            {updating ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <i className="icofont-undo me-2"></i>
                                Revoke & Notify
                                <div className="small text-muted mt-1">
                                  <i className="icofont-envelope me-1"></i>
                                  Sends email notification
                                </div>
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleRevokeApproval(false)}
                            disabled={updating || !hasLock}
                            title="Move back to pending without notification"
                          >
                            <i className="icofont-undo me-2"></i>
                            Revoke (No Email)
                            <div className="small text-muted mt-1">
                              <i className="icofont-ban me-1"></i>
                              No email sent
                            </div>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleStatusChange('rejected')}
                            disabled={updating || !hasLock}
                            title="Reject this application"
                          >
                            <i className="icofont-close-circled me-2"></i>
                            Reject Application
                            <div className="small text-muted mt-1">
                              <i className="icofont-envelope me-1"></i>
                              "Application Rejected - IndabaX Kenya"
                            </div>
                          </button>
                        </>
                      )
                    }

                    // REJECTED: Show reconsider options
                    if (currentStatus === 'rejected') {
                      return (
                        <>
                          <div className="alert alert-danger py-2 mb-2">
                            <i className="icofont-close-circled me-1"></i>
                            This application has been <strong>rejected</strong>
                          </div>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleStatusChange('approved')}
                            disabled={updating || !hasLock}
                            title="Approve this application"
                          >
                            <i className="icofont-check-circled me-2"></i>
                            Approve Application
                            <div className="small text-muted mt-1">
                              <i className="icofont-envelope me-1"></i>
                              "Application Approved - Welcome to IndabaX Kenya"
                            </div>
                          </button>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => handleStatusChange('waitlisted')}
                            disabled={updating || !hasLock}
                            title="Move to waitlist"
                          >
                            <i className="icofont-clock-time me-2"></i>
                            Move to Waitlist
                            <div className="small text-muted mt-1">
                              <i className="icofont-envelope me-1"></i>
                              "Waitlist Notification - IndabaX Kenya"
                            </div>
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleStatusChange('pending')}
                            disabled={updating || !hasLock}
                            title="Move back to pending for reconsideration"
                          >
                            <i className="icofont-refresh me-2"></i>
                            Reconsider (Move to Pending)
                            <div className="small text-muted mt-1">
                              <i className="icofont-ban me-1"></i>
                              No email sent
                            </div>
                          </button>
                        </>
                      )
                    }

                    // WAITLISTED: Show approve/reject options
                    if (currentStatus === 'waitlisted') {
                      return (
                        <>
                          <div className="alert alert-warning py-2 mb-2">
                            <i className="icofont-clock-time me-1"></i>
                            This application is on the <strong>waitlist</strong>
                          </div>
                          <button
                            className="btn btn-success"
                            onClick={() => handleStatusChange('approved')}
                            disabled={updating || !hasLock}
                            title="Approve this application"
                          >
                            {updating ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <i className="icofont-check-circled me-2"></i>
                                Approve Application
                                <div className="small text-muted mt-1">
                                  <i className="icofont-envelope me-1"></i>
                                  "Application Approved - Welcome to IndabaX Kenya"
                                </div>
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleStatusChange('rejected')}
                            disabled={updating || !hasLock}
                            title="Reject this application"
                          >
                            <i className="icofont-close-circled me-2"></i>
                            Reject Application
                            <div className="small text-muted mt-1">
                              <i className="icofont-envelope me-1"></i>
                              "Application Rejected - IndabaX Kenya"
                            </div>
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleStatusChange('pending')}
                            disabled={updating || !hasLock}
                            title="Move back to pending"
                          >
                            <i className="icofont-refresh me-2"></i>
                            Move to Pending
                            <div className="small text-muted mt-1">
                              <i className="icofont-ban me-1"></i>
                              No email sent
                            </div>
                          </button>
                        </>
                      )
                    }

                    // DEFAULT (pending, survey_completed, etc.): Show approve/reject/waitlist options
                    return (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handleStatusChange('approved')}
                          disabled={updating || !hasLock}
                          title={!hasLock ? 'You need the lock to update status' : 'Approve and send approval email'}
                        >
                          {updating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="icofont-check-circled me-2"></i>
                              Approve Application
                              <div className="small text-white-50 mt-1">
                                <i className="icofont-envelope me-1"></i>
                                "Application Approved - Welcome to IndabaX Kenya"
                              </div>
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-warning"
                          onClick={() => handleStatusChange('waitlisted')}
                          disabled={updating || !hasLock}
                          title={!hasLock ? 'You need the lock to update status' : 'Add to waitlist and send waitlist email'}
                        >
                          {updating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="icofont-clock-time me-2"></i>
                              Add to Waitlist
                              <div className="small text-white-50 mt-1">
                                <i className="icofont-envelope me-1"></i>
                                "Waitlist Notification - IndabaX Kenya"
                              </div>
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleStatusChange('rejected')}
                          disabled={updating || !hasLock}
                          title={!hasLock ? 'You need the lock to update status' : 'Reject and send rejection email'}
                        >
                          {updating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="icofont-close-circled me-2"></i>
                              Reject Application
                              <div className="small text-white-50 mt-1">
                                <i className="icofont-envelope me-1"></i>
                                "Application Rejected - IndabaX Kenya"
                              </div>
                            </>
                          )}
                        </button>
                        {currentStatus !== 'pending' && (
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleStatusChange('pending')}
                            disabled={updating || !hasLock}
                            title="Set back to pending status"
                          >
                            <i className="icofont-refresh me-2"></i>
                            Set Pending
                            <div className="small text-muted mt-1">
                              <i className="icofont-ban me-1"></i>
                              No email sent
                            </div>
                          </button>
                        )}
                      </>
                    )
                  })()}
                </div>

                <hr />

                {/* Issue #32 FIX: Call for Paper quick action */}
                {((application as any).status_v2 === 'approved' || (application as any).status_v2 === 'survey_completed') && (
                  <>
                    <label className="form-label text-muted small">Paper Submission</label>
                    <div className="d-grid gap-2 mb-3">
                      <a
                        href={`mailto:${(application as any).respondent_email || ''}?subject=${encodeURIComponent('Call for Papers - IndabaX Kenya')}&body=${encodeURIComponent(`Dear ${(application as any).respondent_name || 'Applicant'},\n\nCongratulations on your acceptance! We would like to invite you to submit a paper/poster for IndabaX Kenya.\n\nPlease submit your paper by replying to this email or using the submission portal.\n\nBest regards,\nIndabaX Kenya Team`)}`}
                        className="btn btn-outline-info"
                      >
                        <i className="icofont-paper me-2"></i>
                        Send Call for Paper
                        <div className="small text-muted mt-1">
                          Opens email client
                        </div>
                      </a>
                    </div>
                    <hr />
                  </>
                )}

                {/* Reviewer Notes (Read-Only) */}
                {reviewerNotes && (
                  <>
                    <label className="form-label text-muted small d-flex align-items-center">
                      <i className="icofont-ui-note text-info me-2"></i>
                      Reviewer Notes
                      <span className="badge bg-info ms-2">From Reviewer</span>
                    </label>
                    <div className="alert alert-info mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                      {reviewerNotes}
                      {reviewedBy && (
                        <div className="mt-2 pt-2 border-top border-info-subtle">
                          <small className="text-muted">
                            <i className="icofont-clock-time me-1"></i>
                            Added {application?.reviewed_at ? new Date(application.reviewed_at).toLocaleString() : 'recently'}
                          </small>
                        </div>
                      )}
                    </div>
                    <hr />
                  </>
                )}

                {/* Admin Notes */}
                <label className="form-label text-muted small">
                  <i className="icofont-pencil-alt-2 me-2"></i>
                  Admin Notes
                </label>
                <textarea
                  className="form-control mb-3"
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your own internal notes about this application..."
                  disabled={updating || !hasLock}
                />
                <button
                  className="btn btn-primary w-100"
                  onClick={handleSaveNotes}
                  disabled={updating || !hasLock}
                  title={!hasLock ? 'You need the lock to save notes' : ''}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="icofont-save me-2"></i>
                      Save Notes
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="card mt-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">
                  <i className="icofont-clock-time me-2"></i>
                  Activity Timeline
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <ApplicationTimeline
                  events={timeline}
                  loading={timelineLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Custom Email Modal */}
      <SendCustomEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        applicationId={application.id}
        recipientName={(application as any).respondent_name || application.name}
        recipientEmail={(application as any).respondent_email || application.email}
        onSuccess={() => {
          showSuccess('Email sent successfully!')
          loadApplication()
        }}
      />
    </DashboardLayout>
  )
}
