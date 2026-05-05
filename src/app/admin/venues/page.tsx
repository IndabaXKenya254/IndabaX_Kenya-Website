'use client'

// ═══════════════════════════════════════════════════════════════════════
// VENUES MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { Alert, Pagination, SearchFilter, FileUpload } from '@/components/admin/ui'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { useAdminVenues, useAdminEvents } from '@/hooks/useAdminApi'

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  status: string
}

interface Venue {
  id: string
  name: string
  slug: string
  address?: string | null
  city?: string | null
  country: string
  description?: string | null
  facilities?: string | null
  getting_there?: string | null
  nearby_amenities?: string | null
  capacity?: number | null
  image_url?: string | null
  map_embed_url?: string | null
  map_latitude?: number | null
  map_longitude?: number | null
  website_url?: string | null
  phone?: string | null
  email?: string | null
  is_active: boolean
  display_order: number
}

export default function VenuesManagementPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<string>('')
  const [alert, setAlert] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'location' | 'events'>('basic')

  // React Query hooks - automatic caching and deduplication
  const venueFilters = useMemo(() => ({
    search: searchTerm.trim() || undefined,
    is_active: filterActive !== '' ? (filterActive === 'true') : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  }), [searchTerm, filterActive, itemsPerPage, currentPage])

  const { data: venues, isLoading: loading, refetch: refetchVenues } = useAdminVenues(venueFilters)
  const totalItems = !venues || venues.length === 0 ? 0 : venues.length

  // Load events for the event selector (limit 100)
  const { data: events } = useAdminEvents({ limit: 100 })

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    city: '',
    country: 'Kenya',
    description: '',
    facilities: '',
    getting_there: '',
    nearby_amenities: '',
    capacity: 0,
    image_url: '',
    map_embed_url: '',
    map_latitude: 0,
    map_longitude: 0,
    website_url: '',
    phone: '',
    email: '',
    is_active: true,
    display_order: 0,
    event_ids: [] as string[]
  })

  async function openCreateModal() {
    setEditingVenue(null)
    setFormData({
      name: '',
      slug: '',
      address: '',
      city: '',
      country: 'Kenya',
      description: '',
      facilities: '',
      getting_there: '',
      nearby_amenities: '',
      capacity: 0,
      image_url: '',
      map_embed_url: '',
      map_latitude: 0,
      map_longitude: 0,
      website_url: '',
      phone: '',
      email: '',
      is_active: true,
      display_order: 0,
      event_ids: []
    })
    setActiveTab('basic')
    setShowModal(true)
  }

  async function openEditModal(venue: Venue) {
    setEditingVenue(venue)

    // Fetch events that use this venue
    const eventIds: string[] = []
    try {
      const response = await fetch(`/api/admin/events?venue_id=${venue.id}`)
      const result = await response.json()
      if (result.success && result.data) {
        eventIds.push(...result.data.map((e: Event) => e.id))
      }
    } catch (error) {
      console.error('Failed to load venue events:', error)
    }

    setFormData({
      name: venue.name,
      slug: venue.slug,
      address: venue.address || '',
      city: venue.city || '',
      country: venue.country,
      description: venue.description || '',
      facilities: venue.facilities || '',
      getting_there: venue.getting_there || '',
      nearby_amenities: venue.nearby_amenities || '',
      capacity: venue.capacity || 0,
      image_url: venue.image_url || '',
      map_embed_url: venue.map_embed_url || '',
      map_latitude: venue.map_latitude || 0,
      map_longitude: venue.map_longitude || 0,
      website_url: venue.website_url || '',
      phone: venue.phone || '',
      email: venue.email || '',
      is_active: venue.is_active,
      display_order: venue.display_order,
      event_ids: eventIds
    })
    setActiveTab('basic')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingVenue(null)
  }

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  function handleRichTextChange(field: string, value: string) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleImageUpload(file: File) {
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/admin/upload/venue-image', {
        method: 'POST',
        body: fd,
        credentials: 'include'
      })

      const result = await res.json()

      if (result.success && result.data?.url) {
        setFormData(prev => ({ ...prev, image_url: result.data.url }))
        showSuccess('Image Uploaded', 'Venue image uploaded successfully')
      } else {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to upload image'
        showError('Upload Failed', errorMessage)
      }
    } catch (error) {
      showError('Upload Error', 'An error occurred while uploading the image')
    }
  }

  function generateSlug() {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  function toggleEvent(eventId: string) {
    setFormData(prev => ({
      ...prev,
      event_ids: prev.event_ids.includes(eventId)
        ? prev.event_ids.filter(id => id !== eventId)
        : [...prev.event_ids, eventId]
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim() || !formData.slug.trim()) {
      setAlert({ type: 'danger', message: 'Name and slug are required' })
      return
    }

    try {
      // Save venue (without event_ids in the venue data)
      const { event_ids, ...venueData } = formData
      const body = editingVenue ? { id: editingVenue.id, ...venueData } : venueData

      const response = await fetch('/api/admin/venues', {
        method: editingVenue ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        const venueId = result.data.id

        // Update events to link to this venue
        if (event_ids.length > 0) {
          await updateEventsVenue(venueId, event_ids)
        }

        // Clear venue_id from events not selected
        if (editingVenue) {
          const unselectedEvents = (events || [])
            .filter(e => !event_ids.includes(e.id))
            .map(e => e.id)
          if (unselectedEvents.length > 0) {
            await clearEventsVenue(editingVenue.id, unselectedEvents)
          }
        }

        showSuccess(
          editingVenue ? 'Venue Updated!' : 'Venue Added!',
          `${formData.name} has been ${editingVenue ? 'updated' : 'added'} successfully`
        )
        closeModal()
        refetchVenues()
      } else {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to save venue'
        setAlert({ type: 'danger', message: errorMessage })
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred while saving' })
    }
  }

  async function updateEventsVenue(venueId: string, eventIds: string[]) {
    try {
      for (const eventId of eventIds) {
        await fetch(`/api/admin/events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ venue_id: venueId })
        })
      }
    } catch (error) {
      console.error('Failed to update events:', error)
    }
  }

  async function clearEventsVenue(venueId: string, eventIds: string[]) {
    try {
      for (const eventId of eventIds) {
        // First check if this event actually has this venue
        const checkResponse = await fetch(`/api/admin/events/${eventId}`)
        const checkResult = await checkResponse.json()
        if (checkResult.success && checkResult.data?.venue_id === venueId) {
          await fetch(`/api/admin/events/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ venue_id: null })
          })
        }
      }
    } catch (error) {
      console.error('Failed to clear events:', error)
    }
  }

  async function handleDelete(venue: Venue) {
    const confirmed = await showConfirm(
      'Delete Venue?',
      `Are you sure you want to delete "${venue.name}"?`,
      'warning'
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/venues?id=${venue.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        showSuccess('Deleted!', `${venue.name} has been deleted`)
        refetchVenues()
      } else {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to delete venue'
        showError('Delete Failed', errorMessage)
      }
    } catch (error) {
      showError('Error', 'An error occurred while deleting')
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>
              <i className="icofont-building-alt me-2"></i>
              Venues Management
            </h2>
            <p className="text-muted">Manage conference venues</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button className="btn btn-primary" onClick={openCreateModal} disabled={loading}>
              <i className="icofont-plus me-2"></i>
              Add Venue
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="row mb-3">
          <div className="col-md-8">
            <SearchFilter
              searchPlaceholder="Search venues by name, city, or address..."
              onSearchChange={setSearchTerm}
              currentItemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small">Filter by Status</label>
            <select className="form-select" value={filterActive} onChange={(e) => setFilterActive(e.target.value)} disabled={loading}>
              <option value="">All Venues</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading venues...</p>
          </div>
        ) : !venues || venues.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5 text-muted">
              <i className="icofont-building-alt" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3">No venues found</p>
              <button className="btn btn-primary mt-2" onClick={openCreateModal}>
                Add Your First Venue
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Venue</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(venues || []).map((venue) => (
                    <tr key={venue.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {venue.image_url && (
                            <img src={venue.image_url} alt={venue.name} className="rounded me-3" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                          )}
                          <div>
                            <strong>{venue.name}</strong>
                            <br />
                            <small className="text-muted">{venue.slug}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {venue.city && <div>{venue.city}</div>}
                        {venue.address && <small className="text-muted">{venue.address.substring(0, 50)}...</small>}
                      </td>
                      <td>{venue.capacity ? `${venue.capacity}+` : '-'}</td>
                      <td>
                        {venue.is_active ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </td>
                      <td>{venue.display_order}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-primary" onClick={() => openEditModal(venue)} title="Edit">
                            <i className="icofont-edit"></i>
                          </button>
                          <button className="btn btn-danger" onClick={() => handleDelete(venue)} title="Delete">
                            <i className="icofont-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingVenue ? 'Edit Venue' : 'Add Venue'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={loading}></button>
                </div>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Tabs */}
                  <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                      >
                        <i className="icofont-info-circle me-2"></i>
                        Basic Info
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'content' ? 'active' : ''}`}
                        onClick={() => setActiveTab('content')}
                      >
                        <i className="icofont-edit me-2"></i>
                        Rich Content
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'location' ? 'active' : ''}`}
                        onClick={() => setActiveTab('location')}
                      >
                        <i className="icofont-location-pin me-2"></i>
                        Location & Map
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                      >
                        <i className="icofont-calendar me-2"></i>
                        Events
                        {formData.event_ids.length > 0 && (
                          <span className="badge bg-primary ms-2">{formData.event_ids.length}</span>
                        )}
                      </button>
                    </li>
                  </ul>

                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div>
                      <div className="row">
                        <div className="col-md-8 mb-3">
                          <label className="form-label">Name <span className="text-danger">*</span></label>
                          <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="Kenyatta International Convention Centre" required disabled={loading} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Display Order</label>
                          <input type="number" className="form-control" name="display_order" value={formData.display_order} onChange={handleChange} min="0" disabled={loading} />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-8">
                          <label className="form-label">Slug <span className="text-danger">*</span></label>
                          <input type="text" className="form-control" name="slug" value={formData.slug} onChange={handleChange} placeholder="kicc-nairobi" required disabled={loading} />
                          <small className="text-muted">URL-friendly identifier (lowercase, hyphens only)</small>
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                          <button type="button" className="btn btn-secondary w-100" onClick={generateSlug} disabled={loading || !formData.name}>
                            <i className="icofont-magic me-2"></i>
                            Auto-generate from Name
                          </button>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">City</label>
                          <input type="text" className="form-control" name="city" value={formData.city} onChange={handleChange} placeholder="Nairobi" disabled={loading} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Country</label>
                          <input type="text" className="form-control" name="country" value={formData.country} onChange={handleChange} placeholder="Kenya" disabled={loading} />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Address</label>
                        <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} placeholder="Harambee Avenue, Nairobi" disabled={loading} />
                      </div>

                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Capacity</label>
                          <input type="number" className="form-control" name="capacity" value={formData.capacity} onChange={handleChange} min="0" disabled={loading} />
                          <small className="text-muted">Number of attendees</small>
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Phone</label>
                          <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} placeholder="+254..." disabled={loading} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Email</label>
                          <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder="info@venue.com" disabled={loading} />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <FileUpload
                            onFileSelect={handleImageUpload}
                            accept="image/*"
                            maxSize={5 * 1024 * 1024}
                            preview
                            currentUrl={formData.image_url}
                            label="Venue Image"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Website URL</label>
                          <input type="url" className="form-control" name="website_url" value={formData.website_url} onChange={handleChange} placeholder="https://venue-website.com" disabled={loading} />
                        </div>
                      </div>

                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} disabled={loading} />
                        <label className="form-check-label" htmlFor="is_active">
                          Active (visible on public venue page)
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Content Tab */}
                  {activeTab === 'content' && (
                    <div>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Description</label>
                        <RichTextEditor
                          value={formData.description}
                          onChange={(value) => handleRichTextChange('description', value)}
                          placeholder="Describe the venue, its features, and what makes it special..."
                          disabled={loading}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-bold">Facilities</label>
                        <RichTextEditor
                          value={formData.facilities}
                          onChange={(value) => handleRichTextChange('facilities', value)}
                          placeholder="List available facilities (WiFi, AV equipment, parking, etc.)..."
                          disabled={loading}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-bold">Getting There</label>
                        <RichTextEditor
                          value={formData.getting_there}
                          onChange={(value) => handleRichTextChange('getting_there', value)}
                          placeholder="Provide transportation options (from airport, by car, public transport, etc.)..."
                          disabled={loading}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-bold">Nearby Amenities</label>
                        <RichTextEditor
                          value={formData.nearby_amenities}
                          onChange={(value) => handleRichTextChange('nearby_amenities', value)}
                          placeholder="List nearby hotels, restaurants, shopping centers, services, etc..."
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Location Tab */}
                  {activeTab === 'location' && (
                    <div>
                      <div className="mb-3">
                        <label className="form-label">Google Maps Embed URL</label>
                        <input type="text" className="form-control" name="map_embed_url" value={formData.map_embed_url} onChange={handleChange} placeholder="https://www.google.com/maps/embed?pb=..." disabled={loading} />
                        <small className="text-muted">Go to Google Maps, click Share → Embed a map → Copy HTML</small>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Latitude</label>
                          <input type="number" step="0.0000001" className="form-control" name="map_latitude" value={formData.map_latitude} onChange={handleChange} placeholder="-1.2920659" disabled={loading} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Longitude</label>
                          <input type="number" step="0.0000001" className="form-control" name="map_longitude" value={formData.map_longitude} onChange={handleChange} placeholder="36.8190384" disabled={loading} />
                        </div>
                      </div>

                      {formData.map_embed_url && (
                        <div className="mt-3">
                          <label className="form-label fw-bold">Map Preview</label>
                          <div className="border rounded" style={{ height: '400px', overflow: 'hidden' }}>
                            <iframe
                              src={formData.map_embed_url}
                              width="100%"
                              height="400"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Events Tab */}
                  {activeTab === 'events' && (
                    <div>
                      <div className="mb-3">
                        <h6 className="fw-bold">
                          <i className="icofont-calendar me-2"></i>
                          Select Events for this Venue
                        </h6>
                        <p className="text-muted small">
                          Choose which events will be held at this venue. The selected events will be automatically linked to this venue.
                        </p>
                      </div>

                      {!events || events.length === 0 ? (
                        <div className="alert alert-info">
                          <i className="icofont-info-circle me-2"></i>
                          No events available. Create events first to assign them to this venue.
                        </div>
                      ) : (
                        <div className="list-group" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                          {(events || []).map((event) => (
                            <div
                              key={event.id}
                              className={`list-group-item list-group-item-action d-flex align-items-center ${formData.event_ids.includes(event.id) ? 'active' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleEvent(event.id)}
                            >
                              <input
                                type="checkbox"
                                className="form-check-input me-3"
                                checked={formData.event_ids.includes(event.id)}
                                onChange={() => {}}
                                style={{ cursor: 'pointer' }}
                              />
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{event.title}</h6>
                                <small className={formData.event_ids.includes(event.id) ? 'text-white-50' : 'text-muted'}>
                                  {new Date(event.start_date).toLocaleDateString()}
                                  {event.end_date && event.end_date !== event.start_date &&
                                    ` - ${new Date(event.end_date).toLocaleDateString()}`
                                  }
                                  {event.status && (
                                    <span className={`badge ms-2 ${formData.event_ids.includes(event.id) ? 'bg-light text-dark' : 'bg-secondary'}`}>
                                      {event.status}
                                    </span>
                                  )}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {formData.event_ids.length > 0 && (
                        <div className="mt-3 alert alert-success">
                          <i className="icofont-check-circled me-2"></i>
                          <strong>{formData.event_ids.length}</strong> event{formData.event_ids.length !== 1 ? 's' : ''} selected for this venue
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
                    Clear
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="icofont-check me-2"></i>
                        {editingVenue ? 'Update' : 'Create'}
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
