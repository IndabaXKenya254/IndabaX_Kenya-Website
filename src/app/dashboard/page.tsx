'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPLICANT/SPEAKER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
// Dashboard for applicants and speakers with side navigation
// Phase 2: Role-Based System
// Phase 4: Enhanced with event registration tracking
// Updated: Dec 29, 2025 - Added pre-navigation checks with SweetAlert

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSwal } from '@/lib/sweetalert'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface DashboardStats {
  activeApplications: number
  acceptedApplications: number
  rejectedApplications: number
  waitlistedApplications: number
  pendingReview: number
  profileCompleteness: number
}

interface Event {
  id: string
  slug: string
  title: string
  description: string
  start_date: string | null
  end_date: string | null
  location: string | null
  featured_image: string | null
  registration_enabled: boolean
  registration_deadline: string | null
  initial_template_id: string | null // Form template for registration
}

interface UserRegistration {
  event_id: string
  status: 'in_progress' | 'completed'
  status_v2?: string | null
  reviewed_by?: string | null
  shortlisted_by?: string | null
  approved_by?: string | null
  rejected_by?: string | null
  completed_at: string | null
  event: Event | null // Can be null if event was deleted
}

// Helper function to check if user can modify their registration
const canModifyRegistration = (registration: UserRegistration): boolean => {
  if (!registration.event) return false

  // Check if deadline has passed
  const deadline = registration.event.registration_deadline
  if (deadline && new Date(deadline) < new Date()) {
    return false
  }

  // Check if admin has reviewed/processed the application
  const adminProcessedStatuses = ['shortlisted', 'survey_sent', 'survey_completed', 'approved', 'rejected', 'attended']
  const hasAdminReviewed = registration.reviewed_by ||
                           registration.shortlisted_by ||
                           registration.approved_by ||
                           registration.rejected_by ||
                           (registration.status_v2 && adminProcessedStatuses.includes(registration.status_v2))

  return !hasAdminReviewed
}

export default function ApplicantDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myEvents, setMyEvents] = useState<UserRegistration[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [checkingEventId, setCheckingEventId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Redirect admins to their own dashboard (reviewers can access applicant dashboard)
  useEffect(() => {
    if (!user) return

    if (user.role === 'admin') {
      router.replace('/admin/dashboard')
      return
    }
  }, [user, router])

  // Handle register button click - OPTIMIZED: Single API check BEFORE navigating
  const handleRegisterClick = async (event: Event) => {
    const Swal = await getSwal()
    // Quick client-side check first (instant)
    const isAlreadyRegistered = myEvents.some(r => r.event_id === event.id)
    if (isAlreadyRegistered) {
      await Swal.fire({
        icon: 'info',
        title: 'Already Registered!',
        html: `You have already registered for <strong>${event.title}</strong>.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#198754',
      })
      return
    }

    // OPTIMIZED: Single API call to verify everything server-side
    setCheckingEventId(event.id)
    try {
      const response = await fetch(`/api/events/${event.slug}/registration-status`)
      const result = await response.json()

      if (!result.success || !result.data?.event) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to check registration status. Please try again.',
          confirmButtonColor: '#0d6efd',
        })
        return
      }

      const { canRegister, canModify, reason, registration } = result.data

      // Already registered - shouldn't happen but handle it
      if (registration?.status === 'completed') {
        if (canModify) {
          const confirmModify = await Swal.fire({
            icon: 'question',
            title: 'Modify Registration?',
            html: `You have already registered. Do you want to modify?`,
            confirmButtonText: 'Yes, Modify',
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ffc107',
          })
          if (confirmModify.isConfirmed) {
            router.push(`/events/${event.slug}/register`)
          }
        } else {
          await Swal.fire({
            icon: 'info',
            title: 'Already Registered!',
            html: `You have already registered.<br><br>${reason || ''}`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#198754',
          })
        }
        return
      }

      // Can't register
      if (!canRegister) {
        await Swal.fire({
          icon: 'info',
          title: 'Registration Not Available',
          text: reason || 'Registration is not available for this event.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd',
        })
        return
      }

      // All checks passed - navigate to registration
      router.push(`/events/${event.slug}/register`)
    } catch (err) {
      console.error('Registration check failed:', err)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to check registration status. Please try again.',
        confirmButtonColor: '#0d6efd',
      })
    } finally {
      setCheckingEventId(null)
    }
  }

  // Refresh data function for polling
  const refreshData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      if (user?.email) {
        await Promise.all([
          fetchStats(),
          fetchMyRegistrations(user.email),
        ])
      } else {
        await fetchStats()
      }
      setLastUpdated(new Date())
    } finally {
      if (showSpinner) setRefreshing(false)
    }
  }

  // Manual refresh handler
  const handleRefresh = () => {
    refreshData(true)
  }

  useEffect(() => {
    // OPTIMIZED: Run all fetches in PARALLEL instead of sequential
    const loadDashboard = async () => {
      if (user?.email) {
        // All 3 API calls run simultaneously
        await Promise.all([
          fetchStats(),
          fetchMyRegistrations(user.email),
          fetchUpcomingEvents(),
        ])
      } else {
        await fetchStats()
      }
    }
    loadDashboard()

    // Set up polling to refresh data every 30 seconds
    // This makes the dashboard reactive to admin changes
    const pollInterval = setInterval(() => {
      refreshData()
    }, 30000) // 30 seconds

    // Cleanup on unmount
    return () => clearInterval(pollInterval)
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyRegistrations = async (email: string) => {
    try {
      // Use API endpoint instead of direct Supabase query
      const response = await fetch(`/api/user/registrations?email=${encodeURIComponent(email)}`)
      const result = await response.json()

      if (result.success && result.data) {
        setMyEvents(result.data || [])
      } else {
        console.error('Error fetching registrations:', result.error)
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
    }
  }

  const fetchUpcomingEvents = async () => {
    try {
      // Use API endpoint for events
      const response = await fetch('/api/events?type=upcoming&limit=6')
      const result = await response.json()

      if (result.success && result.data) {
        // Filter only events with registration enabled
        const registrationEnabled = result.data.filter((e: Event) => e.registration_enabled)
        setUpcomingEvents(registrationEnabled)
      } else {
        console.error('Error fetching events:', result.error)
      }
    } catch (err) {
      console.error('Error fetching upcoming events:', err)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isEventPast = (dateStr: string | null) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  const isRegistrationOpen = (event: Event) => {
    if (!event.registration_enabled) return false
    if (!event.registration_deadline) return true
    return new Date(event.registration_deadline) > new Date()
  }

  return (
    <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
      <div className="container-fluid">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h2 className="mb-2">Welcome to Your Dashboard</h2>
                <p className="text-muted mb-0">
                  Manage your applications, track your submission status, and update your profile
                </p>
                <small className="text-muted">
                  Last updated: {lastUpdated.toLocaleTimeString()} (auto-refreshes every 30s)
                </small>
              </div>
              <button
                onClick={handleRefresh}
                className="btn btn-outline-primary btn-sm"
                disabled={refreshing || loading}
                title="Refresh data"
              >
                {refreshing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <i className="icofont-refresh me-1"></i>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading statistics...</p>
          </div>
        ) : (
          <>
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="card stat-card border-primary">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="stat-label">Active Applications</span>
                    <span style={{ fontSize: '2rem' }}>📋</span>
                  </div>
                  <div className="stat-value text-primary">{stats?.activeApplications || 0}</div>
                  <p className="text-muted small mb-0 mt-2">
                    In progress (pending, shortlisted, waitlisted)
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card stat-card border-success">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="stat-label">Accepted</span>
                    <span style={{ fontSize: '2rem' }}>✅</span>
                  </div>
                  <div className="stat-value text-success">{stats?.acceptedApplications || 0}</div>
                  <p className="text-muted small mb-0 mt-2">
                    Approved and confirmed
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
                  <div className="stat-value text-danger">{stats?.rejectedApplications || 0}</div>
                  <p className="text-muted small mb-0 mt-2">
                    Not accepted
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card stat-card border-warning">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="stat-label">Waitlisted</span>
                    <span style={{ fontSize: '2rem' }}>⏰</span>
                  </div>
                  <div className="stat-value text-warning">{stats?.waitlistedApplications || 0}</div>
                  <p className="text-muted small mb-0 mt-2">
                    On waiting list
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row - Profile Completeness */}
          <div className="row g-4 mb-4">
            <div className="col-md-12">
              <div className="card stat-card border-info">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <span style={{ fontSize: '3rem', marginRight: '1rem' }}>👤</span>
                      <div>
                        <span className="stat-label d-block">Profile Completeness</span>
                        <div className="stat-value text-info d-inline-block me-3">{stats?.profileCompleteness || 0}%</div>
                        {(stats?.profileCompleteness || 0) < 100 && (
                          <Link href="/dashboard/profile" className="btn btn-sm btn-info text-white">
                            <i className="icofont-ui-edit me-1"></i>
                            Complete Profile
                          </Link>
                        )}
                      </div>
                    </div>
                    <p className="text-muted small mb-0">
                      {(stats?.profileCompleteness || 0) >= 100
                        ? 'Your profile is complete!'
                        : 'Complete your profile to improve your application'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Quick Actions - Moved up for better visibility */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-primary">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="icofont-lightning-ray me-2"></i>
                  Quick Actions
                </h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <Link href="/events" className="btn btn-primary w-100 py-3">
                      <i className="icofont-calendar d-block mb-2" style={{ fontSize: '2rem' }}></i>
                      <strong>Browse Events</strong>
                      <br />
                      <small>Find and register for events</small>
                    </Link>
                  </div>
                  <div className="col-md-4">
                    <Link href="/dashboard/applications" className="btn btn-success w-100 py-3">
                      <i className="icofont-file-document d-block mb-2" style={{ fontSize: '2rem' }}></i>
                      <strong>My Applications</strong>
                      <br />
                      <small>Track application status</small>
                    </Link>
                  </div>
                  <div className="col-md-4">
                    <Link href="/dashboard/profile" className="btn btn-info w-100 py-3 text-white">
                      <i className="icofont-user d-block mb-2" style={{ fontSize: '2rem' }}></i>
                      <strong>Edit Profile</strong>
                      <br />
                      <small>Update your information</small>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Registered Events */}
        {myEvents.length > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">
                      <i className="icofont-calendar me-2"></i>
                      My Registered Events
                    </h5>
                  </div>

                  <div className="row g-3 dashboard-events-row">
                    {myEvents.slice(0, 3).filter(r => r.event !== null).map((registration) => {
                      const event = registration.event!
                      const isPast = isEventPast(event.start_date)

                      return (
                        <div key={registration.event_id} className="col-md-6 col-lg-4">
                          <div className="card h-100 shadow-sm dashboard-event-card">
                            {event.featured_image && (
                              <img
                                src={event.featured_image}
                                className="card-img-top"
                                alt={event.title}
                                style={{
                                  height: '180px',
                                  objectFit: 'cover',
                                  filter: isPast ? 'grayscale(50%)' : 'none'
                                }}
                              />
                            )}
                            <div className="card-body">
                              <span className={`badge ${isPast ? 'bg-secondary' : 'bg-success'} mb-2`}>
                                {isPast ? 'Attended' : 'Registered'}
                              </span>
                              <h6 className="card-title">{event.title}</h6>
                              <p className="card-text small text-muted mb-2">
                                <i className="icofont-calendar me-1"></i>
                                {formatDate(event.start_date)}
                              </p>
                              {event.location && (
                                <p className="card-text small text-muted">
                                  <i className="icofont-location-pin me-1"></i>
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <div className="card-footer bg-transparent">
                              <div className="d-flex gap-2">
                                <Link
                                  href={`/events/${event.slug}`}
                                  className="btn btn-outline-primary btn-sm flex-grow-1"
                                >
                                  View Event
                                </Link>
                                {canModifyRegistration(registration) && (
                                  <Link
                                    href={`/events/${event.slug}/register`}
                                    className="btn btn-outline-warning btn-sm"
                                    title="Modify your registration before deadline"
                                  >
                                    <i className="icofont-edit"></i> Modify
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {myEvents.length > 3 && (
                    <div className="text-center mt-3">
                      <Link href="/dashboard/my-events" className="btn btn-link">
                        View All My Events →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events - Available for Registration (excluding already registered) */}
        {(() => {
          // Filter out events user is already registered for
          const registeredEventIds = new Set(myEvents.map(r => r.event_id))
          const availableEvents = upcomingEvents.filter(e => !registeredEventIds.has(e.id))

          if (availableEvents.length === 0) return null

          return (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">
                      <i className="icofont-paper me-2"></i>
                      Available Events
                    </h5>
                    <Link href="/events" className="btn btn-sm btn-outline-primary">
                      Browse All Events
                    </Link>
                  </div>

                  <div className="row g-3 dashboard-events-row">
                    {availableEvents.slice(0, 3).map((event) => {
                      const registrationOpen = isRegistrationOpen(event)

                      return (
                        <div key={event.id} className="col-md-6 col-lg-4">
                          <div className="card h-100 shadow-sm dashboard-event-card">
                            {event.featured_image && (
                              <img
                                src={event.featured_image}
                                className="card-img-top"
                                alt={event.title}
                                style={{ height: '180px', objectFit: 'cover' }}
                              />
                            )}
                            <div className="card-body">
                              <h6 className="card-title">{event.title}</h6>
                              <p className="card-text small text-muted mb-2">
                                <i className="icofont-calendar me-1"></i>
                                {formatDate(event.start_date)}
                              </p>
                              {event.location && (
                                <p className="card-text small text-muted mb-2">
                                  <i className="icofont-location-pin me-1"></i>
                                  {event.location}
                                </p>
                              )}
                              <div
                                className="card-text small event-description"
                                dangerouslySetInnerHTML={{
                                  __html: event.description
                                    ? (event.description.length > 100
                                        ? event.description.substring(0, 100) + '...'
                                        : event.description)
                                    : 'No description available'
                                }}
                              />
                            </div>
                            <div className="card-footer bg-transparent">
                              {registrationOpen ? (
                                <button
                                  onClick={() => handleRegisterClick(event)}
                                  className="btn btn-primary btn-sm w-100"
                                  disabled={checkingEventId === event.id}
                                >
                                  {checkingEventId === event.id ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1"></span>
                                      Checking...
                                    </>
                                  ) : (
                                    <>
                                      <i className="icofont-ui-add me-1"></i>
                                      Register Now
                                    </>
                                  )}
                                </button>
                              ) : (
                                <button className="btn btn-secondary btn-sm w-100" disabled>
                                  Registration Closed
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        })()}

      </div>
    </DashboardLayout>
  )
}
