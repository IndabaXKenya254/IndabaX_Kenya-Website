'use client'

// ═══════════════════════════════════════════════════════════════════════
// SCHEDULE MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage event schedules and sessions

import { useState, useEffect, useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert, Pagination, SearchFilter } from '@/components/admin/ui'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'
import { useAdminSchedules, useAdminEvents, useAdminSpeakers } from '@/hooks/useAdminApi'

interface ScheduleItem {
  id: string
  event_id: string
  day_number: number
  day_name?: string
  schedule_date?: string
  start_time: string
  end_time: string
  title: string
  description?: string
  session_type: 'keynote' | 'talk' | 'workshop' | 'panel' | 'break' | 'networking' | 'registration' | 'track' | 'tutorial' | 'poster' | 'hackathon' | 'social' | 'special' | 'closing'
  location?: string
  speaker_ids?: string[]
  event?: { title: string }
  speakers?: { id: string; name: string }[]
}

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  includes_saturday: boolean
  includes_sunday: boolean
  event_dates: string[] | null
}

interface Speaker {
  id: string
  name: string
}

export default function ScheduleManagementPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [alert, setAlert] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)
  const [selectedEventData, setSelectedEventData] = useState<Event | null>(null)
  const [eventDuration, setEventDuration] = useState<number>(0)

  // React Query hooks - automatic caching and deduplication
  const scheduleFilters = useMemo(() => ({
    event_id: selectedEvent || undefined,
    search: searchTerm.trim() || undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  }), [selectedEvent, searchTerm, itemsPerPage, currentPage])

  const { data: schedules, isLoading: loading, refetch: refetchSchedules } = useAdminSchedules(scheduleFilters)
  const totalItems = !schedules || schedules.length === 0 ? 0 : schedules.length

  // Load all events and speakers (no filters, for dropdowns)
  const { data: events } = useAdminEvents({})
  const { data: speakers } = useAdminSpeakers({})

  const [formData, setFormData] = useState({
    event_id: '',
    day_number: 1,
    day_name: '',
    schedule_date: '',
    start_time: '09:00',
    end_time: '10:00',
    title: '',
    description: '',
    session_type: 'talk' as ScheduleItem['session_type'],
    location: '',
    speaker_ids: [] as string[]
  })

  // Handle event selection and pre-fill fields
  useEffect(() => {
    if (formData.event_id && events && events.length > 0) {
      const event = (events || []).find(e => e.id === formData.event_id)
      if (event) {
        setSelectedEventData(event)

        // Calculate event duration - use event_dates if available, otherwise use weekend logic
        if (event.event_dates && event.event_dates.length > 0) {
          // Use precise event_dates array
          const sortedDates = [...event.event_dates].sort()
          setEventDuration(sortedDates.length)

          // Pre-fill schedule_date based on day_number (using event_dates)
          if (formData.day_number && formData.day_number <= sortedDates.length) {
            const targetDate = sortedDates[formData.day_number - 1] // day_number is 1-indexed
            setFormData(prev => ({
              ...prev,
              schedule_date: targetDate
            }))
          }
        } else {
          // Fall back to weekend-based calculation
          const startDate = new Date(event.start_date)
          const endDate = new Date(event.end_date)

          // Count actual event days (excluding weekends if not included)
          let actualDays = 0
          let currentDate = new Date(startDate)

          while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay() // 0 = Sunday, 6 = Saturday
            const isSaturday = dayOfWeek === 6
            const isSunday = dayOfWeek === 0

            // Include this day if it's not a weekend, or if the event includes that weekend day
            if ((!isSaturday && !isSunday) ||
                (isSaturday && event.includes_saturday) ||
                (isSunday && event.includes_sunday)) {
              actualDays++
            }

            currentDate.setDate(currentDate.getDate() + 1)
          }

          setEventDuration(actualDays)

          // Pre-fill schedule_date based on day_number (accounting for weekend settings)
          if (formData.day_number && formData.day_number <= actualDays) {
            let scheduleDate = new Date(startDate)
            let daysAdded = 0

            // Find the calendar date for the given event day number
            while (daysAdded < formData.day_number) {
              const dayOfWeek = scheduleDate.getDay()
              const isSaturday = dayOfWeek === 6
              const isSunday = dayOfWeek === 0

              // Count this day if it's an event day
              if ((!isSaturday && !isSunday) ||
                  (isSaturday && event.includes_saturday) ||
                  (isSunday && event.includes_sunday)) {
                daysAdded++

                if (daysAdded === formData.day_number) {
                  break
                }
              }

              scheduleDate.setDate(scheduleDate.getDate() + 1)
            }

            setFormData(prev => ({
              ...prev,
              schedule_date: scheduleDate.toISOString().split('T')[0]
            }))
          }
        }
      }
    }
  }, [formData.event_id, formData.day_number, events])

  function openCreateModal() {
    setEditingSchedule(null)
    setFormData({
      event_id: selectedEvent || '',
      day_number: 1,
      day_name: '',
      schedule_date: '',
      start_time: '09:00',
      end_time: '10:00',
      title: '',
      description: '',
      session_type: 'talk',
      location: '',
      speaker_ids: []
    })
    setShowModal(true)
  }

  function openEditModal(schedule: ScheduleItem) {
    setEditingSchedule(schedule)
    setFormData({
      event_id: schedule.event_id,
      day_number: schedule.day_number,
      day_name: schedule.day_name || '',
      schedule_date: schedule.schedule_date || '',
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      title: schedule.title,
      description: schedule.description || '',
      session_type: schedule.session_type,
      location: schedule.location || '',
      speaker_ids: schedule.speaker_ids || []
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingSchedule(null)
    setSelectedEventData(null)
    setEventDuration(0)
  }

  function handleChange(e: any) {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value
    }))
  }

  function handleSpeakerToggle(speakerId: string) {
    setFormData(prev => ({
      ...prev,
      speaker_ids: prev.speaker_ids.includes(speakerId)
        ? prev.speaker_ids.filter(id => id !== speakerId)
        : [...prev.speaker_ids, speakerId]
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.event_id || !formData.title.trim()) {
      setAlert({ type: 'danger', message: 'Event and title are required' })
      return
    }

    // Validate day number against event duration
    if (eventDuration > 0 && formData.day_number > eventDuration) {
      setAlert({
        type: 'danger',
        message: `Day number cannot exceed ${eventDuration} (the event's duration)`
      })
      return
    }

    try {
      let result
      if (editingSchedule) {
        result = await adminApi.schedules.update(editingSchedule.id, formData)
      } else {
        result = await adminApi.schedules.create(formData)
      }

      if (result.success) {
        showSuccess(
          editingSchedule ? 'Schedule Updated!' : 'Schedule Created!',
          `Session "${formData.title}" has been ${editingSchedule ? 'updated' : 'created'} successfully`
        )
        closeModal()
        refetchSchedules()
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to save schedule' })
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred while saving' })
    }
  }

  async function handleDelete(schedule: ScheduleItem) {
    const confirmed = await showConfirm(
      'Delete Schedule Item?',
      `Are you sure you want to delete "${schedule.title}"?`,
      'warning'
    )

    if (!confirmed) return

    try {
      const result = await adminApi.schedules.delete(schedule.id)

      if (result.success) {
        showSuccess('Deleted!', `Schedule item "${schedule.title}" has been deleted`)
        refetchSchedules()
      } else {
        showError('Delete Failed', result.error || 'Failed to delete schedule item')
      }
    } catch (error) {
      showError('Error', 'An error occurred while deleting')
    }
  }

  const groupedSchedules = (schedules || []).reduce((acc, schedule) => {
    const key = `${schedule.event_id}-${schedule.day_number}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(schedule)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

  // Sort schedules by start time within each group
  Object.keys(groupedSchedules).forEach(key => {
    groupedSchedules[key].sort((a: ScheduleItem, b: ScheduleItem) => a.start_time.localeCompare(b.start_time))
  })

  const getSessionTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      keynote: 'bg-danger',
      talk: 'bg-primary',
      workshop: 'bg-success',
      panel: 'bg-warning',
      break: 'bg-secondary',
      networking: 'bg-info',
      registration: 'bg-dark',
      track: 'bg-purple',
      tutorial: 'bg-teal',
      poster: 'bg-indigo',
      hackathon: 'bg-orange',
      social: 'bg-pink',
      special: 'bg-gold',
      closing: 'bg-maroon'
    }
    return badges[type] || 'bg-secondary'
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-4">
            <h2>
              <i className="icofont-calendar me-2"></i>
              Schedule Management
            </h2>
            <p className="text-muted">Manage event schedules and sessions</p>
          </div>
          <div className="col-md-4">
            <label className="form-label small">Filter by Event</label>
            <select
              className="form-select"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              disabled={loading}
            >
              <option value="">All Events</option>
              {(events || []).map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 text-md-end">
            <button
              className="btn btn-primary mt-4"
              onClick={openCreateModal}
              disabled={loading}
            >
              <i className="icofont-plus me-2"></i>
              Add Schedule Item
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search schedule items by title, description..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
        />

        {/* Schedule Items */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading schedules...</p>
          </div>
        ) : !schedules || Object.keys(groupedSchedules).length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5 text-muted">
              <i className="icofont-calendar" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3">No schedule items found</p>
              <button className="btn btn-primary mt-2" onClick={openCreateModal}>
                Create Your First Schedule Item
              </button>
            </div>
          </div>
        ) : (
          <div className="row">
            {Object.keys(groupedSchedules).map(key => {
              const items = groupedSchedules[key]
              const firstItem = items[0]
              const event = (events || []).find(e => e.id === firstItem.event_id)

              return (
                <div key={key} className="col-lg-6 mb-4">
                  <div className="card">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="icofont-calendar me-2"></i>
                        {event?.title || 'Event'} - Day {firstItem.day_number}
                      </h5>
                    </div>
                    <div className="card-body p-0">
                      <div className="list-group list-group-flush">
                        {items.map((schedule: ScheduleItem) => (
                          <div key={schedule.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                  <span className="badge bg-dark me-2">
                                    {schedule.start_time} - {schedule.end_time}
                                  </span>
                                  <span className={`badge ${getSessionTypeBadge(schedule.session_type)}`}>
                                    {schedule.session_type.toUpperCase()}
                                  </span>
                                </div>
                                <h6 className="mb-1">{schedule.title}</h6>
                                {schedule.description && (
                                  <p className="mb-1 small text-muted">{schedule.description}</p>
                                )}
                                {schedule.location && (
                                  <p className="mb-1 small">
                                    <i className="icofont-location-pin me-1"></i>
                                    {schedule.location}
                                  </p>
                                )}
                                {schedule.speaker_ids && schedule.speaker_ids.length > 0 && (
                                  <p className="mb-0 small">
                                    <i className="icofont-user me-1"></i>
                                    {schedule.speaker_ids.length} speaker(s)
                                  </p>
                                )}
                              </div>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-primary"
                                  onClick={() => openEditModal(schedule)}
                                  title="Edit"
                                >
                                  <i className="icofont-edit"></i>
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDelete(schedule)}
                                  title="Delete"
                                >
                                  <i className="icofont-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / itemsPerPage)}
              onPageChange={(page) => setCurrentPage(page)}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingSchedule ? 'Edit Schedule Item' : 'Add Schedule Item'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                    disabled={loading}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        Event <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="event_id"
                        value={formData.event_id}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Event</option>
                        {(events || []).map(event => (
                          <option key={event.id} value={event.id}>{event.title}</option>
                        ))}
                      </select>
                      {selectedEventData && eventDuration > 0 && (
                        <small className="text-muted d-block mt-1">
                          <i className="icofont-calendar me-1"></i>
                          This event spans <strong>{eventDuration} day{eventDuration !== 1 ? 's' : ''}</strong>
                          {' '}({new Date(selectedEventData.start_date).toLocaleDateString()} - {new Date(selectedEventData.end_date).toLocaleDateString()})
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">
                        Day Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${eventDuration > 0 && formData.day_number > eventDuration ? 'is-invalid' : ''}`}
                        name="day_number"
                        value={formData.day_number}
                        onChange={handleChange}
                        min="1"
                        max={eventDuration || undefined}
                        required
                        disabled={loading || !formData.event_id}
                      />
                      {eventDuration > 0 && formData.day_number > eventDuration && (
                        <div className="invalid-feedback">
                          Day number cannot exceed {eventDuration} (event duration)
                        </div>
                      )}
                      {eventDuration > 0 && formData.day_number <= eventDuration && (
                        <small className="text-muted d-block mt-1">
                          Max: Day {eventDuration}
                        </small>
                      )}
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Day Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="day_name"
                        value={formData.day_name}
                        onChange={handleChange}
                        placeholder="e.g. Day 1, Opening Day"
                        disabled={loading}
                      />
                      <small className="text-muted">Optional display name</small>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Schedule Date</label>
                      <input
                        type="text"
                        className="form-control"
                        name="schedule_date"
                        value={formData.schedule_date}
                        onChange={handleChange}
                        placeholder="e.g. March 15, 2026"
                        disabled={loading}
                      />
                      <small className="text-muted">Optional date string</small>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Start Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className="form-control"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        End Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className="form-control"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Opening Keynote: The Future of AI"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Brief description of this session..."
                      disabled={loading}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Session Type</label>
                      <select
                        className="form-select"
                        name="session_type"
                        value={formData.session_type}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="keynote">Keynote</option>
                        <option value="talk">Talk</option>
                        <option value="workshop">Workshop</option>
                        <option value="panel">Panel</option>
                        <option value="break">Break</option>
                        <option value="networking">Networking</option>
                        <option value="registration">Registration</option>
                        <option value="track">Track</option>
                        <option value="tutorial">Tutorial</option>
                        <option value="poster">Poster</option>
                        <option value="hackathon">Hackathon</option>
                        <option value="social">Social</option>
                        <option value="special">Special</option>
                        <option value="closing">Closing</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Main Hall, Room 101"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Speakers</label>
                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {!speakers || speakers.length === 0 ? (
                        <p className="text-muted small mb-0">No speakers available</p>
                      ) : (
                        (speakers || []).map(speaker => (
                          <div key={speaker.id} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`speaker-${speaker.id}`}
                              checked={formData.speaker_ids.includes(speaker.id)}
                              onChange={() => handleSpeakerToggle(speaker.id)}
                              disabled={loading}
                            />
                            <label className="form-check-label" htmlFor={`speaker-${speaker.id}`}>
                              {speaker.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    <small className="text-muted">Select speakers for this session</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="icofont-check me-2"></i>
                        {editingSchedule ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
