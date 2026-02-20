'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Main dashboard component with event discovery and registration history
// Phase 2: Authentication Extension

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  name: string
  organization: string | null
  phone: string | null
  role: string
  created_at: string
}

interface Event {
  id: string
  title: string
  slug: string
  start_date: string
  end_date: string
  location: string
  featured_image: string | null
  event_type: string
  status: string
}

interface Registration {
  id: string
  event_id: string
  response_type: string
  status: string
  completed_at: string
  created_at: string
  events: Event
}

export default function UserDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [availableEvents, setAvailableEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile
      const profileRes = await fetch('/api/user/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData.data)
      }

      // Fetch user registrations
      const regRes = await fetch('/api/user/registrations')
      if (regRes.ok) {
        const regData = await regRes.json()
        setRegistrations(regData.data || [])
      }

      // Fetch available events
      const eventsRes = await fetch('/api/events?status=published')
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setAvailableEvents(eventsData.data || [])
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="ptb-120 bg-light">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-area ptb-120 bg-light">
      <div className="container">
        {/* Welcome Section */}
        <div className="row mb-5">
          <div className="col-lg-12">
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-2">Welcome back, {profile?.name || user?.email}!</h2>
                    <p className="text-muted mb-0">
                      {profile?.organization && `${profile.organization} • `}
                      Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                  <Link href="/dashboard/profile" className="btn btn-outline-primary">
                    <i className="icofont-ui-edit"></i> Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-5">
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <div className="display-4 text-primary mb-2">
                  <i className="icofont-ticket"></i>
                </div>
                <h3 className="h4">{registrations.length}</h3>
                <p className="text-muted mb-0">Event Registrations</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <div className="display-4 text-success mb-2">
                  <i className="icofont-check-circled"></i>
                </div>
                <h3 className="h4">
                  {registrations.filter(r => r.status === 'approved').length}
                </h3>
                <p className="text-muted mb-0">Approved</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <div className="display-4 text-warning mb-2">
                  <i className="icofont-clock-time"></i>
                </div>
                <h3 className="h4">
                  {registrations.filter(r => r.status === 'pending' || r.status === 'interested').length}
                </h3>
                <p className="text-muted mb-0">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Registrations */}
        <div className="row mb-5">
          <div className="col-lg-12">
            <div className="section-title mb-4">
              <h3>My Event Registrations</h3>
              <div className="bar"></div>
            </div>

            {registrations.length === 0 ? (
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="mb-3">
                    <i className="icofont-ticket display-1 text-muted"></i>
                  </div>
                  <h4>No Registrations Yet</h4>
                  <p className="text-muted">
                    You have not registered for any events. Browse available events below!
                  </p>
                </div>
              </div>
            ) : (
              <div className="row">
                {registrations.map((registration) => (
                  <div key={registration.id} className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title mb-0">{registration.events.title}</h5>
                          <span className={`badge ${
                            registration.status === 'approved' ? 'bg-success' :
                            registration.status === 'rejected' ? 'bg-danger' :
                            registration.status === 'shortlisted' ? 'bg-info' :
                            'bg-warning'
                          }`}>
                            {registration.status}
                          </span>
                        </div>
                        <p className="card-text text-muted mb-2">
                          <i className="icofont-location-pin"></i> {registration.events.location}
                        </p>
                        <p className="card-text text-muted mb-3">
                          <i className="icofont-calendar"></i>{' '}
                          {new Date(registration.events.start_date).toLocaleDateString()} - {new Date(registration.events.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-muted small mb-0">
                          Registered: {new Date(registration.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Events */}
        <div className="row">
          <div className="col-lg-12">
            <div className="section-title mb-4">
              <h3>Available Events</h3>
              <div className="bar"></div>
              <p className="text-muted">Register for upcoming conferences and workshops</p>
            </div>

            {availableEvents.length === 0 ? (
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="mb-3">
                    <i className="icofont-calendar display-1 text-muted"></i>
                  </div>
                  <h4>No Events Available</h4>
                  <p className="text-muted">
                    Check back later for upcoming events!
                  </p>
                </div>
              </div>
            ) : (
              <div className="row">
                {availableEvents.map((event) => {
                  const alreadyRegistered = registrations.some(r => r.events.id === event.id)

                  return (
                    <div key={event.id} className="col-md-6 col-lg-4 mb-4">
                      <div className="card shadow-sm h-100">
                        {event.featured_image && (
                          <img
                            src={event.featured_image}
                            alt={event.title}
                            className="card-img-top"
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                        )}
                        <div className="card-body">
                          <h5 className="card-title">{event.title}</h5>
                          <p className="card-text text-muted mb-2">
                            <i className="icofont-location-pin"></i> {event.location}
                          </p>
                          <p className="card-text text-muted mb-3">
                            <i className="icofont-calendar"></i>{' '}
                            {new Date(event.start_date).toLocaleDateString()}
                          </p>
                          {alreadyRegistered ? (
                            <button className="btn btn-secondary w-100" disabled>
                              <i className="icofont-check"></i> Already Registered
                            </button>
                          ) : (
                            <Link
                              href={`/events/${event.slug}`}
                              className="btn btn-primary w-100"
                            >
                              <i className="icofont-ticket"></i> View Details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
