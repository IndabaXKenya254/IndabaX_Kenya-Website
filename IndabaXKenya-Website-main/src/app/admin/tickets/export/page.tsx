'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - BULK TICKET EXPORT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Export multiple tickets as PDF (individual or ZIP)
// Phase 8: Ticketing System

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { pdf } from '@react-pdf/renderer'
import { TicketPDF, TicketData } from '@/components/tickets/TicketPDF'
import JSZip from 'jszip'
import QRCode from 'qrcode'

interface Event {
  id: string
  title: string
  slug: string
}

interface TicketExportData {
  ticketNumber: string
  ticketType: string
  status: string
  qrCode: string
  attendee: {
    name: string
    email: string
    organization: string
  }
  event: {
    title: string
    date: string
    time: string
    location: string
    venue: string
  }
}

interface ExportStats {
  total: number
  valid: number
  used: number
  cancelled: number
  byType: Record<string, number>
}

export default function BulkTicketExportPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('valid')
  const [stats, setStats] = useState<ExportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const supabase = createBrowserClient()

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('id, title, slug')
          .order('start_date', { ascending: false })

        if (fetchError) throw fetchError
        setEvents(data || [])

        // Select first event by default
        if (data && data.length > 0) {
          setSelectedEventId(data[0].id)
        }
      } catch (err) {
        console.error('Error fetching events:', err)
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Fetch stats when event changes
  useEffect(() => {
    async function fetchStats() {
      if (!selectedEventId) return

      try {
        const response = await fetch(`/api/tickets/export?event_id=${selectedEventId}`)
        const result = await response.json()

        if (result.success) {
          setStats(result.data)
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }

    fetchStats()
  }, [selectedEventId])

  // Generate QR code data URL
  const generateQRCodeDataUrl = async (data: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#006700',
          light: '#FFFFFF',
        },
      })
    } catch (err) {
      console.error('QR code generation error:', err)
      return ''
    }
  }

  // Export tickets
  const handleExport = async () => {
    if (!selectedEventId) {
      setError('Please select an event')
      return
    }

    setExporting(true)
    setExportProgress(0)
    setError(null)

    try {
      // Fetch tickets data
      const response = await fetch('/api/tickets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEventId,
          status_filter: statusFilter,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch tickets')
      }

      const tickets: TicketExportData[] = result.data

      if (tickets.length === 0) {
        setError('No tickets found to export')
        return
      }

      // Create ZIP file
      const zip = new JSZip()
      const ticketsFolder = zip.folder('tickets')

      if (!ticketsFolder) {
        throw new Error('Failed to create ZIP folder')
      }

      // Generate PDFs for each ticket
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i]
        setExportProgress(Math.round(((i + 1) / tickets.length) * 100))

        // Generate QR code
        const qrDataUrl = ticket.qrCode
          ? await generateQRCodeDataUrl(ticket.qrCode)
          : await generateQRCodeDataUrl(ticket.ticketNumber)

        // Create ticket data for PDF
        const ticketData: TicketData = {
          ticketNumber: ticket.ticketNumber,
          qrCodeDataUrl: qrDataUrl,
          attendee: {
            name: ticket.attendee.name,
            email: ticket.attendee.email,
            organization: ticket.attendee.organization || undefined,
          },
          event: {
            title: ticket.event.title,
            date: ticket.event.date,
            time: ticket.event.time || undefined,
            location: ticket.event.location,
            venue: ticket.event.venue || undefined,
          },
          ticketType: ticket.ticketType,
        }

        // Generate PDF
        const pdfBlob = await pdf(<TicketPDF data={ticketData} />).toBlob()

        // Add to ZIP
        const fileName = `ticket_${ticket.ticketNumber}_${ticket.attendee.name.replace(/\s+/g, '_')}.pdf`
        ticketsFolder.file(fileName, pdfBlob)
      }

      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      const eventSlug = events.find(e => e.id === selectedEventId)?.slug || 'tickets'
      link.download = `${eventSlug}_tickets_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccessMessage(`Successfully exported ${tickets.length} tickets`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'Failed to export tickets')
    } finally {
      setExporting(false)
      setExportProgress(0)
    }
  }

  // Export count based on filter
  const exportCount = useMemo(() => {
    if (!stats) return 0
    if (statusFilter === 'all') return stats.total
    if (statusFilter === 'valid') return stats.valid
    if (statusFilter === 'used') return stats.used
    if (statusFilter === 'cancelled') return stats.cancelled
    return stats.total
  }, [stats, statusFilter])

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="icofont-check-circled me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="icofont-warning me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            <i className="icofont-download me-2"></i>
            Bulk Ticket Export
          </h1>
          <p className="text-muted mb-0">Export multiple tickets as PDF files in a ZIP archive</p>
        </div>
        <Link href="/admin/tickets" className="btn btn-outline-secondary">
          <i className="icofont-arrow-left me-2"></i>
          Back to Tickets
        </Link>
      </div>

      <div className="row">
        {/* Export Options */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="icofont-settings me-2"></i>
                Export Options
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Select Event</label>
                <select
                  className="form-select"
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                >
                  <option value="">Choose an event...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label">Ticket Status Filter</label>
                <div className="btn-group w-100" role="group">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'valid', label: 'Valid' },
                    { value: 'used', label: 'Used' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ].map(option => (
                    <React.Fragment key={option.value}>
                      <input
                        type="radio"
                        className="btn-check"
                        name="statusFilter"
                        id={`status-${option.value}`}
                        checked={statusFilter === option.value}
                        onChange={() => setStatusFilter(option.value)}
                      />
                      <label
                        className="btn btn-outline-primary"
                        htmlFor={`status-${option.value}`}
                      >
                        {option.label}
                      </label>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Export Progress */}
              {exporting && (
                <div className="mb-4">
                  <label className="form-label">Export Progress</label>
                  <div className="progress" style={{ height: '25px' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      style={{ width: `${exportProgress}%` }}
                    >
                      {exportProgress}%
                    </div>
                  </div>
                  <small className="text-muted mt-1 d-block">
                    Generating PDFs and creating ZIP archive...
                  </small>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg w-100"
                onClick={handleExport}
                disabled={!selectedEventId || exporting || exportCount === 0}
              >
                {exporting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="icofont-download me-2"></i>
                    Export {exportCount} Tickets as ZIP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="icofont-chart-bar-graph me-2"></i>
                Ticket Statistics
              </h5>
            </div>
            <div className="card-body">
              {stats ? (
                <>
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <div className="text-center p-3 bg-light rounded">
                        <h3 className="mb-0">{stats.total}</h3>
                        <small className="text-muted">Total Tickets</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-success text-white rounded">
                        <h3 className="mb-0">{stats.valid}</h3>
                        <small>Valid</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-info text-white rounded">
                        <h3 className="mb-0">{stats.used}</h3>
                        <small>Used (Checked In)</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-danger text-white rounded">
                        <h3 className="mb-0">{stats.cancelled}</h3>
                        <small>Cancelled</small>
                      </div>
                    </div>
                  </div>

                  {Object.keys(stats.byType).length > 0 && (
                    <>
                      <h6 className="mb-3">By Ticket Type</h6>
                      <div className="list-group">
                        {Object.entries(stats.byType).map(([type, count]) => (
                          <div
                            key={type}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <span>{type}</span>
                            <span className="badge bg-primary">{count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="icofont-ticket d-block mb-2" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  <p>Select an event to view ticket statistics</p>
                </div>
              )}
            </div>
          </div>

          {/* Export Info */}
          <div className="card mt-4">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="icofont-info-circle me-2"></i>
                Export Information
              </h6>
            </div>
            <div className="card-body">
              <ul className="mb-0 small text-muted">
                <li className="mb-2">
                  Each ticket is exported as an individual PDF file
                </li>
                <li className="mb-2">
                  All PDFs are bundled into a single ZIP archive for easy download
                </li>
                <li className="mb-2">
                  PDFs include QR codes for check-in scanning
                </li>
                <li className="mb-2">
                  File naming format: ticket_[NUMBER]_[NAME].pdf
                </li>
                <li>
                  Large exports may take a few minutes to generate
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
