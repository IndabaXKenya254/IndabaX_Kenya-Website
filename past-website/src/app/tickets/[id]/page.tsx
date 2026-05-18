'use client'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET VIEW/DOWNLOAD PAGE (PHASE 8)
// ═══════════════════════════════════════════════════════════════════════════
// View and download ticket PDF

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Layouts/Navbar'
import Footer from '@/components/Layouts/Footer'

// Dynamic import for PDF (client-side only)
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span>Loading PDF...</span> }
)

const TicketPDF = dynamic(
  () => import('@/components/tickets/TicketPDF').then(mod => mod.TicketPDF),
  { ssr: false }
)

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TicketData {
  id: string
  ticketNumber: string
  ticketType: string
  status: string
  qrCodeDataUrl: string
  attendee: {
    name: string
    email: string
    organization?: string
  }
  event: {
    id: string
    title: string
    date: string
    time?: string
    location: string
    venue?: string
  }
  generatedAt: string
  checkedInAt?: string
  downloadCount: number
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TicketPage() {
  const params = useParams()
  const ticketId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticket, setTicket] = useState<TicketData | null>(null)

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  const fetchTicket = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tickets/${ticketId}?download=true`)
      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to load ticket')
        return
      }

      setTicket(result.data)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Loading
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4>Loading Ticket...</h4>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Error
  // ═══════════════════════════════════════════════════════════════════════

  if (error || !ticket) {
    return (
      <>
        <Navbar />
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-danger">
                <div className="card-body text-center py-5">
                  <i className="icofont-warning text-danger" style={{ fontSize: '4rem' }}></i>
                  <h3 className="mt-3">Ticket Not Found</h3>
                  <p className="text-muted">{error}</p>
                  <a href="/dashboard" className="btn btn-primary mt-3">
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Ticket
  // ═══════════════════════════════════════════════════════════════════════

  const pdfData = {
    ticketNumber: ticket.ticketNumber,
    qrCodeDataUrl: ticket.qrCodeDataUrl,
    attendee: ticket.attendee,
    event: ticket.event,
    ticketType: ticket.ticketType
  }

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Ticket Card */}
            <div className="card shadow-lg border-0 overflow-hidden">
              {/* Header */}
              <div className="card-header bg-success text-white py-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-1">IndabaX Kenya</h2>
                    <p className="mb-0 opacity-75">{ticket.event.title}</p>
                  </div>
                  <span className="badge bg-white text-success fs-6">
                    {ticket.ticketType.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="card-body p-4">
                <div className="row">
                  {/* Left - Attendee Info */}
                  <div className="col-md-7">
                    {/* Attendee */}
                    <div className="mb-4">
                      <small className="text-muted text-uppercase">Attendee</small>
                      <h3 className="text-success mb-1">{ticket.attendee.name}</h3>
                      <p className="text-muted mb-0">{ticket.attendee.email}</p>
                      {ticket.attendee.organization && (
                        <p className="text-muted mb-0">{ticket.attendee.organization}</p>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="row mb-4">
                      <div className="col-6">
                        <small className="text-muted text-uppercase">Date</small>
                        <p className="fw-bold mb-0">{ticket.event.date}</p>
                        {ticket.event.time && (
                          <small className="text-muted">{ticket.event.time}</small>
                        )}
                      </div>
                      <div className="col-6">
                        <small className="text-muted text-uppercase">Venue</small>
                        <p className="fw-bold mb-0">{ticket.event.venue || ticket.event.location}</p>
                        {ticket.event.venue && (
                          <small className="text-muted">{ticket.event.location}</small>
                        )}
                      </div>
                    </div>

                    {/* Ticket Number */}
                    <div className="mb-3">
                      <small className="text-muted text-uppercase">Ticket Number</small>
                      <p className="fw-bold mb-0 font-monospace fs-5">{ticket.ticketNumber}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <small className="text-muted text-uppercase">Status</small>
                      <p className="mb-0">
                        {ticket.status === 'active' && (
                          <span className="badge bg-success fs-6">Valid</span>
                        )}
                        {ticket.status === 'checked_in' && (
                          <span className="badge bg-info fs-6">Checked In</span>
                        )}
                        {ticket.status === 'cancelled' && (
                          <span className="badge bg-danger fs-6">Cancelled</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right - QR Code */}
                  <div className="col-md-5 text-center border-start">
                    <div className="py-3">
                      <img
                        src={ticket.qrCodeDataUrl}
                        alt="Ticket QR Code"
                        className="img-fluid mb-3"
                        style={{ maxWidth: '200px' }}
                      />
                      <p className="small text-muted mb-0">
                        Scan at entry for check-in
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="card-footer bg-light py-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <small className="text-muted">
                    Generated: {new Date(ticket.generatedAt).toLocaleDateString()}
                    {ticket.downloadCount > 0 && ` | Downloaded ${ticket.downloadCount} time(s)`}
                  </small>
                  <PDFDownloadLink
                    document={<TicketPDF data={pdfData} />}
                    fileName={`IndabaX-Ticket-${ticket.ticketNumber}.pdf`}
                    className="btn btn-success"
                  >
                    {({ loading: pdfLoading }) =>
                      pdfLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Preparing PDF...
                        </>
                      ) : (
                        <>
                          <i className="icofont-download me-2"></i>
                          Download PDF
                        </>
                      )
                    }
                  </PDFDownloadLink>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="card mt-4 border-warning">
              <div className="card-body">
                <h5 className="card-title text-warning">
                  <i className="icofont-info-circle me-2"></i>
                  Important Instructions
                </h5>
                <ul className="mb-0">
                  <li>Please bring this ticket (printed or on your phone) to the event.</li>
                  <li>Present the QR code at the registration desk for check-in.</li>
                  <li>This ticket is non-transferable and valid for one person only.</li>
                  <li>For any queries, contact: <a href="mailto:accounts@deeplearningindabaxkenya.com">accounts@deeplearningindabaxkenya.com</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
