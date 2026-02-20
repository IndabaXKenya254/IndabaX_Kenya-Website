'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT REGISTRATION PAGE
// ═══════════════════════════════════════════════════════════════════════
// Public-facing event registration form
// Phase 4: Registration Flow
// Updated: Dec 30, 2025 - Use AuthContext for instant auth checks
// Updated: Jan 2026 - Issue #28 FIX: Block admin access immediately

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSwal } from '@/lib/sweetalert'
import { FormRenderer } from '@/components/forms/FormRenderer'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Question, Template } from '@/hooks/useFormBuilder'

// Issue #44 FIX: Remap responses when question IDs have changed after template edit
function remapResponses(
  oldResponses: Record<string, any>,
  currentQuestions: Question[],
  templateSnapshot?: any[]
): Record<string, any> {
  if (!oldResponses || !currentQuestions.length) return oldResponses

  const currentIds = new Set(currentQuestions.map(q => q.id))
  const oldKeys = Object.keys(oldResponses).filter(k => k !== 'email' && k !== 'name')

  // Check if old keys match current question IDs
  const matchCount = oldKeys.filter(k => currentIds.has(k)).length
  const answerableQuestions = currentQuestions.filter(q =>
    !['section_break', 'title_description', 'image', 'video'].includes(q.type)
  )

  // If most keys match, no remapping needed
  if (matchCount >= Math.min(oldKeys.length, answerableQuestions.length) * 0.5) {
    return oldResponses
  }

  // Keys don't match - try to remap using template_snapshot
  if (templateSnapshot && Array.isArray(templateSnapshot)) {
    const remapped: Record<string, any> = {}

    // Build old ID -> order mapping from snapshot
    const snapshotByOrder = templateSnapshot
      .filter((q: any) => !['section_break', 'title_description', 'image', 'video'].includes(q.type))
      .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))

    // Build current ID -> order mapping
    const currentByOrder = answerableQuestions
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

    // Map old IDs to new IDs by matching order position
    snapshotByOrder.forEach((oldQ: any, idx: number) => {
      const newQ = currentByOrder[idx]
      if (newQ && oldResponses[oldQ.id] !== undefined) {
        remapped[newQ.id] = oldResponses[oldQ.id]
      }
    })

    // Preserve non-question fields
    if (oldResponses.email) remapped.email = oldResponses.email
    if (oldResponses.name) remapped.name = oldResponses.name

    return Object.keys(remapped).length > 0 ? remapped : oldResponses
  }

  // No snapshot - fallback: try order-based mapping
  const sortedOldKeys = oldKeys
  const sortedCurrentIds = answerableQuestions
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map(q => q.id)

  const remapped: Record<string, any> = {}
  sortedOldKeys.forEach((oldKey, idx) => {
    if (idx < sortedCurrentIds.length) {
      remapped[sortedCurrentIds[idx]] = oldResponses[oldKey]
    }
  })

  if (oldResponses.email) remapped.email = oldResponses.email
  if (oldResponses.name) remapped.name = oldResponses.name

  return Object.keys(remapped).length > 0 ? remapped : oldResponses
}

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  venue?: string
  featured_image: string
  registration_enabled: boolean
  registration_deadline: string | null
  initial_template_id: string | null
}

export default function EventRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: authUser, loading: authLoading } = useAuth() // Use AuthContext
  const eventSlug = params.slug as string
  const resumeToken = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<Event | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [initialResponses, setInitialResponses] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resumeTokenState, setResumeTokenState] = useState<string | null>(resumeToken)
  const [responseId, setResponseId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [adminBlocked, setAdminBlocked] = useState(false) // Issue #28: Track if admin is blocked
  const [emailNotVerified, setEmailNotVerified] = useState(false) // Issue #11: Track if email not verified
  const [notLoggedIn, setNotLoggedIn] = useState(false) // Track if user is not logged in
  const hasCheckedAuth = useRef(false)

  // FIX: Immediately check if user is NOT logged in and block BEFORE showing any content
  useEffect(() => {
    if (authLoading) return // Wait for auth to be ready

    // Check if user is not logged in - block immediately without showing page
    if (!authUser) {
      setNotLoggedIn(true)
      // Show dialog and redirect to login
      ;(async () => {
        const Swal = await getSwal()
        Swal.fire({
          icon: 'warning',
          title: 'Login Required',
          text: 'You must be logged in to register for this event.',
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#0d6efd',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          router.push(`/login?redirect=/events/${eventSlug}/register`)
        })
      })()
      return
    }
  }, [authLoading, authUser, eventSlug, router])

  // Issue #28 FIX: Immediately check for admin role and block BEFORE showing any content
  // This effect runs as soon as authLoading becomes false
  useEffect(() => {
    if (authLoading) return // Wait for auth to be ready
    if (notLoggedIn) return // Not logged in check takes priority

    // Check if user is admin - block immediately without showing page
    if (authUser && (authUser.role === 'admin' || authUser.role === 'super_admin')) {
      setAdminBlocked(true)
      // Show dialog and redirect
      ;(async () => {
        const Swal = await getSwal()
        Swal.fire({
          icon: 'info',
          title: 'Admin Account Detected',
          html: `You are currently logged in as an <strong>Administrator</strong>.<br><br>To register for events, please logout and login with a regular applicant account.`,
          confirmButtonText: 'Logout & Login as Applicant',
          showCancelButton: true,
          cancelButtonText: 'Back to Event',
          confirmButtonColor: '#0d6efd',
          cancelButtonColor: '#6c757d',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(async (result: any) => {
          if (result.isConfirmed) {
            // Logout the admin and redirect to login page
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push(`/login?redirect=/events/${eventSlug}/register`)
          } else {
            router.push(`/events/${eventSlug}`)
          }
        })
      })()
      return
    }
  }, [authLoading, authUser, eventSlug, router, notLoggedIn])

  // Issue #11 FIX: Immediately check for email verification and block BEFORE showing any content
  // This effect runs as soon as authLoading becomes false
  useEffect(() => {
    if (authLoading) return // Wait for auth to be ready
    if (notLoggedIn) return // Not logged in check takes priority
    if (adminBlocked) return // Admin check takes priority

    // Check if user is logged in but email not verified - block immediately without showing page
    if (authUser && authUser.emailVerified !== true) {
      setEmailNotVerified(true)
      // Show dialog and redirect
      ;(async () => {
        const Swal = await getSwal()
        Swal.fire({
          icon: 'warning',
          title: 'Email Verification Required',
          html: `You must verify your email address before registering for events.<br><br>Please check your inbox for the verification link sent to <strong>${authUser.email}</strong>.`,
          confirmButtonText: 'Go to Verification Page',
          showCancelButton: true,
          cancelButtonText: 'Resend Email',
          confirmButtonColor: '#0d6efd',
          cancelButtonColor: '#6c757d',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(async (result: any) => {
          if (result.isConfirmed) {
            router.push(`/verify-email?email=${encodeURIComponent(authUser.email)}`)
          } else {
            // Resend verification email
            try {
              await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: authUser.email }),
              })
              Swal.fire({
                icon: 'success',
                title: 'Verification Email Sent',
                text: 'Please check your inbox and click the verification link.',
                confirmButtonColor: '#0d6efd',
              }).then(() => {
                router.push(`/verify-email?email=${encodeURIComponent(authUser.email)}`)
              })
            } catch {
              Swal.fire({
                icon: 'error',
                title: 'Failed to Send Email',
                text: 'Please try again later.',
                confirmButtonColor: '#0d6efd',
              }).then(() => {
                router.push(`/verify-email?email=${encodeURIComponent(authUser.email)}`)
              })
            }
          }
        })
      })()
      return
    }
  }, [authLoading, authUser, adminBlocked, notLoggedIn, router])

  // Wait for auth to be ready, then check and load form (only for verified non-admin users)
  useEffect(() => {
    if (authLoading) return // Wait for auth to be ready
    if (hasCheckedAuth.current) return // Prevent double-check
    if (notLoggedIn) return // Don't proceed if not logged in
    if (adminBlocked) return // Don't proceed if admin is blocked
    if (emailNotVerified) return // Don't proceed if email not verified

    // Skip if user is not logged in (handled by the not logged in effect above)
    if (!authUser) {
      return
    }

    // Skip if user is admin (handled by the admin block effect above)
    if (authUser.role === 'admin' || authUser.role === 'super_admin') {
      return
    }

    // Skip if email not verified (handled by the email verification effect above)
    if (authUser.emailVerified !== true) {
      return
    }

    hasCheckedAuth.current = true

    checkAuthAndLoadForm()
  }, [authLoading, eventSlug, adminBlocked, emailNotVerified, notLoggedIn, authUser])

  const checkAuthAndLoadForm = async () => {
    const Swal = await getSwal()
    // Check if user is logged in (instant from AuthContext)
    if (!authUser) {
      // Show SweetAlert and redirect to login
      setLoading(false)
      await Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'You must be logged in to register for this event.',
        confirmButtonText: 'Go to Login',
        confirmButtonColor: '#0d6efd',
        allowOutsideClick: false,
        allowEscapeKey: false,
      })
      router.push(`/login?redirect=/events/${eventSlug}/register`)
      return
    }

    // Check if email is verified
    // IMPORTANT: Use !== true to catch both false AND undefined cases
    if (authUser.emailVerified !== true) {
      setLoading(false)
      await Swal.fire({
        icon: 'warning',
        title: 'Email Verification Required',
        html: `You must verify your email address before registering for events.<br><br>Please check your inbox for the verification link sent to <strong>${authUser.email}</strong>.`,
        confirmButtonText: 'Go to Verification Page',
        showCancelButton: true,
        cancelButtonText: 'Resend Email',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result: any) => {
        if (result.isConfirmed) {
          router.push(`/verify-email?email=${encodeURIComponent(authUser.email)}`)
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Resend verification email
          fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authUser.email }),
          }).then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Verification Email Sent',
              text: 'Please check your inbox and click the verification link.',
              confirmButtonColor: '#0d6efd',
            }).then(() => {
              router.push(`/verify-email?email=${encodeURIComponent(authUser.email)}`)
            })
          }).catch(() => {
            Swal.fire({
              icon: 'error',
              title: 'Failed to Send Email',
              text: 'Please try again later.',
              confirmButtonColor: '#0d6efd',
            })
          })
        }
      })
      return
    }

    // Issue #28: Admin check is now handled by the useEffect above
    // If we reach here, user is not an admin (already verified in the effect)

    // OPTIMIZED: Single API call for event + registration status
    try {
      const statusResponse = await fetch(`/api/events/${eventSlug}/registration-status`)
      const statusResult = await statusResponse.json()

      if (!statusResult.success || !statusResult.data?.event) {
        setLoading(false)
        await Swal.fire({
          icon: 'error',
          title: 'Event Not Found',
          text: 'The event you are looking for does not exist.',
          confirmButtonText: 'Browse Events',
          confirmButtonColor: '#0d6efd',
        })
        router.push('/events')
        return
      }

      const { event: eventData, registration, canRegister, canModify, reason } = statusResult.data

      // If user has completed registration
      if (registration?.status === 'completed') {
        if (!canModify) {
          // Cannot modify - show message and redirect
          setEvent(eventData)
          setSubmitted(true)
          setLoading(false)

          const result = await Swal.fire({
            icon: 'info',
            title: 'Already Registered!',
            html: `You have already registered for <strong>${eventData.title}</strong>.<br><br>${reason || 'Modifications are no longer allowed.'}`,
            confirmButtonText: 'View Dashboard',
            showCancelButton: true,
            cancelButtonText: 'Back to Event',
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
          })
          if (result.isConfirmed) {
            router.push('/dashboard')
          } else {
            router.push(`/events/${eventSlug}`)
          }
          return
        }

        // Can modify - ask for confirmation
        const confirmModify = await Swal.fire({
          icon: 'question',
          title: 'Modify Registration?',
          html: `You have already registered for <strong>${eventData.title}</strong>.<br><br>Do you want to modify your existing registration?`,
          confirmButtonText: 'Yes, Modify',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#ffc107',
          cancelButtonColor: '#6c757d',
        })

        if (!confirmModify.isConfirmed) {
          router.push(`/events/${eventSlug}`)
          return
        }

        // Pre-fill with existing responses (remapping happens later in loadFormTemplate)
        if (registration.responses) {
          setInitialResponses(prev => ({
            ...prev,
            ...registration.responses,
            // Issue #44: Store snapshot for remapping after questions load
            _templateSnapshot: registration.template_snapshot,
          }))
        }
        if (registration.resume_token) {
          setResumeTokenState(registration.resume_token)
        }
        if (registration.id) {
          setResponseId(registration.id)
        }
      }

      // Check if registration is allowed
      if (!canRegister && !canModify) {
        setLoading(false)
        await Swal.fire({
          icon: 'info',
          title: 'Registration Not Available',
          text: reason || 'Registration is not available for this event.',
          confirmButtonText: 'Back to Event',
          confirmButtonColor: '#0d6efd',
        })
        router.push(`/events/${eventSlug}`)
        return
      }

      // Store event data
      setEvent(eventData)

      // Get Supabase user for metadata (parallel with form load)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user || authUser)

      // Pre-fill email from auth
      const userName = user?.user_metadata?.full_name ||
                      user?.user_metadata?.name ||
                      authUser?.email?.split('@')[0] || ''

      setInitialResponses(prev => ({
        ...prev,
        email: authUser?.email || user?.email || '',
        name: userName,
      }))

      // Load form template (only need this now, event is already loaded)
      await loadFormTemplate(eventData.initial_template_id, eventData.id)

    } catch (err) {
      console.error('Registration status check failed:', err)
      setLoading(false)
      await Swal.fire({
        icon: 'error',
        title: 'Something Went Wrong',
        text: 'Failed to load registration. Please try again.',
        confirmButtonText: 'Back to Events',
        confirmButtonColor: '#0d6efd',
      })
      router.push('/events')
    }
  }

  // OPTIMIZED: Load only form template and questions (event already loaded)
  const loadFormTemplate = async (templateId: string, eventId: string) => {
    const Swal = await getSwal()
    try {
      // PARALLEL: Load template and questions simultaneously
      const [templateResponse, questionsResponse] = await Promise.all([
        fetch(`/api/forms/templates/${templateId}`),
        fetch(`/api/forms/templates/${templateId}/questions`),
      ])

      const [templateResult, questionsResult] = await Promise.all([
        templateResponse.json(),
        questionsResponse.json(),
      ])

      if (!templateResult.success || !templateResult.data) {
        setLoading(false)
        await Swal.fire({
          icon: 'error',
          title: 'Form Not Found',
          text: 'The registration form could not be loaded. Please try again later.',
          confirmButtonText: 'Back to Event',
          confirmButtonColor: '#0d6efd',
        })
        router.push(`/events/${eventSlug}`)
        return
      }

      setTemplate(templateResult.data)

      const loadedQuestions = questionsResult.success ? questionsResult.data : []
      if (loadedQuestions.length > 0) {
        setQuestions(loadedQuestions)

        // Issue #44 FIX: Remap existing responses if question IDs changed after template edit
        setInitialResponses(prev => {
          const { _templateSnapshot, ...rawResponses } = prev
          if (Object.keys(rawResponses).length > 0) {
            const remapped = remapResponses(rawResponses, loadedQuestions, _templateSnapshot)
            return remapped
          }
          return prev
        })
      }

      // If we have a resume token, check for that specific response
      if (resumeToken) {
        const responseResponse = await fetch(
          `/api/forms/responses?event_id=${eventId}&resume_token=${resumeToken}`
        )
        const responseResult = await responseResponse.json()

        if (responseResult.success && responseResult.data) {
          const existingResponse = responseResult.data
          if (existingResponse.status !== 'completed') {
            // Issue #44 FIX: Remap resume token responses if question IDs changed
            const rawResponses = existingResponse.responses || {}
            const remapped = remapResponses(rawResponses, loadedQuestions, existingResponse.template_snapshot)
            setInitialResponses(prev => ({
              ...prev,
              ...remapped
            }))
            setResponseId(existingResponse.id)
            setResumeTokenState(existingResponse.resume_token)
          }
        }
      }

      // SUCCESS: Form loaded
      setLoading(false)
    } catch (err) {
      console.error('Error loading form template:', err)
      setLoading(false)
      await Swal.fire({
        icon: 'error',
        title: 'Something Went Wrong',
        text: 'Failed to load the registration form. Please try again.',
        confirmButtonText: 'Back to Event',
        confirmButtonColor: '#0d6efd',
      })
      router.push(`/events/${eventSlug}`)
    }
  }

  // LEGACY: Keep for backwards compatibility (not used in optimized flow)
  const loadEventAndForm = async () => {
    // This function is kept for backwards compatibility but the optimized
    // flow uses loadFormTemplate instead after the combined API call
    try {
      setLoading(true)
      setError(null)

      // Load event details by slug
      const eventResponse = await fetch(`/api/events/${eventSlug}`)
      const eventResult = await eventResponse.json()

      if (!eventResult.success || !eventResult.data) {
        setLoading(false)
        router.push('/events')
        return
      }

      const eventData = eventResult.data
      setEvent(eventData)

      if (!eventData.initial_template_id) {
        setLoading(false)
        router.push(`/events/${eventSlug}`)
        return
      }

      await loadFormTemplate(eventData.initial_template_id, eventData.id)
    } catch (err) {
      console.error('Error loading event:', err)
      setLoading(false)
      router.push('/events')
    }
  }


  const handleAutoSave = async (responses: Record<string, any>) => {
    if (!event || !template) return

    // Get respondent info from responses OR logged-in user
    let respondent_email = currentUser?.email || ''
    let respondent_name = ''

    // Extract from form responses (may override logged-in email)
    questions.forEach(q => {
      const lowerTitle = q.title.toLowerCase()
      if (lowerTitle.includes('email') && responses[q.id]) {
        respondent_email = responses[q.id]
      }
      if (lowerTitle.includes('name') && responses[q.id]) {
        respondent_name = responses[q.id]
      }
    })

    // Skip auto-save if no email yet (logged-in users always have email)
    if (!respondent_email) return

    try {
      // Use template's usage_type as response_type, default to 'application'
      const responseType = (template as any).usage_type || 'application'

      const response = await fetch('/api/forms/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          event_id: event.id,
          response_type: responseType,
          respondent_email,
          respondent_name,
          responses,
          is_complete: false,
          resume_token: resumeTokenState,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        // Save resume token and response ID for future auto-saves
        if (result.data.resume_token && !resumeTokenState) {
          setResumeTokenState(result.data.resume_token)
        }
        if (result.data.id && !responseId) {
          setResponseId(result.data.id)
        }
      }
    } catch (err) {
      console.error('Auto-save error:', err)
      // Silently fail auto-save - don't disrupt user experience
    }
  }

  const handleSubmit = async (responses: Record<string, any>) => {
    if (!event || !template || submitting) return
    const Swal = await getSwal()

    try {
      setSubmitting(true)
      setError(null)

      // Get respondent info from responses
      // PRIORITY: Form question answers FIRST, then pre-filled values
      // This ensures the name entered in the form is used, not the profile name
      let respondent_email = ''
      let respondent_name = ''

      // First, look for name/email in form question responses (by question title)
      questions.forEach(q => {
        const lowerTitle = q.title.toLowerCase()
        if (lowerTitle.includes('email') && responses[q.id] && !respondent_email) {
          respondent_email = responses[q.id]
        }
        // Check for name questions - prioritize "full name" over just "name"
        if ((lowerTitle.includes('full name') || lowerTitle.includes('your name') ||
             (lowerTitle.includes('name') && !lowerTitle.includes('username') && !lowerTitle.includes('nickname')))
            && responses[q.id] && !respondent_name) {
          respondent_name = responses[q.id]
        }
      })

      // Fall back to pre-filled values only if not found in form questions
      if (!respondent_email) {
        respondent_email = responses.email || currentUser?.email || ''
      }
      if (!respondent_name) {
        respondent_name = responses.name || ''
      }

      if (!respondent_email) {
        setError('Email is required for registration')
        return
      }

      // Use template's usage_type as response_type, default to 'application'
      const responseType = (template as any).usage_type || 'application'

      // Submit form response
      const response = await fetch('/api/forms/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          event_id: event.id,
          response_type: responseType,
          respondent_email,
          respondent_name,
          responses,
          is_complete: true,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        if (result.error?.code === 'ALREADY_SUBMITTED') {
          await Swal.fire({
            icon: 'info',
            title: 'Already Registered',
            text: 'You have already registered for this event. Check your email for confirmation.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0d6efd',
          })
          setSubmitted(true)
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: result.error?.message || 'Failed to submit registration. Please try again.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0d6efd',
          })
        }
        return
      }

      // Issue #31 FIX: Clear localStorage draft on successful submission
      if (event?.id && authUser?.id && typeof window !== 'undefined') {
        localStorage.removeItem(`form-draft-${event.id}-${authUser.id}`)
      }

      // Show success message with SweetAlert
      await Swal.fire({
        icon: 'success',
        title: 'Registration Submitted!',
        text: 'Thank you for registering. A confirmation email will be sent to you shortly.',
        confirmButtonText: 'Great!',
        confirmButtonColor: '#198754',
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting form:', err)
      await Swal.fire({
        icon: 'error',
        title: 'Submission Error',
        text: 'An error occurred while submitting your registration. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0d6efd',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // FIX: Show nothing while auth is loading, not logged in, admin is blocked, or email not verified
  // This prevents any page content from flashing before redirect
  if (authLoading || notLoggedIn || adminBlocked || emailNotVerified) {
    return null
  }

  // Loading state (only shown for non-admin users after auth check passes)
  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading registration form...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state - now handled by SweetAlert with redirects
  // This is a fallback in case any error slips through
  if (error) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Redirecting...</span>
            </div>
            <p className="text-muted">Redirecting...</p>
          </div>
        </div>
      </div>
    )
  }

  // Success state - Already registered
  if (submitted) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-success">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="icofont-check-circled text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h3 className="mb-3">Already Registered!</h3>
                <p className="text-muted mb-4">
                  You have already submitted your registration for <strong>{event?.title}</strong>.
                  <br />
                  A confirmation email was sent to your registered email address.
                </p>

                {event && (
                  <div className="alert alert-info text-start mb-4">
                    <h6 className="mb-2"><i className="icofont-info-circle me-2"></i>Event Details</h6>
                    <p className="mb-1"><strong>Event:</strong> {event.title}</p>
                    {event.start_date && (
                      <p className="mb-1">
                        <strong>Date:</strong> {new Date(event.start_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    {(event.location || event.venue) && (
                      <p className="mb-0"><strong>Location:</strong> {event.location || event.venue}</p>
                    )}
                  </div>
                )}

                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Link href="/dashboard" className="btn btn-outline-primary">
                    <i className="icofont-dashboard me-2"></i>
                    View Dashboard
                  </Link>
                  <Link href={`/events/${eventSlug}`} className="btn btn-outline-secondary">
                    <i className="icofont-arrow-left me-2"></i>
                    Back to Event
                  </Link>
                  <Link href="/events" className="btn btn-primary">
                    <i className="icofont-ui-calendar me-2"></i>
                    View All Events
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Registration form
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Event Header */}
          <div className="mb-4">
            <Link href={`/events/${eventSlug}`} className="text-decoration-none text-muted d-inline-flex align-items-center mb-3">
              <i className="icofont-arrow-left me-2"></i>
              Back to Event Details
            </Link>
            <h1 className="mb-2">Register for {event?.title}</h1>
            <p className="text-muted mb-0">
              <i className="icofont-ui-calendar me-2"></i>
              {event?.start_date && new Date(event.start_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {event?.end_date && ` - ${new Date(event.end_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`}
              <span className="mx-2">•</span>
              <i className="icofont-location-pin me-1"></i>
              {event?.location}
            </p>
            {event?.registration_deadline && (
              <p className="text-warning mt-2 mb-0">
                <i className="icofont-clock-time me-2"></i>
                Registration closes: {new Date(event.registration_deadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Form Renderer */}
          {template && questions.length > 0 && (
            <FormRenderer
              template={template}
              questions={questions}
              initialResponses={initialResponses}
              onSubmit={handleSubmit}
              disabled={submitting}
              showProgress={true}
              submitButtonText={
                template.name?.toLowerCase().includes('interest')
                  ? 'Submit Interest'
                  : 'Submit Registration'
              }
              autoSave={true}
              autoSaveDelay={3000}
              onAutoSave={handleAutoSave}
              // Issue #31: Enable localStorage draft saving
              // Key is unique per event + user to avoid conflicts
              draftKey={event?.id && authUser?.id ? `${event.id}-${authUser.id}` : undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}
