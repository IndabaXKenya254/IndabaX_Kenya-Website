'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAPER ASSIGNMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════
// Assign papers to reviewers for blind review
// Features:
//   - View all papers and their assignment status
//   - Assign specific papers to reviewers
//   - Random bulk assignment (10 or 20 papers)
//   - View assignments by reviewer

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { showSuccess, showError, showLoading, closeAlert } from '@/lib/sweetalert'

interface Paper {
  id: string
  title: string
  abstract: string
  status: string
  submitted_at: string
  user_profiles: { id: string; name: string; email: string } | null
}

interface Assignment {
  id: string
  paper_id: string
  reviewer_id: string
  event_id: string
  review_status: string
  assigned_at: string
  papers: Paper | null
  reviewer: { id: string; name: string; email: string } | null
}

interface Reviewer {
  id: string
  name: string
  email: string
  role: string
}

interface Event {
  id: string
  title: string
  paper_review_mode: string
}

export default function PaperAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [unassignedPapers, setUnassignedPapers] = useState<Paper[]>([])
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [selectedReviewer, setSelectedReviewer] = useState<string>('')
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set())
  const [showAssignModal, setShowAssignModal] = useState(false)

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchAssignments()
      fetchUnassignedPapers()
    }
  }, [selectedEvent])

  async function fetchData() {
    try {
      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, paper_review_mode')
        .order('start_date', { ascending: false })

      setEvents(eventsData || [])
      if (eventsData && eventsData.length > 0) {
        setSelectedEvent(eventsData[0].id)
      }

      // Fetch reviewers (users with reviewer or admin role)
      const { data: reviewersData } = await supabase
        .from('user_profiles')
        .select('id, name, email, role')
        .in('role', ['reviewer', 'admin'])
        .order('name')

      setReviewers(reviewersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      showError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAssignments() {
    try {
      const response = await fetch(`/api/admin/paper-reviewer-assignments?event_id=${selectedEvent}`)
      const result = await response.json()
      if (result.success) {
        setAssignments(result.data)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  async function fetchUnassignedPapers() {
    try {
      const response = await fetch(`/api/admin/paper-reviewer-assignments/unassigned?event_id=${selectedEvent}`)
      const result = await response.json()
      if (result.success) {
        setUnassignedPapers(result.data)
      }
    } catch (error) {
      console.error('Error fetching unassigned papers:', error)
    }
  }

  async function handleManualAssign() {
    if (!selectedReviewer || selectedPapers.size === 0) {
      showError('Please select a reviewer and at least one paper')
      return
    }

    showLoading('Assigning papers...')

    try {
      const response = await fetch('/api/admin/paper-reviewer-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual',
          reviewer_id: selectedReviewer,
          paper_ids: Array.from(selectedPapers),
          event_id: selectedEvent
        })
      })

      const result = await response.json()
      closeAlert()

      if (result.success) {
        showSuccess(`Successfully assigned ${result.assigned_count} papers`)
        setSelectedPapers(new Set())
        setShowAssignModal(false)
        fetchAssignments()
        fetchUnassignedPapers()
      } else {
        showError(result.error || 'Failed to assign papers')
      }
    } catch (error) {
      closeAlert()
      showError('Failed to assign papers')
    }
  }

  async function handleRandomAssign(count: number) {
    if (!selectedReviewer) {
      showError('Please select a reviewer first')
      return
    }

    showLoading(`Assigning ${count} random papers...`)

    try {
      const response = await fetch('/api/admin/paper-reviewer-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'random',
          reviewer_id: selectedReviewer,
          event_id: selectedEvent,
          count
        })
      })

      const result = await response.json()
      closeAlert()

      if (result.success) {
        showSuccess(`Successfully assigned ${result.assigned_count} papers randomly`)
        fetchAssignments()
        fetchUnassignedPapers()
      } else {
        showError(result.error || 'Failed to assign papers')
      }
    } catch (error) {
      closeAlert()
      showError('Failed to assign papers')
    }
  }

  async function handleUnassign(assignmentId: string) {
    if (!confirm('Are you sure you want to remove this assignment?')) return

    try {
      const response = await fetch(`/api/admin/paper-reviewer-assignments?id=${assignmentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        showSuccess('Assignment removed')
        fetchAssignments()
        fetchUnassignedPapers()
      } else {
        showError(result.error || 'Failed to remove assignment')
      }
    } catch (error) {
      showError('Failed to remove assignment')
    }
  }

  // Update review mode for the selected event
  async function updateReviewMode(newMode: string) {
    if (!selectedEvent) return

    try {
      showLoading('Updating review mode...')

      const { error } = await supabase
        .from('events')
        .update({ paper_review_mode: newMode })
        .eq('id', selectedEvent)

      if (error) throw error

      // Update local state
      setEvents(prev => prev.map(e =>
        e.id === selectedEvent ? { ...e, paper_review_mode: newMode } : e
      ))

      closeAlert()
      showSuccess(`Review mode changed to ${newMode === 'open' ? 'Open Review' : newMode === 'single_blind' ? 'Single Blind' : 'Double Blind'}`)
    } catch (error) {
      console.error('Error updating review mode:', error)
      showError('Failed to update review mode')
    }
  }

  // Get current event's review mode
  const currentEvent = events.find(e => e.id === selectedEvent)
  const isBlindReview = currentEvent?.paper_review_mode !== 'open'

  // Stats
  const stats = useMemo(() => ({
    total: assignments.length + unassignedPapers.length,
    assigned: assignments.length,
    unassigned: unassignedPapers.length,
    completed: assignments.filter(a => a.review_status === 'completed').length,
    pending: assignments.filter(a => a.review_status === 'pending').length
  }), [assignments, unassignedPapers])

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">
              <i className="icofont-users-alt-4 me-2"></i>
              Paper Assignments
            </h1>
            <p className="text-muted mb-0">Assign papers to reviewers for blind review</p>
          </div>
          <Link href="/admin/papers" className="btn btn-outline-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Papers
          </Link>
        </div>

        {/* Event Selector */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-4">
                <label className="form-label">Select Event</label>
                <select
                  className="form-select"
                  value={selectedEvent}
                  onChange={e => setSelectedEvent(e.target.value)}
                >
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Review Mode</label>
                <select
                  className="form-select"
                  value={currentEvent?.paper_review_mode || 'double_blind'}
                  onChange={(e) => updateReviewMode(e.target.value)}
                >
                  <option value="open">👁️ Open Review (Author visible)</option>
                  <option value="single_blind">🕶️ Single Blind (Author hidden from reviewer)</option>
                  <option value="double_blind">🔒 Double Blind (Both hidden)</option>
                </select>
              </div>
              <div className="col-md-4 text-end">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAssignModal(true)}
                >
                  <i className="icofont-plus me-2"></i>
                  Assign Papers
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md">
            <div className="card text-center">
              <div className="card-body py-3">
                <h3 className="mb-0">{stats.total}</h3>
                <small className="text-muted">Total Papers</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="card text-center bg-info text-white">
              <div className="card-body py-3">
                <h3 className="mb-0">{stats.assigned}</h3>
                <small>Assigned</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="card text-center bg-warning">
              <div className="card-body py-3">
                <h3 className="mb-0">{stats.unassigned}</h3>
                <small>Unassigned</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="card text-center bg-secondary text-white">
              <div className="card-body py-3">
                <h3 className="mb-0">{stats.pending}</h3>
                <small>Pending Review</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="card text-center bg-success text-white">
              <div className="card-body py-3">
                <h3 className="mb-0">{stats.completed}</h3>
                <small>Reviewed</small>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Current Assignments</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Paper</th>
                    <th>Reviewer</th>
                    <th>Status</th>
                    <th>Assigned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <i className="icofont-file-document d-block mb-2" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                        No assignments yet. Click "Assign Papers" to get started.
                      </td>
                    </tr>
                  ) : (
                    assignments.map(assignment => (
                      <tr key={assignment.id}>
                        <td>
                          <div>
                            <Link href={`/admin/papers/${assignment.paper_id}`} className="fw-medium text-decoration-none">
                              {(assignment.papers as any)?.title?.substring(0, 50) || 'Unknown'}
                              {(assignment.papers as any)?.title?.length > 50 && '...'}
                            </Link>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">{(assignment.reviewer as any)?.name || 'Unknown'}</div>
                            <small className="text-muted">{(assignment.reviewer as any)?.email}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            assignment.review_status === 'completed' ? 'bg-success' :
                            assignment.review_status === 'in_progress' ? 'bg-warning text-dark' :
                            'bg-secondary'
                          }`}>
                            {assignment.review_status === 'completed' ? 'Reviewed' :
                             assignment.review_status === 'in_progress' ? 'In Progress' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(assignment.assigned_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleUnassign(assignment.id)}
                            title="Remove assignment"
                          >
                            <i className="icofont-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Assign Papers to Reviewer</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
                </div>
                <div className="modal-body">
                  {/* Reviewer Selection */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">Select Reviewer *</label>
                    <select
                      className="form-select"
                      value={selectedReviewer}
                      onChange={e => setSelectedReviewer(e.target.value)}
                    >
                      <option value="">Choose a reviewer...</option>
                      {reviewers.map(reviewer => (
                        <option key={reviewer.id} value={reviewer.id}>
                          {reviewer.name} ({reviewer.email}) - {reviewer.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Random Assignment Buttons */}
                  {selectedReviewer && (
                    <div className="mb-4 p-3 bg-light rounded">
                      <h6 className="mb-2">Quick Assignment</h6>
                      <p className="text-muted small mb-2">
                        Randomly assign unassigned papers to the selected reviewer:
                      </p>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleRandomAssign(10)}
                          disabled={unassignedPapers.length === 0}
                        >
                          <i className="icofont-random me-1"></i>
                          Assign 10 Random
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleRandomAssign(20)}
                          disabled={unassignedPapers.length === 0}
                        >
                          <i className="icofont-random me-1"></i>
                          Assign 20 Random
                        </button>
                      </div>
                      <small className="text-muted d-block mt-2">
                        {unassignedPapers.length} unassigned papers available
                      </small>
                    </div>
                  )}

                  {/* Manual Paper Selection */}
                  <div>
                    <h6 className="mb-2">Or Select Papers Manually</h6>
                    <p className="text-muted small mb-2">
                      Each paper can only be assigned to one reviewer.
                    </p>

                    {unassignedPapers.length === 0 ? (
                      <div className="alert alert-info">
                        <i className="icofont-info-circle me-2"></i>
                        All papers have been assigned to reviewers.
                      </div>
                    ) : (
                      <div className="border rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {unassignedPapers.map(paper => (
                          <div
                            key={paper.id}
                            className={`p-3 border-bottom d-flex align-items-start ${
                              selectedPapers.has(paper.id) ? 'bg-primary bg-opacity-10' : ''
                            }`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              const newSelected = new Set(selectedPapers)
                              if (newSelected.has(paper.id)) {
                                newSelected.delete(paper.id)
                              } else {
                                newSelected.add(paper.id)
                              }
                              setSelectedPapers(newSelected)
                            }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input me-3 mt-1"
                              checked={selectedPapers.has(paper.id)}
                              onChange={() => {}}
                            />
                            <div className="flex-grow-1">
                              <div className="fw-medium">{paper.title}</div>
                              {!isBlindReview && paper.user_profiles && (
                                <small className="text-muted">
                                  By: {paper.user_profiles.name}
                                </small>
                              )}
                              <small className="text-muted d-block">
                                Submitted: {new Date(paper.submitted_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedPapers.size > 0 && (
                      <div className="mt-2 text-muted small">
                        {selectedPapers.size} paper(s) selected
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedPapers(new Set())
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleManualAssign}
                    disabled={!selectedReviewer || selectedPapers.size === 0}
                  >
                    <i className="icofont-check me-1"></i>
                    Assign {selectedPapers.size} Paper(s)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
