'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

interface Stats {
  total: number
  needsUpdate: number
  alreadyUpdated: number
}

interface RegenerateResult {
  total: number
  updated: number
  failed: number
  errors?: Array<{ ticketNumber: string; error: string }>
}

interface SearchTicket {
  id: string
  ticket_number: string
  attendee_name: string
  attendee_email: string
  qr_code_data: string | null
  event: { id: string; title: string } | null
}

export default function RegenerateQRPage() {
  const supabase = createBrowserClient()

  // Bulk regeneration state
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [result, setResult] = useState<RegenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Single ticket search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchTicket[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [singleRegenerating, setSingleRegenerating] = useState<string | null>(null)
  const [singleResults, setSingleResults] = useState<Record<string, 'success' | 'error'>>({})

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/tickets/regenerate-qr')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!confirm('Are you sure you want to regenerate QR codes for ALL tickets? This cannot be undone.')) {
      return
    }

    setRegenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/tickets/regenerate-qr', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        // Refresh stats
        await fetchStats()
      } else {
        setError(data.error || 'Failed to regenerate QR codes')
      }
    } catch (err) {
      console.error('Error regenerating:', err)
      setError('Failed to regenerate QR codes')
    } finally {
      setRegenerating(false)
    }
  }

  // Search for tickets
  const handleSearch = async () => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSearchError('Enter at least 2 characters to search')
      return
    }

    setSearching(true)
    setSearchError(null)
    setSearchResults([])
    setSingleResults({})

    try {
      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select('id, ticket_number, attendee_name, attendee_email, qr_code_data, event:events(id, title)')
        .or(`ticket_number.ilike.%${query}%,attendee_name.ilike.%${query}%,attendee_email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (fetchError) throw fetchError
      // Supabase join returns event as array for type inference; normalize to single object
      const normalized = (data || []).map((t: any) => ({
        ...t,
        event: Array.isArray(t.event) ? t.event[0] || null : t.event,
      })) as SearchTicket[]
      setSearchResults(normalized)

      if (!data || data.length === 0) {
        setSearchError('No tickets found matching your search')
      }
    } catch (err) {
      console.error('Error searching tickets:', err)
      setSearchError('Failed to search tickets')
    } finally {
      setSearching(false)
    }
  }

  // Check if a ticket's QR code has the new format
  const hasNewFormat = (qrData: string | null): boolean => {
    if (!qrData) return false
    try {
      const parsed = JSON.parse(qrData)
      return parsed.type === 'INDABAX_TICKET'
    } catch {
      return false
    }
  }

  // Regenerate QR code for a single ticket
  const handleSingleRegenerate = async (ticketId: string, ticketNumber: string) => {
    if (!confirm(`Regenerate QR code for ticket ${ticketNumber}?`)) return

    setSingleRegenerating(ticketId)

    try {
      const response = await fetch(`/api/admin/tickets/regenerate-qr?ticket_id=${ticketId}`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setSingleResults(prev => ({ ...prev, [ticketId]: 'success' }))
        // Update search results to reflect the new QR data
        setSearchResults(prev => prev.map(t => {
          if (t.id === ticketId) {
            return { ...t, qr_code_data: JSON.stringify({ type: 'INDABAX_TICKET' }) }
          }
          return t
        }))
        // Refresh bulk stats
        fetchStats()
      } else {
        setSingleResults(prev => ({ ...prev, [ticketId]: 'error' }))
      }
    } catch {
      setSingleResults(prev => ({ ...prev, [ticketId]: 'error' }))
    } finally {
      setSingleRegenerating(null)
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Regenerate QR Codes</h4>
              </div>
              <div className="card-body">
                {/* Info Alert */}
                <div className="alert alert-info">
                  <h5 className="alert-heading">
                    <i className="bi bi-info-circle me-2"></i>
                    What does this do?
                  </h5>
                  <p className="mb-0">
                    This tool regenerates QR codes for existing tickets with the new scannable format:
                  </p>
                  <ul className="mb-0 mt-2">
                    <li>Adds missing <code>type: &apos;INDABAX_TICKET&apos;</code> field</li>
                    <li>QR codes will use pure black color for maximum contrast</li>
                    <li>Higher error correction level (H) for better scanning</li>
                    <li>Larger size (400px) with bigger margin (4px)</li>
                  </ul>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* SINGLE TICKET REGENERATION */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="mb-4">
                  <h5 className="border-bottom pb-2 mb-3">
                    <i className="bi bi-search me-2"></i>
                    Regenerate Single Ticket
                  </h5>

                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by ticket number, name, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    />
                    <button
                      className="btn btn-outline-primary"
                      onClick={handleSearch}
                      disabled={searching}
                    >
                      {searching ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-search"></i>
                      )}
                      <span className="ms-2">Search</span>
                    </button>
                  </div>

                  {searchError && (
                    <div className="alert alert-warning py-2">
                      <small>{searchError}</small>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Ticket #</th>
                            <th>Attendee</th>
                            <th>Event</th>
                            <th>QR Status</th>
                            <th style={{ width: '120px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map(ticket => (
                            <tr key={ticket.id}>
                              <td><code className="small">{ticket.ticket_number}</code></td>
                              <td>
                                <div className="small fw-medium">{ticket.attendee_name || 'N/A'}</div>
                                <div className="small text-muted">{ticket.attendee_email}</div>
                              </td>
                              <td className="small">{ticket.event?.title || 'N/A'}</td>
                              <td>
                                {hasNewFormat(ticket.qr_code_data) ? (
                                  <span className="badge bg-success">Up to date</span>
                                ) : (
                                  <span className="badge bg-warning text-dark">Needs update</span>
                                )}
                              </td>
                              <td>
                                {singleResults[ticket.id] === 'success' ? (
                                  <span className="badge bg-success">
                                    <i className="bi bi-check-circle me-1"></i>Done
                                  </span>
                                ) : singleResults[ticket.id] === 'error' ? (
                                  <span className="badge bg-danger">
                                    <i className="bi bi-x-circle me-1"></i>Failed
                                  </span>
                                ) : (
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleSingleRegenerate(ticket.id, ticket.ticket_number)}
                                    disabled={singleRegenerating === ticket.id}
                                  >
                                    {singleRegenerating === ticket.id ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <>
                                        <i className="bi bi-arrow-clockwise me-1"></i>
                                        Regenerate
                                      </>
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <hr />

                {/* ═══════════════════════════════════════════════ */}
                {/* BULK REGENERATION (existing) */}
                {/* ═══════════════════════════════════════════════ */}
                <h5 className="border-bottom pb-2 mb-3">
                  <i className="bi bi-collection me-2"></i>
                  Bulk Regeneration
                </h5>

                {/* Stats */}
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : stats ? (
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h2 className="mb-0">{stats.total}</h2>
                          <p className="text-muted mb-0">Total Tickets</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-warning bg-opacity-10">
                        <div className="card-body text-center">
                          <h2 className="mb-0 text-warning">{stats.needsUpdate}</h2>
                          <p className="text-muted mb-0">Need Update</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-success bg-opacity-10">
                        <div className="card-body text-center">
                          <h2 className="mb-0 text-success">{stats.alreadyUpdated}</h2>
                          <p className="text-muted mb-0">Already Updated</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Error */}
                {error && (
                  <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div className={`alert ${result.failed > 0 ? 'alert-warning' : 'alert-success'}`}>
                    <h5 className="alert-heading">
                      <i className={`bi ${result.failed > 0 ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-2`}></i>
                      Regeneration Complete
                    </h5>
                    <p>
                      <strong>Total:</strong> {result.total} tickets<br />
                      <strong>Updated:</strong> {result.updated} tickets<br />
                      {result.failed > 0 && (
                        <>
                          <strong className="text-danger">Failed:</strong> {result.failed} tickets
                        </>
                      )}
                    </p>

                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-3">
                        <strong>Errors:</strong>
                        <ul className="mb-0 mt-2">
                          {result.errors.map((err, idx) => (
                            <li key={idx}>
                              <code>{err.ticketNumber}</code>: {err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={handleRegenerate}
                    disabled={regenerating || loading || (stats?.needsUpdate === 0)}
                  >
                    {regenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Regenerate All QR Codes
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={fetchStats}
                    disabled={loading || regenerating}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh Stats
                  </button>
                </div>

                {/* Warning */}
                <div className="alert alert-warning mt-4 mb-0">
                  <strong>Important:</strong> Users will need to re-download their tickets to get the new QR codes.
                  The updated QR codes are saved in the database, but existing PDFs downloaded by users will still have the old codes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
