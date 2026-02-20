'use client'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN CHECK-IN PAGE (PHASE 8)
// ═══════════════════════════════════════════════════════════════════════════
// Check in attendees by scanning QR codes or entering ticket numbers

import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { showSuccess, showError } from '@/lib/sweetalert'
import QRScanner from '@/components/admin/QRScanner'
import TicketSearch from '@/components/admin/TicketSearch'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CheckInStats {
  total: number
  checked_in: number
  active: number
  cancelled: number
}

interface Event {
  id: string
  title: string
  start_date: string
}

interface CheckInResult {
  success: boolean
  error?: string
  message?: string
  data?: {
    ticket_number: string
    ticket_type: string
    attendee: {
      name: string
      email: string
      organization?: string
    }
    checked_in_at?: string
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminCheckInPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [stats, setStats] = useState<CheckInStats | null>(null)
  const [ticketNumber, setTicketNumber] = useState('')
  const [processing, setProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null)
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([])
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showNameSearch, setShowNameSearch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ═══════════════════════════════════════════════════════════════════════
  // Load events
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchStats()
      fetchRecentCheckIns()  // Issue #6 FIX: Load recent check-ins from database
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events')
      const result = await response.json()
      if (result.success) {
        setEvents(result.data)
        // Auto-select first upcoming event
        const upcoming = result.data.find((e: Event) =>
          new Date(e.start_date) >= new Date()
        )
        if (upcoming) {
          setSelectedEvent(upcoming.id)
        } else if (result.data.length > 0) {
          setSelectedEvent(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/tickets/checkin?event_id=${selectedEvent}`)
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  // Issue #6 FIX: Fetch recent check-ins from database on page load
  const fetchRecentCheckIns = async () => {
    if (!selectedEvent) return
    try {
      const response = await fetch(`/api/admin/checkin/attendees?event_id=${selectedEvent}`)
      const result = await response.json()
      if (result.success && result.data) {
        // Transform to match the format used by handleCheckIn success
        const recentData = result.data.slice(0, 10).map((attendee: any) => ({
          ticket_number: attendee.ticket_number,
          ticket_type: attendee.ticket_type || 'General',
          attendee: {
            name: attendee.attendee_name || attendee.user_profiles?.name || 'Unknown',
            email: attendee.attendee_email || attendee.user_profiles?.email || 'Unknown',
            organization: attendee.user_profiles?.organization || 'N/A'
          },
          checked_in_at: attendee.checked_in_at
        }))
        setRecentCheckIns(recentData)
      }
    } catch (error) {
      console.error('Failed to fetch recent check-ins:', error)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Check in handler
  // ═══════════════════════════════════════════════════════════════════════

  const handleCheckIn = async (e?: React.FormEvent, directTicket?: string) => {
    e?.preventDefault()

    // Use direct ticket if provided (from QR scan), otherwise use state
    const ticketToCheck = directTicket || ticketNumber

    if (!ticketToCheck.trim()) {
      showError('Error', 'Please enter a ticket number')
      return
    }

    setProcessing(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/tickets/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_number: ticketToCheck.trim().toUpperCase() })
      })

      const result = await response.json()
      setLastResult(result)

      if (result.success) {
        showSuccess('Check-in Successful!', `${result.data.attendee.name} is now checked in.`)
        setRecentCheckIns(prev => [result.data, ...prev.slice(0, 9)])
        fetchStats() // Refresh stats
      } else {
        if (result.error === 'ALREADY_CHECKED_IN') {
          showError('Already Checked In', result.message)
        } else {
          showError('Check-in Failed', result.message || result.error)
        }
      }
    } catch (error) {
      console.error('Check-in error:', error)
      showError('Error', 'Failed to process check-in')
    } finally {
      setProcessing(false)
      setTicketNumber('')
      inputRef.current?.focus()
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // QR Code & Name Search handlers
  // ═══════════════════════════════════════════════════════════════════════

  const handleQRScan = async (qrData: string) => {
    setShowQRScanner(false)

    // Parse QR data (assuming JSON format or plain ticket number)
    let ticketToCheckIn: string | null = null

    try {
      const parsed = JSON.parse(qrData)
      // Support both "ticket" and "ticket_number" fields (QR data uses "ticket")
      const ticketNum = parsed.ticket || parsed.ticket_number

      // Issue #1 FIX: Support both old format (without type) and new format (with type)
      // Old format: { ticket: '...', event: '...', timestamp: ... }
      // New format: { type: 'INDABAX_TICKET', ticket: '...', event: '...', timestamp: ... }
      if (ticketNum && (!parsed.type || parsed.type === 'INDABAX_TICKET')) {
        ticketToCheckIn = ticketNum
      } else {
        showError('Invalid QR Code', 'This QR code is not a valid ticket')
        return
      }
    } catch (error) {
      // Not JSON, try as plain ticket number
      ticketToCheckIn = qrData
    }

    if (ticketToCheckIn) {
      setTicketNumber(ticketToCheckIn)  // Update UI
      // Directly call check-in with the ticket (don't rely on state)
      handleCheckIn(undefined, ticketToCheckIn)
    }
  }

  const handleNameSearchSelect = (ticketNumber: string) => {
    setTicketNumber(ticketNumber)
    setShowNameSearch(false)
    inputRef.current?.focus()
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-8">
            <h2>
              <i className="icofont-qr-code me-2"></i>
              Event Check-In
            </h2>
            <p className="text-muted">Scan QR codes or enter ticket numbers to check in attendees</p>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">Select Event...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{stats.total}</h3>
                  <small>Total Tickets</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{stats.checked_in}</h3>
                  <small>Checked In</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-dark">
                <div className="card-body text-center">
                  <h3 className="mb-0">{stats.active}</h3>
                  <small>Pending</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0}%
                  </h3>
                  <small>Attendance Rate</small>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          {/* Check-in Form */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="icofont-barcode me-2"></i>
                  Check In Attendee
                </h5>
              </div>
              <div className="card-body">
                {/* Toggle Method Buttons */}
                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    className={`btn ${!showQRScanner && !showNameSearch ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => { setShowQRScanner(false); setShowNameSearch(false); }}
                  >
                    <i className="icofont-barcode me-1"></i> Manual Entry
                  </button>
                  <button
                    className={`btn ${showQRScanner ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => { setShowQRScanner(true); setShowNameSearch(false); }}
                  >
                    <i className="icofont-qr-code me-1"></i> QR Scanner
                  </button>
                  <button
                    className={`btn ${showNameSearch ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => { setShowNameSearch(true); setShowQRScanner(false); }}
                  >
                    <i className="icofont-search-user me-1"></i> Name Search
                  </button>
                </div>

                {/* QR Scanner */}
                {showQRScanner && (
                  <QRScanner
                    onScan={handleQRScan}
                    onError={(error) => showError('Scan Error', error instanceof Error ? error.message : 'Unknown error')}
                  />
                )}

                {/* Name Search */}
                {showNameSearch && (
                  <TicketSearch
                    eventId={selectedEvent}
                    onSelectTicket={handleNameSearchSelect}
                  />
                )}

                {/* Manual Ticket Entry */}
                {!showQRScanner && !showNameSearch && (
                  <form onSubmit={handleCheckIn}>
                    <div className="mb-3">
                      <label className="form-label">Ticket Number</label>
                      <input
                        ref={inputRef}
                        type="text"
                        className="form-control form-control-lg text-center font-monospace"
                        placeholder="e.g., EVT-2025-44732"
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                        disabled={processing}
                        autoFocus
                      />
                      <small className="text-muted">
                        Enter the full ticket number exactly as shown on the ticket
                      </small>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-success btn-lg w-100"
                      disabled={processing || !ticketNumber.trim()}
                    >
                      {processing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="icofont-check-circled me-2"></i>
                          Check In
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Last Result */}
                {lastResult && (
                  <div className={`alert mt-4 ${lastResult.success ? 'alert-success' : 'alert-danger'}`}>
                    {lastResult.success ? (
                      <div>
                        <h5 className="alert-heading">
                          <i className="icofont-check-circled me-2"></i>
                          Check-in Successful!
                        </h5>
                        <hr />
                        <p className="mb-1"><strong>Name:</strong> {lastResult.data?.attendee.name}</p>
                        <p className="mb-1"><strong>Ticket:</strong> {lastResult.data?.ticket_number}</p>
                        <p className="mb-0"><strong>Type:</strong> {lastResult.data?.ticket_type}</p>
                      </div>
                    ) : (
                      <div>
                        <h5 className="alert-heading">
                          <i className="icofont-warning me-2"></i>
                          Check-in Failed
                        </h5>
                        <p className="mb-0">{lastResult.message || lastResult.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Check-ins */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="icofont-clock-time me-2"></i>
                  Recent Check-ins
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {recentCheckIns.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="icofont-users" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                    <p className="mt-2">No check-ins yet</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {recentCheckIns.map((checkin, index) => (
                      <div key={index} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{checkin.attendee.name}</h6>
                            <small className="text-muted">
                              {checkin.ticket_number} | {checkin.ticket_type}
                            </small>
                          </div>
                          <small className="text-success">
                            {new Date(checkin.checked_in_at).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
