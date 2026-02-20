'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER APPLICATION DETAIL PAGE WITH PERMISSIONS (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════
// Full admin functionality wrapped with permission checks and locking

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert } from '@/components/admin/ui'
import { LockIndicator } from '@/components/admin/LockIndicator'
import { ApplicationTimeline } from '@/components/admin/ApplicationTimeline'
import { useReviewLock } from '@/hooks/useReviewLock'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'

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

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted'
  status_v2?: 'interested' | 'pending' | 'shortlisted' | 'survey_sent' | 'survey_completed' | 'approved' | 'rejected' | 'waitlisted'
  admin_notes?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string

  // Relations
  event?: { title: string }

  // PII masking flag
  pii_masked?: boolean

  // Reviewer permissions for this application's event
  reviewer_permissions?: {
    can_view: boolean
    can_review: boolean
    can_approve: boolean
    can_reject: boolean
    can_view_pii: boolean
    can_view_survey_responses: boolean
    can_view_paper_submissions: boolean
    can_shortlist: boolean
    can_send_reminders: boolean
    can_revoke: boolean
    can_send_emails: boolean
    can_waitlist: boolean
  }
}

export default function ReviewerApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [application, setApplication] = useState<Application | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [formQuestions, setFormQuestions] = useState<any[]>([])
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([])
  const [surveyResponse, setSurveyResponse] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [lockActionLoading, setLockActionLoading] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [notes, setNotes] = useState('')

  // Permission helpers (Issue #24: use all permission fields)
  const canView = application?.reviewer_permissions?.can_view ?? false
  const canReview = application?.reviewer_permissions?.can_review ?? false
  const canApprove = application?.reviewer_permissions?.can_approve ?? false
  const canReject = application?.reviewer_permissions?.can_reject ?? false
  const canShortlist = application?.reviewer_permissions?.can_shortlist ?? false
  const canWaitlist = application?.reviewer_permissions?.can_waitlist ?? false
  const canRevoke = application?.reviewer_permissions?.can_revoke ?? false
  const canSendReminders = application?.reviewer_permissions?.can_send_reminders ?? false
  const canSendEmails = application?.reviewer_permissions?.can_send_emails ?? false
  const piiMasked = (application as any)?.pii_masked ?? false

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
    autoAcquire: canReview, // Only auto-acquire if user can review
    autoExtend: canReview,
    autoRelease: true,
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
    const response = await fetch(`/api/reviewer/applications/${params.id}`)
    const result = await response.json()

    if (result.success && result.data) {
      const rawData = result.data as any

      // Check permissions
      if (!rawData.reviewer_permissions?.can_view) {
        setAlert({
          type: 'danger',
          message: 'You do not have permission to view this application'
        })
        setLoading(false)
        return
      }

      // Transform form_responses format to Application format
      const app: Application = {
        id: rawData.id,
        event_id: rawData.event_id,
        application_type: rawData.application_type || rawData.response_type || 'registration',

        // Map top-level fields
        name: rawData.respondent_name || rawData.name || '',
        email: rawData.respondent_email || rawData.email || '',
        status: rawData.status || 'pending',
        status_v2: rawData.status_v2,
        admin_notes: rawData.admin_notes || rawData.review_notes || '',
        submitted_at: rawData.completed_at || rawData.submitted_at || rawData.created_at,
        reviewed_at: rawData.reviewed_at,
        reviewed_by: rawData.reviewed_by,

        // Extract fields from responses JSONB
        ...(rawData.responses || {}),

        // Keep raw data for access to responses
        responses: rawData.responses,

        // Include reviewer permissions
        reviewer_permissions: rawData.reviewer_permissions,
      } as any

      setApplication(app)
      setNotes(app.admin_notes || '')

      // Create supabase client for fetching related data
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Fetch form questions - Use the template_id from THIS application
      // This ensures we show the questions that were actually answered, even if the event template changed
      if (rawData.template_id) {
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

      // Fetch survey data
      const { data: linkedSurvey } = await supabase
        .from('form_responses')
        .select('id, responses, template_id, status, is_complete, completed_at')
        .eq('respondent_email', rawData.respondent_email)
        .eq('response_type', 'detailed_survey')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: surveyTemplate } = await supabase
        .from('form_templates')
        .select('id, name')
        .eq('usage_type', 'detailed_survey')
        .limit(1)
        .maybeSingle()

      if (surveyTemplate) {
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
        setSurveyResponse(linkedSurvey)
      } else if (rawData.status_v2 === 'survey_completed' && rawData.responses) {
        setSurveyResponse({
          id: rawData.id,
          responses: rawData.responses,
          template_id: surveyTemplate?.id,
          status: rawData.status,
          is_complete: true,
          completed_at: rawData.completed_at
        })
      }

      // Issue #9, #24 FIX: Only fetch user profile if reviewer has canViewPII permission
      // This prevents PII leakage via direct database query
      const canViewPII = rawData.reviewer_permissions?.can_view_pii ?? true
      if (rawData.user_id && canViewPII) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', rawData.user_id)
          .single()

        if (profile) {
          setUserProfile(profile)
        }
      } else if (rawData.user_id && !canViewPII) {
        // Set masked profile placeholder
        setUserProfile({
          phone: '***-***-****',
          organization: 'Hidden',
          bio: null,
          role: 'applicant',
          email_verified: null
        })
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
  // STATUS CHANGE HANDLERS (WITH PERMISSION CHECKS)
  // ═══════════════════════════════════════════════════════════════════════

  const handleStatusChange = async (status: 'approved' | 'rejected' | 'pending' | 'waitlisted') => {
    if (!application) {
      showError('Error', 'Application data not loaded')
      return
    }

    // Permission check
    if (!canReview) {
      showError('Permission Denied', 'You do not have permission to change application status')
      return
    }

    if (status === 'approved' && !canApprove) {
      showError('Permission Denied', 'You do not have permission to approve applications')
      return
    }

    if (status === 'rejected' && !canReject) {
      showError('Permission Denied', 'You do not have permission to reject applications')
      return
    }

    if (!hasLock) {
      showError('Cannot Update', 'You must have the lock to update this application')
      return
    }

    // For approve/reject/waitlist, use the decision API which sends emails
    if (status === 'approved' || status === 'rejected' || status === 'waitlisted') {
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

    if (!canReview) {
      showError('Permission Denied', 'You do not have permission to save notes')
      return
    }

    if (!hasLock) {
      showError('Cannot Save', 'You must have the lock to save notes')
      return
    }

    setUpdating(true)
    try {
      // Use reviewer-specific API endpoint
      const response = await fetch(`/api/reviewer/applications/${params.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes
        })
      })
      const result = await response.json()

      if (result.success) {
        showSuccess('Notes Saved!', 'Your notes and recommendation have been saved')
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

    if (!canReview) {
      showError('Permission Denied', 'You do not have permission to shortlist applications')
      return
    }

    if (!hasLock) {
      showError('Cannot Shortlist', 'You must have the lock to shortlist this application')
      return
    }

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
        loadApplication()
      } else if (result.code === 'SURVEY_TEMPLATE_REQUIRED') {
        const templates = result.available_templates || []

        if (templates.length === 0) {
          showError(
            'No Survey Templates',
            'No survey templates are available. Please ask an admin to create a survey template first.'
          )
          setUpdating(false)
          return
        }

        const Swal = (await import('sweetalert2')).default

        const templateOptions: { [key: string]: string } = {}
        templates.forEach((t: any) => {
          templateOptions[t.id] = t.name
        })

        const { value: selectedTemplateId } = await Swal.fire({
          title: 'Select Survey Template',
          html: `
            <p class="text-muted mb-3">This event doesn't have a survey template attached. Please select one to send to shortlisted applicants.</p>
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
          setUpdating(false)
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

    if (!canReview) {
      showError('Permission Denied', 'You do not have permission to send reminders')
      return
    }

    if (!hasLock) {
      showError('Cannot Send Reminder', 'You must have the lock to send a reminder')
      return
    }

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

    if (!canApprove) {
      showError('Permission Denied', 'You do not have permission to revoke approvals')
      return
    }

    if (!hasLock) {
      showError('Cannot Revoke', 'You must have the lock to revoke approval')
      return
    }

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
      case 'accepted': return 'bg-success'
      case 'rejected': return 'bg-danger'
      case 'pending': return 'bg-warning'
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
      <DashboardLayout allowedRoles={['reviewer']}>
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
  // RENDER: NOT FOUND OR NO PERMISSION
  // ═══════════════════════════════════════════════════════════════════════

  if (!application || !canView) {
    return (
      <DashboardLayout allowedRoles={['reviewer']}>
        <div className="container-fluid">
          <div className="alert alert-danger">
            <i className="icofont-warning-alt me-2"></i>
            {!application ? 'Application not found' : 'You do not have permission to view this application'}
          </div>
          <button className="btn btn-secondary" onClick={() => router.push('/reviewer/applications')}>
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
    <DashboardLayout allowedRoles={['reviewer']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-8">
            <h2>
              <i className="icofont-paper me-2"></i>
              Review Application
            </h2>
            <div className="mt-2">
              <span className={`badge ${getTypeBadgeClass(applicationType)} me-2`}>
                {applicationType.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className={`badge ${getStatusBadgeClass((application as any).status_v2 || application.status)} fs-6`}>
                {getStatusDisplayText((application as any).status_v2 || application.status)}
              </span>
            </div>

            {/* Permission Badges (Issue #24: show all granted permissions) */}
            <div className="mt-2">
              {canView && <span className="badge bg-info me-1">Can View</span>}
              {canReview && <span className="badge bg-primary me-1">Can Review</span>}
              {canApprove && <span className="badge bg-success me-1">Can Approve</span>}
              {canReject && <span className="badge bg-danger me-1">Can Reject</span>}
              {canShortlist && <span className="badge bg-warning text-dark me-1">Can Shortlist</span>}
              {canWaitlist && <span className="badge bg-warning text-dark me-1">Can Waitlist</span>}
              {canRevoke && <span className="badge bg-dark me-1">Can Revoke</span>}
              {!canReview && <span className="badge bg-secondary">View Only</span>}
              {piiMasked && <span className="badge bg-secondary me-1">PII Hidden</span>}
            </div>
          </div>
          <div className="col-md-4 text-md-end">
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/reviewer/applications')}
            >
              <i className="icofont-arrow-left me-2"></i>
              Back to Applications
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* LOCK INDICATOR */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <LockIndicator
          hasLock={hasLock}
          isLockedByOther={isLockedByOther}
          lockedByName={lockStatus?.locked_by_email}
          lockedByEmail={lockStatus?.locked_by_email}
          timeUntilExpiry={timeUntilExpiry}
          canReview={canReview}
          onAcquireLock={async () => {
            if (lockActionLoading) return
            setLockActionLoading(true)
            try {
              const result = await acquireLock()
              if (result) {
                showSuccess('Lock Acquired', 'You can now add notes to this application')
              } else {
                showError('Failed to Acquire Lock', 'Could not acquire lock. Please try again.')
              }
            } catch (err) {
              showError('Error', 'An error occurred while acquiring the lock')
            } finally {
              setLockActionLoading(false)
            }
          }}
          onExtendLock={async () => {
            if (lockActionLoading) return
            setLockActionLoading(true)
            try {
              const result = await extendLock()
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
            try {
              const result = await releaseLock()
              if (result) {
                showSuccess('Lock Released', 'Lock has been released successfully')
                setTimeout(() => router.push('/reviewer/applications'), 1000)
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
          isAdmin={false}
        />

        {/* READ-ONLY MODE WARNING */}
        {isLockedByOther && (
          <div className="alert alert-warning mb-4">
            <i className="icofont-info-circle me-2"></i>
            <strong>Read-Only Mode:</strong> You cannot make changes while another user is reviewing this application.
          </div>
        )}

        {/* PII MASKED NOTICE (Issue #6) */}
        {piiMasked && (
          <div className="alert alert-warning mb-4">
            <i className="icofont-eye-blocked me-2"></i>
            <strong>PII Hidden:</strong> Personal identifying information (name, email, phone) has been masked. Contact an admin if you need PII access for this review.
          </div>
        )}

        {/* PERMISSION WARNING */}
        {!canReview && (
          <div className="alert alert-info mb-4">
            <i className="icofont-info-circle me-2"></i>
            <strong>View-Only Access:</strong> You can view this application but cannot make changes. Contact an admin if you need review permissions.
          </div>
        )}

        <div className="row">
          {/* Main Content - Application Details */}
          <div className="col-lg-8">
            {/* Issue #40 FIX: Merged Applicant & Account Information Card */}
            <div className="card mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="icofont-user me-2"></i>
                  Applicant Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Column 1: Account Information */}
                  <div className="col-md-6">
                    <h6 className="text-muted border-bottom pb-2 mb-3">
                      <i className="icofont-id-card me-1"></i> Account Details
                    </h6>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Full Name</label>
                      <p className="mb-0">
                        <strong>{application.name}</strong>
                        {piiMasked && <span className="badge bg-secondary ms-2">Masked</span>}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Email Address</label>
                      <p className="mb-0">
                        {piiMasked ? (
                          <span className="text-muted">{application.email}</span>
                        ) : (
                          <a href={`mailto:${application.email}`}>{application.email}</a>
                        )}
                      </p>
                    </div>
                    {userProfile && (
                      <>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Phone</label>
                          <p className="mb-0">
                            {piiMasked ? (
                              <span className="text-muted">{userProfile.phone || 'Hidden'}</span>
                            ) : (
                              userProfile.phone || 'N/A'
                            )}
                          </p>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Organization</label>
                          <p className="mb-0">{userProfile.organization || 'N/A'}</p>
                        </div>
                        {userProfile.bio && !piiMasked && (
                          <div className="mb-3">
                            <label className="form-label text-muted small">Bio</label>
                            <p className="mb-0 small">{userProfile.bio}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Column 2: Application Information */}
                  <div className="col-md-6">
                    <h6 className="text-muted border-bottom pb-2 mb-3">
                      <i className="icofont-paper me-1"></i> Application Details
                    </h6>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Application Type</label>
                      <p className="mb-0">
                        <span className={`badge ${getTypeBadgeClass(applicationType)}`}>
                          {applicationType.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Submitted At</label>
                      <p className="mb-0">
                        {new Date(application.submitted_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
                      </p>
                    </div>
                    {userProfile && (
                      <>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Role</label>
                          <p className="mb-0">
                            <span className="badge bg-primary">
                              {userProfile.role?.toUpperCase() || 'APPLICANT'}
                            </span>
                          </p>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Email Verified</label>
                          <p className="mb-0">
                            {userProfile.email_verified ? (
                              <span className="badge bg-success">✓ Verified</span>
                            ) : (
                              <span className="badge bg-warning">Not Verified</span>
                            )}
                          </p>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Account Created</label>
                          <p className="mb-0">
                            {new Date(userProfile.created_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
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
                  const rawData = application as any
                  const responses = rawData.responses || {}

                  if (formQuestions.length === 0) {
                    return <p className="text-muted">Loading questions...</p>
                  }

                  const answeredQuestions = formQuestions.filter(q => {
                    const answer = responses[q.id]
                    return answer !== undefined && answer !== null && answer !== ''
                  })

                  if (answeredQuestions.length === 0) {
                    return <p className="text-muted">No responses recorded for this application.</p>
                  }

                  // Issue #26 FIX: Resolve option labels from config.options
                  const resolveLabel = (question: any, val: string): string => {
                    const opts = question.options || question.config?.options
                    if (!opts || !Array.isArray(opts)) return val
                    const opt = opts.find((o: any) => o.id === val || o.value === val || o.key === val)
                    return opt?.label || opt?.text || val
                  }

                  return answeredQuestions.map((question) => {
                    const answer = responses[question.id]

                    // Issue #6, #7, #47: Improved file detection
                    // Check if this is a file upload question by type OR by checking data structure
                    const isFileType = question.type === 'file_upload'
                    const hasFileProperties = (obj: any): boolean => {
                      if (!obj || typeof obj !== 'object') return false
                      return 'url' in obj || 'fileName' in obj || 'originalName' in obj || 'path' in obj
                    }
                    const isFile = isFileType || (typeof answer === 'object' && answer !== null && !Array.isArray(answer) && hasFileProperties(answer))
                    const isFileArray = Array.isArray(answer) && answer.length > 0 && (isFileType || hasFileProperties(answer[0]))

                    // Helper to render file link with download button
                    const renderFileLink = (file: any, i: number) => {
                      const fileUrl = file?.url || file?.path || '#'
                      const fileName = file?.originalName || file?.fileName || file?.name || 'Uploaded File'
                      const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE'
                      return (
                        <li key={i} className="mb-2">
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
                    }

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
                          {(isFile || isFileArray) ? (
                            <ul className="mb-0 list-unstyled">
                              {(Array.isArray(answer) ? answer : [answer]).map(renderFileLink)}
                            </ul>
                          ) : Array.isArray(answer) ? (
                            <ul className="mb-0 list-unstyled">
                              {answer.map((item, idx) => (
                                <li key={idx} className="d-flex align-items-center mb-1">
                                  <i className="icofont-check-circled text-success me-2"></i>
                                  <strong>{typeof item === 'string' ? resolveLabel(question, item) : (typeof item === 'object' ? JSON.stringify(item) : String(item))}</strong>
                                </li>
                              ))}
                            </ul>
                          ) : typeof answer === 'object' && answer !== null ? (
                            <pre className="bg-light p-2 rounded small">
                              {JSON.stringify(answer, null, 2)}
                            </pre>
                          ) : (
                            <p className="mb-0"><strong>{typeof answer === 'string' ? resolveLabel(question, answer) : String(answer)}</strong></p>
                          )}
                        </div>
                      </div>
                    )
                  })
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
                        const sOpts = question.options || question.config?.options
                        const resolveSLabel = (val: string): string => {
                          if (!sOpts || !Array.isArray(sOpts)) return val
                          const opt = sOpts.find((o: any) => o.id === val || o.value === val || o.key === val)
                          return opt?.label || opt?.text || val
                        }

                        // Issue #6, #7, #47: Improved file detection
                        const isFileType = question.type === 'file_upload'
                        const hasFileProps = (obj: any): boolean => {
                          if (!obj || typeof obj !== 'object') return false
                          return 'url' in obj || 'fileName' in obj || 'originalName' in obj || 'path' in obj
                        }
                        const isFile = isFileType || (typeof answer === 'object' && answer !== null && !Array.isArray(answer) && hasFileProps(answer))
                        const isFileArray = Array.isArray(answer) && answer.length > 0 && (isFileType || hasFileProps(answer[0]))

                        // Helper to render file link with download button
                        const renderFile = (file: any, i: number) => {
                          const fileUrl = file?.url || file?.path || '#'
                          const fileName = file?.originalName || file?.fileName || file?.name || 'Uploaded File'
                          const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE'
                          return (
                            <li key={i} className="mb-2">
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
                        }

                        return (
                          <div key={question.id} className="mb-4 pb-3 border-bottom">
                            <label className="form-label text-muted small mb-1">
                              <strong>{question.title}</strong>
                            </label>
                            {question.description && (
                              <p className="text-muted small mb-2">{question.description}</p>
                            )}
                            <div className="ms-3">
                              {(isFile || isFileArray) ? (
                                <ul className="mb-0 list-unstyled">
                                  {(Array.isArray(answer) ? answer : [answer]).map(renderFile)}
                                </ul>
                              ) : Array.isArray(answer) ? (
                                <ul className="mb-0 list-unstyled">
                                  {answer.map((item, idx) => (
                                    <li key={idx} className="d-flex align-items-center mb-1">
                                      <i className="icofont-check-circled text-success me-2"></i>
                                      <strong>{typeof item === 'string' ? resolveSLabel(item) : (typeof item === 'object' ? JSON.stringify(item) : String(item))}</strong>
                                    </li>
                                  ))}
                                </ul>
                              ) : typeof answer === 'object' && answer !== null ? (
                                <pre className="bg-light p-2 rounded small">
                                  {JSON.stringify(answer, null, 2)}
                                </pre>
                              ) : (
                                <p className="mb-0"><strong>{typeof answer === 'string' ? resolveSLabel(answer) : String(answer)}</strong></p>
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
                  <i className="icofont-eye-alt me-2"></i>
                  Application Review
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

                {/* Issue #24 FIX: Dynamic access description based on actual permissions */}
                <div className="alert alert-info py-2 mb-3">
                  <i className="icofont-info-circle me-2"></i>
                  <strong>Your Access:</strong>{' '}
                  {canReview ? 'You can add notes/recommendations.' : 'View-only access.'}{' '}
                  {(canApprove || canReject || canShortlist || canWaitlist) ? (
                    <>
                      Actions available:{' '}
                      {[
                        canApprove && 'Approve',
                        canReject && 'Reject',
                        canShortlist && 'Shortlist',
                        canWaitlist && 'Waitlist',
                        canRevoke && 'Revoke',
                      ].filter(Boolean).join(', ')}.
                    </>
                  ) : (
                    'Status changes require additional permissions.'
                  )}
                </div>

                {/* Issue #24: Action buttons based on permissions */}
                {(canApprove || canReject || canShortlist || canWaitlist) && (
                  <div className="mb-3">
                    <label className="form-label text-muted small">Quick Actions</label>
                    <div className="d-grid gap-2">
                      {canApprove && (application as any).status_v2 !== 'approved' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusChange('approved')}
                          disabled={updating || !hasLock}
                        >
                          <i className="icofont-check-circled me-1"></i> Approve
                        </button>
                      )}
                      {canReject && (application as any).status_v2 !== 'rejected' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusChange('rejected')}
                          disabled={updating || !hasLock}
                        >
                          <i className="icofont-close-circled me-1"></i> Reject
                        </button>
                      )}
                      {canShortlist && ['pending', 'interested'].includes((application as any).status_v2 || '') && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleShortlist()}
                          disabled={updating || !hasLock}
                        >
                          <i className="icofont-star me-1"></i> Shortlist
                        </button>
                      )}
                      {canWaitlist && (application as any).status_v2 !== 'waitlisted' && (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleStatusChange('waitlisted')}
                          disabled={updating || !hasLock}
                        >
                          <i className="icofont-clock-time me-1"></i> Waitlist
                        </button>
                      )}
                      {canSendReminders && (application as any).status_v2 === 'survey_sent' && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={handleSendReminder}
                          disabled={updating || !hasLock}
                        >
                          <i className="icofont-email me-1"></i> Send Reminder
                        </button>
                      )}
                      {canRevoke && (application as any).status_v2 === 'approved' && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRevokeApproval()}
                          disabled={updating || !hasLock}
                        >
                          <i className="icofont-undo me-1"></i> Revoke Approval
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <hr />

                {/* Reviewer Notes/Recommendation */}
                <label className="form-label text-muted small">
                  <i className="icofont-pencil-alt-2 me-1"></i>
                  Your Notes & Recommendation
                </label>
                <textarea
                  className="form-control mb-3"
                  rows={8}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={canReview ? "Add your notes and recommendation for this application. Admins will review your feedback when making decisions..." : "You can view notes but cannot edit them"}
                  disabled={updating || !hasLock || !canReview}
                />
                {canReview && (
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleSaveNotes}
                    disabled={updating || !hasLock}
                    title={!hasLock ? 'You need the lock to save notes' : 'Save your notes and recommendation'}
                  >
                    {updating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="icofont-save me-2"></i>
                        Save Notes & Recommendation
                      </>
                    )}
                  </button>
                )}
                {!canReview && (
                  <div className="alert alert-secondary py-2 mb-0 small">
                    <i className="icofont-ban me-1"></i>
                    You cannot save notes (view-only access)
                  </div>
                )}
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

    </DashboardLayout>
  )
}
