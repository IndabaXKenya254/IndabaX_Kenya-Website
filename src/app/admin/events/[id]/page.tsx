'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EDIT EVENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Form to edit existing events
// Created: Admin UI Phase 2 - Content Management

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert, FileUpload } from '@/components/admin/ui'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { showFormError, showRequiredFieldsError, showSuccess } from '@/lib/sweetalert'
import EventPreviewModal from '@/components/admin/EventPreviewModal'
import { TagSelector, SpeakerSelector, SponsorSelector, TeamMemberSelector, VenueSelector } from '@/components/admin/selectors'
import { TemplateSelector } from '@/components/admin/TemplateSelector'
import { EventDatesPicker } from '@/components/admin/EventDatesPicker'
import { adminApi } from '@/lib/admin/api-client'

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    event_type: 'conference',
    event_category: 'general',
    status: 'upcoming' as 'draft' | 'published' | 'upcoming' | 'ongoing' | 'past' | 'archived' | 'cancelled',
    featured_image: '',
    registration_url: '',
    application_form_url: '',
    max_attendees: '',
    is_featured: false,
    includes_saturday: true,
    includes_sunday: true,
    event_dates: null as string[] | null,
    venue_id: null as string | null,
    tag_ids: [] as string[],
    speaker_ids: [] as string[],
    sponsor_ids: [] as string[],
    team_member_ids: [] as string[],
    initial_template_id: null as string | null,
    detailed_template_id: null as string | null,
    interest_template_id: null as string | null,
    registration_enabled: true,
    registration_deadline: null as string | null,
    theme: '',
    format: 'physical' as 'physical' | 'hybrid' | 'online',
    edition: '',
    partners: '',
    gallery_link: '',
    external_link: '',
    external_link_label: '',
  })

  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    setLoadingEvent(true)
    try {
      const result = await adminApi.events.get(eventId)

      if (result.success && result.data) {
        const event: any = result.data

        // Extract tag IDs, speaker IDs, sponsor IDs, and team member IDs from relationship objects
        const tag_ids = event.tags?.map((tag: any) => tag.id) || []
        const speaker_ids = event.speakers?.map((speaker: any) => speaker.id) || []
        const sponsor_ids = event.sponsors?.map((sponsor: any) => sponsor.id) || []
        const team_member_ids = event.team_members?.map((member: any) => member.id) || []

        // Convert partners array to comma-separated string for form
        const partnersString = Array.isArray(event.partners) ? event.partners.join(', ') : ''

        setFormData({
          title: event.title || '',
          description: event.description || '',
          start_date: event.start_date ? event.start_date.split('T')[0] : '',
          end_date: event.end_date ? event.end_date.split('T')[0] : '',
          location: event.location || '',
          event_type: event.event_type || 'conference',
          event_category: event.event_category || 'general',
          status: event.status || 'upcoming',
          featured_image: event.featured_image || '',
          registration_url: event.registration_url || '',
          application_form_url: event.application_form_url || '',
          max_attendees: event.max_attendees ? String(event.max_attendees) : '',
          is_featured: event.is_featured || false,
          includes_saturday: event.includes_saturday !== undefined ? event.includes_saturday : true,
          includes_sunday: event.includes_sunday !== undefined ? event.includes_sunday : true,
          event_dates: event.event_dates || null,
          venue_id: event.venue_id || null,
          tag_ids,
          speaker_ids,
          sponsor_ids,
          team_member_ids,
          initial_template_id: event.initial_template_id || null,
          detailed_template_id: event.detailed_template_id || null,
          interest_template_id: event.interest_template_id || null,
          registration_enabled: event.registration_enabled !== undefined ? event.registration_enabled : true,
          registration_deadline: event.registration_deadline ? event.registration_deadline.split('T')[0] : null,
          theme: event.theme || '',
          format: event.format || 'physical',
          edition: event.edition || '',
          partners: partnersString,
          gallery_link: event.gallery_link || '',
          external_link: event.external_link || '',
          external_link_label: event.external_link_label || '',
        })
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to load event' })
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred while loading the event' })
    } finally {
      setLoadingEvent(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    // Handle weekend checkbox changes - update calendar picker
    if ((name === 'includes_saturday' || name === 'includes_sunday') && formData.event_dates && formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      const allDates: string[] = []
      const current = new Date(start)

      while (current <= end) {
        allDates.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }

      let updatedDates = [...formData.event_dates]

      if (name === 'includes_saturday') {
        const saturdays = allDates.filter(dateStr => new Date(dateStr).getDay() === 6)
        if (newValue) {
          // Add all Saturdays
          saturdays.forEach(sat => {
            if (!updatedDates.includes(sat)) updatedDates.push(sat)
          })
        } else {
          // Remove all Saturdays
          updatedDates = updatedDates.filter(d => !saturdays.includes(d))
        }
      } else if (name === 'includes_sunday') {
        const sundays = allDates.filter(dateStr => new Date(dateStr).getDay() === 0)
        if (newValue) {
          // Add all Sundays
          sundays.forEach(sun => {
            if (!updatedDates.includes(sun)) updatedDates.push(sun)
          })
        } else {
          // Remove all Sundays
          updatedDates = updatedDates.filter(d => !sundays.includes(d))
        }
      }

      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        event_dates: updatedDates.sort()
      }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }))
  }

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }))
  }

  const handleFileSelect = async (file: File) => {
    setUploadingBanner(true)
    setAlert(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload/event-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success && result.data) {
        setFormData((prev) => ({ ...prev, featured_image: result.data.url }))
        setAlert({ type: 'success', message: 'Banner uploaded successfully' })
      } else {
        setAlert({ type: 'danger', message: result.error?.message || 'Failed to upload banner' })
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred while uploading the banner' })
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    // Check required fields with user-friendly error
    const missingFields: string[] = []
    if (!formData.title.trim()) missingFields.push('title')
    if (!formData.start_date) missingFields.push('start_date')
    if (!formData.location.trim()) missingFields.push('location')

    if (missingFields.length > 0) {
      showRequiredFieldsError(missingFields)
      setLoading(false)
      return
    }

    try {
      // Ensure data consistency: derive boolean flags from event_dates if provided
      let includes_saturday = formData.includes_saturday
      let includes_sunday = formData.includes_sunday

      if (formData.event_dates && formData.event_dates.length > 0 && formData.start_date && formData.end_date) {
        // Generate all dates in range to check which weekends are included
        const start = new Date(formData.start_date)
        const end = new Date(formData.end_date)
        const allDates: string[] = []
        const current = new Date(start)

        while (current <= end) {
          allDates.push(current.toISOString().split('T')[0])
          current.setDate(current.getDate() + 1)
        }

        const saturdays = allDates.filter(dateStr => new Date(dateStr).getDay() === 6)
        const sundays = allDates.filter(dateStr => new Date(dateStr).getDay() === 0)

        // Derive boolean flags from actual selected dates
        includes_saturday = saturdays.length > 0 && saturdays.every(sat => formData.event_dates!.includes(sat))
        includes_sunday = sundays.length > 0 && sundays.every(sun => formData.event_dates!.includes(sun))
      }

      // Parse partners from comma-separated string to array
      const partnersArray = formData.partners
        ? formData.partners.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : []

      const eventData: any = {
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date || formData.start_date,
        location: formData.location,
        event_type: formData.event_type,
        event_category: formData.event_category,
        status: formData.status,
        featured_image: formData.featured_image || null,
        registration_url: formData.registration_url || null,
        application_form_url: formData.application_form_url || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        is_featured: formData.is_featured,
        includes_saturday,
        includes_sunday,
        event_dates: formData.event_dates && formData.event_dates.length > 0 ? formData.event_dates : null,
        venue_id: formData.venue_id,
        tag_ids: formData.tag_ids,
        speaker_ids: formData.speaker_ids,
        sponsor_ids: formData.sponsor_ids,
        team_member_ids: formData.team_member_ids,
        // Phase 4: Registration Configuration
        registration_enabled: formData.registration_enabled,
        registration_deadline: formData.registration_deadline || null,
        initial_template_id: formData.initial_template_id || null,
        detailed_template_id: formData.detailed_template_id || null,
        interest_template_id: formData.interest_template_id || null,
        // New fields: theme, format, edition, partners
        theme: formData.theme || null,
        format: formData.format,
        edition: formData.edition || null,
        partners: partnersArray.length > 0 ? partnersArray : null,
        // Gallery and external links
        gallery_link: formData.gallery_link || null,
        external_link: formData.external_link || null,
        external_link_label: formData.external_link_label || null,
      }

      const result = await adminApi.events.update(eventId, eventData)

      if (result.success) {
        showSuccess('Event Updated', 'Event has been updated successfully!')
        setTimeout(() => router.push('/admin/events'), 1500)
      } else {
        // Use SweetAlert with user-friendly error message
        showFormError(result.error || 'Failed to update event', 'Update Failed')
        setLoading(false)
      }
    } catch (error) {
      showFormError('An unexpected error occurred while updating the event', 'Update Failed')
      setLoading(false)
    }
  }

  if (loadingEvent) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading event...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Edit Event</h2>
            <p className="text-muted">Update event details</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/admin/events')}
            >
              ← Back to Events
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Event Title <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" id="title" name="title" value={formData.title} onChange={handleChange} required />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      placeholder="Describe your event... Include schedule, requirements, and important details."
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="location" className="form-label">Location <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" id="location" name="location" value={formData.location} onChange={handleChange} required />
                  </div>

                  {/* Venue Selector */}
                  <div className="mb-3">
                    <VenueSelector
                      selectedId={formData.venue_id}
                      onChange={(venue_id) => setFormData(prev => ({ ...prev, venue_id }))}
                      disabled={loading}
                    />
                  </div>

                  {/* Theme */}
                  <div className="mb-3">
                    <label htmlFor="theme" className="form-label">
                      Event Theme/Tagline
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      placeholder="e.g. AI for Smart Cities"
                    />
                    <small className="text-muted">Optional: A catchy theme or tagline for the event</small>
                  </div>

                  {/* Format */}
                  <div className="mb-3">
                    <label htmlFor="format" className="form-label">Event Format</label>
                    <select
                      className="form-select"
                      id="format"
                      name="format"
                      value={formData.format}
                      onChange={handleChange}
                    >
                      <option value="physical">Physical (In-Person)</option>
                      <option value="hybrid">Hybrid (Physical + Virtual)</option>
                      <option value="online">Online (Virtual Only)</option>
                    </select>
                  </div>

                  {/* Edition */}
                  <div className="mb-3">
                    <label htmlFor="edition" className="form-label">
                      Event Edition
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="edition"
                      name="edition"
                      value={formData.edition}
                      onChange={handleChange}
                      placeholder="e.g. Strathmore Edition, Dedan Kimathi Edition 2"
                    />
                    <small className="text-muted">Optional: Identifier for this edition (venue name, year, etc.)</small>
                  </div>

                  {/* Partners */}
                  <div className="mb-3">
                    <label htmlFor="partners" className="form-label">
                      Event Partners/Sponsors
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="partners"
                      name="partners"
                      value={formData.partners}
                      onChange={handleChange}
                      placeholder="e.g. Google, Microsoft, AWS"
                    />
                    <small className="text-muted">
                      Optional: Enter partner names separated by commas
                    </small>
                  </div>

                  {/* Gallery & External Links Card */}
                  <div className="card mb-3 border-info">
                    <div className="card-header bg-info bg-opacity-10">
                      <h6 className="mb-0">
                        <i className="icofont-link me-2"></i>
                        Gallery & External Links
                      </h6>
                    </div>
                    <div className="card-body">
                      {/* Gallery Link */}
                      <div className="mb-3">
                        <label htmlFor="gallery_link" className="form-label">
                          <i className="icofont-google-drive me-1"></i>
                          Photo Gallery Link
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          id="gallery_link"
                          name="gallery_link"
                          value={formData.gallery_link}
                          onChange={handleChange}
                          placeholder="https://drive.google.com/drive/folders/..."
                        />
                        <small className="text-muted">
                          Google Drive or external link to full photo gallery
                        </small>
                      </div>

                      {/* External Link */}
                      <div className="mb-3">
                        <label htmlFor="external_link" className="form-label">
                          <i className="icofont-external-link me-1"></i>
                          External Article/Awards Link
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          id="external_link"
                          name="external_link"
                          value={formData.external_link}
                          onChange={handleChange}
                          placeholder="https://example.com/article-about-event"
                        />
                        <small className="text-muted">
                          Link to news article, awards page, or related content
                        </small>
                      </div>

                      {/* External Link Label */}
                      {formData.external_link && (
                        <div className="mb-0">
                          <label htmlFor="external_link_label" className="form-label">
                            <i className="icofont-tag me-1"></i>
                            External Link Button Label
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="external_link_label"
                            name="external_link_label"
                            value={formData.external_link_label}
                            onChange={handleChange}
                            placeholder="e.g. Awards & Highlights, Read Article"
                          />
                          <small className="text-muted">
                            Custom text for the button (default: &quot;View More&quot;)
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="start_date" className="form-label">Start Date <span className="text-danger">*</span></label>
                      <input type="date" className="form-control" id="start_date" name="start_date" value={formData.start_date} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="end_date" className="form-label">End Date</label>
                      <input type="date" className="form-control" id="end_date" name="end_date" value={formData.end_date} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Precise Date Picker - Calendar */}
                  {formData.start_date && formData.end_date && (
                    <div className="mb-3">
                      <EventDatesPicker
                        startDate={formData.start_date}
                        endDate={formData.end_date}
                        selectedDates={formData.event_dates}
                        onChange={(dates) => {
                          // Update event_dates and sync checkboxes
                          const start = new Date(formData.start_date)
                          const end = new Date(formData.end_date)
                          const allDates: string[] = []
                          const current = new Date(start)

                          while (current <= end) {
                            allDates.push(current.toISOString().split('T')[0])
                            current.setDate(current.getDate() + 1)
                          }

                          const saturdays = allDates.filter(dateStr => new Date(dateStr).getDay() === 6)
                          const sundays = allDates.filter(dateStr => new Date(dateStr).getDay() === 0)

                          const allSaturdaysSelected = saturdays.length > 0 && saturdays.every(sat => dates.includes(sat))
                          const allSundaysSelected = sundays.length > 0 && sundays.every(sun => dates.includes(sun))

                          setFormData(prev => ({
                            ...prev,
                            event_dates: dates,
                            includes_saturday: allSaturdaysSelected,
                            includes_sunday: allSundaysSelected
                          }))
                        }}
                        disabled={loading}
                      />
                      <small className="text-muted">
                        <i className="icofont-info-circle me-1"></i>
                        Optional: Select specific dates for precise scheduling (syncs with weekend checkboxes)
                      </small>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="registration_url" className="form-label">Registration URL</label>
                    <input type="url" className="form-control" id="registration_url" name="registration_url" value={formData.registration_url} onChange={handleChange} />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="application_form_url" className="form-label">
                      Application Form URL (Google Forms)
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="application_form_url"
                      name="application_form_url"
                      value={formData.application_form_url}
                      onChange={handleChange}
                      placeholder="https://docs.google.com/forms/d/e/..."
                    />
                    <small className="text-muted d-block mt-1">
                      <i className="icofont-info-circle me-1"></i>
                      Optional: Provide Google Form URL. If empty, uses built-in form template.
                    </small>
                  </div>

                  {/* Tag Selector */}
                  <div className="mb-3">
                    <TagSelector
                      type="event"
                      selectedIds={formData.tag_ids}
                      onChange={(tag_ids) => setFormData(prev => ({ ...prev, tag_ids }))}
                      disabled={loading}
                    />
                  </div>

                  {/* Speaker Selector */}
                  <div className="mb-3">
                    <SpeakerSelector
                      selectedIds={formData.speaker_ids}
                      onChange={(speaker_ids) => setFormData(prev => ({ ...prev, speaker_ids }))}
                      disabled={loading}
                    />
                  </div>

                  {/* Sponsor Selector */}
                  <div className="mb-3">
                    <SponsorSelector
                      selectedIds={formData.sponsor_ids}
                      onChange={(sponsor_ids) => setFormData(prev => ({ ...prev, sponsor_ids }))}
                      disabled={loading}
                    />
                  </div>

                  {/* Team Member Selector */}
                  <div className="mb-3">
                    <TeamMemberSelector
                      selectedIds={formData.team_member_ids}
                      onChange={(team_member_ids) => setFormData(prev => ({ ...prev, team_member_ids }))}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">Status</label>
                    <select className="form-select" id="status" name="status" value={formData.status} onChange={handleChange}>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="past">Past</option>
                      <option value="archived">Archived</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="event_type" className="form-label">Event Type</label>
                    <select className="form-select" id="event_type" name="event_type" value={formData.event_type} onChange={handleChange}>
                      <option value="conference">Conference</option>
                      <option value="workshop">Workshop</option>
                      <option value="meetup">Meetup</option>
                      <option value="webinar">Webinar</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="event_category" className="form-label">Event Category</label>
                    <select className="form-select" id="event_category" name="event_category" value={formData.event_category} onChange={handleChange}>
                      <option value="general">General</option>
                      <option value="indabax">IndabaX</option>
                      <option value="noai">NOAI</option>
                    </select>
                    <small className="text-muted d-block mt-1">
                      <i className="icofont-info-circle me-1"></i>
                      Select NOAI for National Olympiad events
                    </small>
                  </div>

                  {/* Featured Event Toggle */}
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="is_featured"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="is_featured">
                        <strong>Featured Event</strong>
                        <small className="d-block text-muted">
                          Display on homepage
                        </small>
                      </label>
                    </div>
                  </div>

                  {/* Weekend Configuration */}
                  <div className="mb-3">
                    <label className="form-label"><strong>Event Days</strong></label>
                    <small className="d-block text-muted mb-2">
                      Select which days the event runs on (for accurate day count)
                    </small>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="includes_saturday"
                        name="includes_saturday"
                        checked={formData.includes_saturday}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="includes_saturday">
                        Includes Saturday
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="includes_sunday"
                        name="includes_sunday"
                        checked={formData.includes_sunday}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="includes_sunday">
                        Includes Sunday
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="max_attendees" className="form-label">Max Attendees</label>
                    <input type="number" className="form-control" id="max_attendees" name="max_attendees" value={formData.max_attendees} onChange={handleChange} min="0" />
                  </div>

                  <div className="mb-3">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept="image/*"
                      maxSize={5 * 1024 * 1024}
                      preview={true}
                      currentUrl={formData.featured_image}
                      label="Event Banner"
                    />
                    {uploadingBanner && (
                      <div className="mt-2">
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        <span className="text-muted small">Uploading...</span>
                      </div>
                    )}
                  </div>

                  {/* Registration Configuration */}
                  <div className="card mb-3">
                    <div className="card-body">
                      <h6 className="card-title mb-3">
                        <i className="icofont-ui-note me-2"></i>
                        Registration Configuration
                      </h6>

                      {/* Registration Enabled Toggle */}
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="registration_enabled"
                            name="registration_enabled"
                            checked={formData.registration_enabled}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="registration_enabled">
                            <strong>Enable Registration</strong>
                            <small className="d-block text-muted">
                              Allow users to register for this event
                            </small>
                          </label>
                        </div>
                      </div>

                      {formData.registration_enabled && (
                        <>
                          {/* Registration Deadline */}
                          <div className="mb-3">
                            <label htmlFor="registration_deadline" className="form-label">
                              Registration Deadline
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              id="registration_deadline"
                              name="registration_deadline"
                              value={formData.registration_deadline || ''}
                              onChange={handleChange}
                            />
                            <small className="text-muted d-block mt-1">
                              <i className="icofont-info-circle me-1"></i>
                              Optional: Registration closes on this date
                            </small>
                          </div>

                          {/* Application Form Template - for open events */}
                          <div className="mb-3">
                            <TemplateSelector
                              selectedId={formData.initial_template_id}
                              onChange={(initial_template_id) => setFormData(prev => ({ ...prev, initial_template_id }))}
                              disabled={loading}
                              usageType="application"
                              label="Application Form"
                              helperText="Registration form when event is open for applications"
                            />
                          </div>

                          {/* Interest Form Template - for closed events */}
                          <div className="mb-3">
                            <TemplateSelector
                              selectedId={formData.interest_template_id}
                              onChange={(interest_template_id) => setFormData(prev => ({ ...prev, interest_template_id }))}
                              disabled={loading}
                              usageType="initial_interest"
                              label="Interest Form"
                              helperText="Form to collect interest when event registration is closed"
                            />
                          </div>

                          {/* Detailed Survey Template - after shortlisting */}
                          <div className="mb-3">
                            <TemplateSelector
                              selectedId={formData.detailed_template_id}
                              onChange={(detailed_template_id) => setFormData(prev => ({ ...prev, detailed_template_id }))}
                              disabled={loading}
                              usageType="detailed_survey"
                              label="Detailed Survey"
                              helperText="Survey sent to shortlisted applicants (optional)"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="d-grid gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-info text-white"
                      onClick={() => setShowPreview(true)}
                      disabled={loading || uploadingBanner}
                    >
                      <i className="icofont-eye me-2"></i>
                      Preview Event
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading || uploadingBanner}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Updating...
                        </>
                      ) : (
                        <>✓ Update Event</>
                      )}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/events')} disabled={loading}>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Preview Modal */}
        <EventPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          eventData={formData}
        />
      </div>
    </DashboardLayout>
  )
}
