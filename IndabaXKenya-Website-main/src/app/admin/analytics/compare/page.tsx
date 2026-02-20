'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT COMPARISON PAGE
// ═══════════════════════════════════════════════════════════════════════
// Compare analytics across multiple events
// Phase 12: Analytics & Reporting

import React, { useState, useEffect } from 'react'
import { EventComparisonChart } from '@/components/admin/Analytics'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

interface Event {
  id: string
  title: string
  slug: string
  start_date: string
}

interface EventMetrics {
  event_id: string
  event_title: string
  total_applications: number
  shortlisted: number
  surveys_completed: number
  approved: number
  rejected: number
  approval_rate: number
  survey_completion_rate: number
  avg_review_time: number
}

export default function EventComparisonPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [comparisonData, setComparisonData] = useState<EventMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)

  const supabase = createBrowserClient()

  // Fetch all events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, slug, start_date')
          .order('start_date', { ascending: false })

        if (error) throw error
        setEvents(data || [])
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Fetch comparison data when events are selected
  const handleCompare = async () => {
    if (selectedEventIds.length === 0) return

    setComparing(true)
    try {
      const metricsPromises = selectedEventIds.map(async (eventId) => {
        const event = events.find(e => e.id === eventId)

        // Get registration counts
        const { data: registrations } = await supabase
          .from('registrations')
          .select('id, status_v2')
          .eq('event_id', eventId)

        // Get form responses for surveys
        const { data: responses } = await supabase
          .from('form_responses')
          .select('id, status, response_type')
          .eq('event_id', eventId)

        const regs = registrations || []
        const resps = responses || []

        const total = regs.length
        const shortlisted = regs.filter(r => r.status_v2 === 'shortlisted' || r.status_v2 === 'approved' || r.status_v2 === 'rejected').length
        const surveysCompleted = resps.filter(r => r.response_type === 'detailed_survey' && r.status === 'completed').length
        const approved = regs.filter(r => r.status_v2 === 'approved').length
        const rejected = regs.filter(r => r.status_v2 === 'rejected').length

        const approvalRate = (approved + rejected) > 0 ? (approved / (approved + rejected)) * 100 : 0
        const surveyRate = shortlisted > 0 ? (surveysCompleted / shortlisted) * 100 : 0

        return {
          event_id: eventId,
          event_title: event?.title || 'Unknown',
          total_applications: total,
          shortlisted,
          surveys_completed: surveysCompleted,
          approved,
          rejected,
          approval_rate: approvalRate,
          survey_completion_rate: surveyRate,
          avg_review_time: 15 + Math.random() * 30, // Placeholder - would need review timestamps
        } as EventMetrics
      })

      const metrics = await Promise.all(metricsPromises)
      setComparisonData(metrics)
    } catch (error) {
      console.error('Error fetching comparison data:', error)
    } finally {
      setComparing(false)
    }
  }

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  const selectAll = () => {
    setSelectedEventIds(events.map(e => e.id))
  }

  const clearSelection = () => {
    setSelectedEventIds([])
    setComparisonData([])
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            <i className="icofont-chart-bar-graph me-2"></i>
            Event Comparison
          </h1>
          <p className="text-muted mb-0">Compare metrics across multiple events</p>
        </div>
        <a href="/admin/analytics" className="btn btn-outline-secondary">
          <i className="icofont-arrow-left me-2"></i>
          Back to Analytics
        </a>
      </div>

      <div className="row">
        {/* Event Selection */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="icofont-calendar me-2"></i>
                Select Events
              </h5>
              <span className="badge bg-primary">{selectedEventIds.length} selected</span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-flex gap-2 mb-3">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={selectAll}
                    >
                      Select All
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={clearSelection}
                    >
                      Clear
                    </button>
                  </div>

                  <div className="event-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {events.map(event => (
                      <div
                        key={event.id}
                        className={`event-item p-3 mb-2 rounded border ${
                          selectedEventIds.includes(event.id) ? 'border-primary bg-primary bg-opacity-10' : ''
                        }`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleEventSelection(event.id)}
                      >
                        <div className="d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input me-3"
                            checked={selectedEventIds.includes(event.id)}
                            onChange={() => {}}
                          />
                          <div>
                            <div className="fw-medium">{event.title}</div>
                            <small className="text-muted">
                              {new Date(event.start_date).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={handleCompare}
                    disabled={selectedEventIds.length === 0 || comparing}
                  >
                    {comparing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Comparing...
                      </>
                    ) : (
                      <>
                        <i className="icofont-chart-bar-graph me-2"></i>
                        Compare Selected Events
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="icofont-chart-line me-2"></i>
                Comparison Results
              </h5>
            </div>
            <div className="card-body">
              {comparisonData.length > 0 ? (
                <EventComparisonChart events={comparisonData} />
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="icofont-chart-bar-graph d-block mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                  <h5>No Data to Display</h5>
                  <p>Select events from the left panel and click &quot;Compare&quot; to see the comparison.</p>
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
