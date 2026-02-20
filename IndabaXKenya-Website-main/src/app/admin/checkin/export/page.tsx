'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CHECK-IN REPORTS & EXPORT
// ═══════════════════════════════════════════════════════════════════════
// View and export checked-in attendees per event

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

interface Event {
  id: string
  title: string
  start_date: string
}

interface CheckedInAttendee {
  id: string
  ticket_number: string
  attendee_name: string
  attendee_email: string
  ticket_type: string
  checked_in_at: string
  checked_in_by?: string
  user_profiles?: {
    name: string
    email: string
    organization?: string
  }
}

export default function CheckInReportsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [attendees, setAttendees] = useState<CheckedInAttendee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchCheckedInAttendees()
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events')
      const result = await response.json()
      if (result.success) {
        setEvents(result.data)
        if (result.data.length > 0) {
          const upcoming = result.data.find((e: Event) =>
            new Date(e.start_date) >= new Date()
          )
          setSelectedEvent(upcoming?.id || result.data[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch events:', err)
      setError('Failed to load events')
    }
  }

  const fetchCheckedInAttendees = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/checkin/attendees?event_id=${selectedEvent}`)
      const result = await response.json()

      if (result.success) {
        setAttendees(result.data)
      } else {
        setError(result.error || 'Failed to load attendees')
      }
    } catch (err) {
      console.error('Failed to fetch attendees:', err)
      setError('Failed to load checked-in attendees')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (attendees.length === 0) return

    const headers = ['Ticket Number', 'Name', 'Email', 'Organization', 'Ticket Type', 'Checked In At']
    const rows = attendees.map(a => [
      a.ticket_number,
      a.attendee_name || a.user_profiles?.name || 'N/A',
      a.attendee_email || a.user_profiles?.email || 'N/A',
      a.user_profiles?.organization || 'N/A',
      a.ticket_type || 'General',
      new Date(a.checked_in_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const eventName = events.find(e => e.id === selectedEvent)?.title || 'Event'
    a.download = `${eventName.replace(/\s+/g, '-')}-Checked-In-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const selectedEventData = events.find(e => e.id === selectedEvent)

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              <i className="icofont-listing-number me-2"></i>
              Check-In Reports
            </h2>
            <p className="text-muted mb-0">View and export checked-in attendees</p>
          </div>
          {attendees.length > 0 && (
            <button className="btn btn-success" onClick={exportToCSV}>
              <i className="icofont-download me-2"></i>
              Export to CSV ({attendees.length})
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger">
            <i className="icofont-warning me-2"></i>
            {error}
          </div>
        )}

        {/* Event Selector */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-6">
                <label className="form-label">Select Event</label>
                <select
                  className="form-select"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="">Choose an event...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} ({new Date(event.start_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                {selectedEventData && (
                  <div className="alert alert-info mb-0">
                    <strong>Total Checked In:</strong> {attendees.length} attendees
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attendees List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : attendees.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="icofont-users" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
              <p className="text-muted mt-3 mb-0">
                {selectedEvent ? 'No attendees have checked in yet' : 'Select an event to view attendees'}
              </p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ticket Number</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Organization</th>
                      <th>Type</th>
                      <th>Checked In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((attendee, index) => (
                      <tr key={attendee.id}>
                        <td>{index + 1}</td>
                        <td>
                          <code className="text-primary">{attendee.ticket_number}</code>
                        </td>
                        <td>
                          <strong>{attendee.attendee_name || attendee.user_profiles?.name || 'N/A'}</strong>
                        </td>
                        <td>{attendee.user_profiles?.email || attendee.attendee_email || 'N/A'}</td>
                        <td>{attendee.user_profiles?.organization || 'N/A'}</td>
                        <td>
                          <span className="badge bg-info">{attendee.ticket_type || 'General'}</span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(attendee.checked_in_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
