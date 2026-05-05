'use client'

// ═══════════════════════════════════════════════════════════════════════
// NOAI TIMELINE MILESTONES ADMIN PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage Kenya's IOAI Journey timeline milestones

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'

interface TimelineMilestone {
  id: string
  year: string
  title: string
  subtitle: string
  date: string
  icon: string
  description: string
  highlight: string | null
  display_order: number
  is_published: boolean
  link_url: string | null
  link_type: 'internal' | 'external' | 'archive' | null
  created_at: string
  updated_at: string
}

interface Archive {
  id: string
  slug: string
  title: string
  year: string | null
}

const LINK_TYPE_OPTIONS = [
  { value: '', label: 'No Link' },
  { value: 'archive', label: 'Archive Page (/noai/archive/...)' },
  { value: 'internal', label: 'Internal Page (any site page)' },
  { value: 'external', label: 'External URL (opens in new tab)' },
]

/**
 * Generate archive URL slug from milestone data
 * Format: /noai/archive/ioai-{year}-{location}
 * Example: /noai/archive/ioai-2025-beijing
 */
function generateArchiveSlug(year: string, subtitle: string, title: string): string {
  // Try to extract location from subtitle (e.g., "2nd IOAI - Beijing, China" -> "beijing")
  let location = ''

  // Check subtitle for location pattern "- Location, Country" or "- Location"
  const subtitleMatch = subtitle.match(/[-–]\s*([^,]+)/i)
  if (subtitleMatch) {
    location = subtitleMatch[1].trim()
  }

  // Fallback: try to get location from title if subtitle didn't work
  if (!location && title) {
    // Look for patterns like "in Beijing" or "Beijing 2025"
    const titleMatch = title.match(/(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (titleMatch) {
      location = titleMatch[1].trim()
    }
  }

  // Clean the year (take first 4 digits)
  const cleanYear = year.replace(/[^\d]/g, '').substring(0, 4)

  // Create slug: lowercase, replace spaces with hyphens, remove special chars
  const locationSlug = location
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  if (locationSlug) {
    return `/noai/archive/ioai-${cleanYear}-${locationSlug}`
  }

  // Fallback if no location found
  return `/noai/archive/ioai-${cleanYear}`
}

const ICON_OPTIONS = [
  { value: 'icofont-flag-alt-2', label: 'Flag (Historic)' },
  { value: 'icofont-paper', label: 'Paper (Exam)' },
  { value: 'icofont-chart-line-alt', label: 'Chart (Progress)' },
  { value: 'icofont-graduate', label: 'Graduate (Training)' },
  { value: 'icofont-trophy', label: 'Trophy (Competition)' },
  { value: 'icofont-calendar', label: 'Calendar (Date)' },
  { value: 'icofont-star', label: 'Star (Achievement)' },
  { value: 'icofont-users-alt-4', label: 'Users (Team)' },
  { value: 'icofont-location-pin', label: 'Location (Venue)' },
  { value: 'icofont-medal', label: 'Medal (Award)' },
]

export default function NOAITimelineAdminPage() {
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([])
  const [archives, setArchives] = useState<Archive[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<TimelineMilestone | null>(null)
  const [archiveMode, setArchiveMode] = useState<'existing' | 'new'>('existing')

  const [formData, setFormData] = useState({
    year: '',
    title: '',
    subtitle: '',
    date: '',
    icon: 'icofont-calendar',
    description: '',
    highlight: '',
    display_order: 0,
    is_published: true,
    link_url: '',
    link_type: '' as '' | 'internal' | 'external' | 'archive',
    selected_archive_id: '', // For selecting existing archive
  })

  useEffect(() => {
    loadMilestones()
    loadArchives()
  }, [])

  const loadArchives = async () => {
    try {
      const res = await fetch('/api/noai/archives')
      const data = await res.json()
      if (data.success) {
        setArchives(data.data || [])
      }
    } catch (error) {
      console.error('Error loading archives:', error)
    }
  }

  const loadMilestones = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/noai/timeline')
      const data = await res.json()
      if (data.success) {
        setMilestones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading milestones:', error)
      showError('Error', 'Failed to load timeline milestones')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingMilestone(null)
    setArchiveMode('existing')
    setFormData({
      year: '',
      title: '',
      subtitle: '',
      date: '',
      icon: 'icofont-calendar',
      description: '',
      highlight: '',
      display_order: milestones.length + 1,
      is_published: true,
      link_url: '',
      link_type: '',
      selected_archive_id: '',
    })
    setShowModal(true)
  }

  const openEditModal = (milestone: TimelineMilestone) => {
    setEditingMilestone(milestone)

    // Check if there's an existing archive that matches this milestone's link_url
    const matchingArchive = archives.find(a =>
      milestone.link_url && milestone.link_url.endsWith(`/noai/archive/${a.slug}`)
    )

    setArchiveMode(matchingArchive ? 'existing' : 'new')
    setFormData({
      year: milestone.year,
      title: milestone.title,
      subtitle: milestone.subtitle,
      date: milestone.date,
      icon: milestone.icon,
      description: milestone.description,
      highlight: milestone.highlight || '',
      display_order: milestone.display_order,
      is_published: milestone.is_published,
      link_url: milestone.link_url || '',
      link_type: milestone.link_type || '',
      selected_archive_id: matchingArchive?.id || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let finalLinkUrl = formData.link_url

      // If archive link type is selected
      if (formData.link_type === 'archive') {
        if (archiveMode === 'existing' && formData.selected_archive_id) {
          // Use existing archive's URL
          const selectedArchive = archives.find(a => a.id === formData.selected_archive_id)
          if (selectedArchive) {
            finalLinkUrl = `/noai/archive/${selectedArchive.slug}`
          }
        } else if (archiveMode === 'new') {
          // Auto-create new archive from milestone data
          const slug = generateArchiveSlug(formData.year, formData.subtitle, formData.title)
            .replace('/noai/archive/', '') // Extract just the slug part

          // Check if archive with this slug already exists
          const existingArchive = archives.find(a => a.slug === slug)

          if (!existingArchive) {
            // Create new archive
            const archiveRes = await fetch('/api/noai/archives', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: formData.subtitle || formData.title,
                subtitle: formData.title,
                year: formData.year.replace(/[^\d]/g, '').substring(0, 4),
                slug: slug,
                description: formData.description,
                is_published: formData.is_published,
                display_order: archives.length + 1,
              }),
            })

            const archiveData = await archiveRes.json()
            if (archiveData.success) {
              // Refresh archives list
              loadArchives()
            } else {
              console.warn('Archive creation failed:', archiveData.error)
              // Continue anyway - the milestone will still be saved
            }
          }

          finalLinkUrl = `/noai/archive/${slug}`
        }
      }

      const method = editingMilestone ? 'PUT' : 'POST'
      const url = editingMilestone
        ? `/api/noai/timeline/${editingMilestone.id}`
        : '/api/noai/timeline'

      // Prepare data without selected_archive_id (not needed in DB)
      const { selected_archive_id, ...milestoneData } = formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...milestoneData,
          link_url: finalLinkUrl,
        }),
      })

      const data = await res.json()

      if (data.success) {
        const archiveCreated = formData.link_type === 'archive' && archiveMode === 'new'
        showSuccess('Success', editingMilestone
          ? 'Milestone updated!'
          : archiveCreated
            ? 'Milestone created and archive page auto-generated!'
            : 'Milestone created!')
        setShowModal(false)

        // Optimistic update: Update local state directly instead of refetching all
        if (editingMilestone && data.data) {
          // Update existing milestone in local state
          setMilestones(prev => prev.map(m =>
            m.id === editingMilestone.id ? data.data : m
          ))
        } else if (data.data) {
          // Add new milestone to local state
          setMilestones(prev => [...prev, data.data].sort((a, b) => a.display_order - b.display_order))
        } else {
          // Fallback: reload if no data returned
          loadMilestones()
        }
      } else {
        showError('Error', data.error || 'Failed to save milestone')
      }
    } catch (error) {
      console.error('Error saving milestone:', error)
      showError('Error', 'Failed to save milestone')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await showConfirm(
      'Delete Milestone',
      `Are you sure you want to delete "${title}"?`
    )

    if (!confirmed) return

    try {
      const res = await fetch(`/api/noai/timeline/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        showSuccess('Deleted', 'Milestone deleted successfully')
        // Optimistic update: Remove from local state
        setMilestones(prev => prev.filter(m => m.id !== id))
      } else {
        showError('Error', data.error || 'Failed to delete milestone')
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
      showError('Error', 'Failed to delete milestone')
    }
  }

  const togglePublished = async (milestone: TimelineMilestone) => {
    try {
      const res = await fetch(`/api/noai/timeline/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...milestone, is_published: !milestone.is_published }),
      })

      const data = await res.json()

      if (data.success) {
        showSuccess('Updated', `Milestone ${milestone.is_published ? 'unpublished' : 'published'}`)
        // Optimistic update: Toggle in local state
        setMilestones(prev => prev.map(m =>
          m.id === milestone.id ? { ...m, is_published: !m.is_published } : m
        ))
      }
    } catch (error) {
      console.error('Error toggling published:', error)
      showError('Error', 'Failed to update milestone')
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item">
                  <Link href="/admin/noai">NOAI Content</Link>
                </li>
                <li className="breadcrumb-item active">Timeline Milestones</li>
              </ol>
            </nav>
            <h1 className="h3 mb-0">Kenya&apos;s IOAI Journey Timeline</h1>
            <p className="text-muted">Manage milestone cards on the NOAI page</p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/noai#journey" target="_blank" className="btn btn-outline-primary">
              <i className="icofont-eye me-2"></i>
              Preview
            </Link>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <i className="icofont-plus me-2"></i>
              Add Milestone
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : milestones.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="icofont-flag-alt-2 text-muted" style={{ fontSize: '48px' }}></i>
              <h5 className="mt-3">No Timeline Milestones</h5>
              <p className="text-muted">Add your first milestone to the Kenya IOAI journey.</p>
              <button className="btn btn-primary" onClick={openCreateModal}>
                <i className="icofont-plus me-2"></i>
                Add First Milestone
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '60px' }}>Order</th>
                      <th style={{ width: '80px' }}>Year</th>
                      <th>Title</th>
                      <th>Date</th>
                      <th style={{ width: '80px' }}>Link</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((milestone) => (
                      <tr key={milestone.id}>
                        <td>
                          <span className="badge bg-secondary">{milestone.display_order}</span>
                        </td>
                        <td>
                          <span className="badge bg-primary">{milestone.year}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className={`${milestone.icon} me-2 text-primary`}></i>
                            <div>
                              <strong>{milestone.title}</strong>
                              <br />
                              <small className="text-muted">{milestone.subtitle}</small>
                            </div>
                          </div>
                        </td>
                        <td>{milestone.date}</td>
                        <td>
                          {milestone.link_url ? (
                            <span
                              className="badge bg-info"
                              title={milestone.link_url}
                              style={{ cursor: 'help' }}
                            >
                              <i className={`icofont-${milestone.link_type === 'external' ? 'external-link' : 'link'} me-1`}></i>
                              {milestone.link_type === 'archive' ? 'Archive' : milestone.link_type === 'external' ? 'External' : 'Internal'}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${milestone.is_published ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => togglePublished(milestone)}
                          >
                            {milestone.is_published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openEditModal(milestone)}
                              title="Edit"
                            >
                              <i className="icofont-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(milestone.id, milestone.title)}
                              title="Delete"
                            >
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
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Year *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          placeholder="2025 or 2025/26"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Date *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          placeholder="December 17, 2025"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Display Order</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="col-md-8">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Kenya's First IOAI Participation"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Icon</label>
                        <select
                          className="form-select"
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        >
                          {ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-8">
                        <label className="form-label">Subtitle *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.subtitle}
                          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          placeholder="2nd IOAI - Beijing, China"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Highlight Badge</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.highlight}
                          onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                          placeholder="Historic Debut"
                        />
                        <small className="text-muted">Optional badge text</small>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Description *</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Kenya made history by participating in the International Olympiad..."
                          required
                        ></textarea>
                      </div>

                      {/* Link Section */}
                      <div className="col-12">
                        <hr className="my-3" />
                        <h6 className="mb-3">
                          <i className="icofont-link me-2"></i>
                          Link Settings (Optional)
                        </h6>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Link Type</label>
                        <select
                          className="form-select"
                          value={formData.link_type}
                          onChange={(e) => {
                            const newLinkType = e.target.value as '' | 'internal' | 'external' | 'archive'
                            let newLinkUrl = formData.link_url

                            // Auto-generate archive URL when archive type is selected
                            if (newLinkType === 'archive') {
                              setArchiveMode(archives.length > 0 ? 'existing' : 'new')
                              if (archives.length === 0) {
                                newLinkUrl = generateArchiveSlug(formData.year, formData.subtitle, formData.title)
                              }
                            } else if (newLinkType === '') {
                              newLinkUrl = ''
                            }

                            setFormData({
                              ...formData,
                              link_type: newLinkType,
                              link_url: newLinkUrl,
                              selected_archive_id: ''
                            })
                          }}
                        >
                          {LINK_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Archive Selection UI - Simplified */}
                      {formData.link_type === 'archive' && (
                        <div className="col-md-8">
                          <label className="form-label">Archive Page</label>

                          {/* If archives exist, show dropdown with "Create New" option */}
                          {archives.length > 0 ? (
                            <>
                              <select
                                className="form-select mb-2"
                                value={formData.selected_archive_id || '__new__'}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === '__new__') {
                                    setArchiveMode('new')
                                    setFormData({
                                      ...formData,
                                      selected_archive_id: '',
                                      link_url: generateArchiveSlug(formData.year, formData.subtitle, formData.title)
                                    })
                                  } else {
                                    setArchiveMode('existing')
                                    const selectedArchive = archives.find(a => a.id === value)
                                    setFormData({
                                      ...formData,
                                      selected_archive_id: value,
                                      link_url: selectedArchive ? `/noai/archive/${selectedArchive.slug}` : ''
                                    })
                                  }
                                }}
                              >
                                <option value="__new__">+ Create New Archive (auto-generate)</option>
                                <optgroup label="Existing Archives">
                                  {archives.map((archive) => (
                                    <option key={archive.id} value={archive.id}>
                                      {archive.year ? `[${archive.year}] ` : ''}{archive.title}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>

                              {/* Show slug input for new archive */}
                              {archiveMode === 'new' && (
                                <div className="input-group">
                                  <span className="input-group-text">/noai/archive/</span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={formData.link_url.replace('/noai/archive/', '')}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      link_url: `/noai/archive/${e.target.value}`
                                    })}
                                    placeholder="ioai-2025-beijing"
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setFormData({
                                      ...formData,
                                      link_url: generateArchiveSlug(formData.year, formData.subtitle, formData.title)
                                    })}
                                    title="Auto-generate from Year & Subtitle"
                                  >
                                    <i className="icofont-refresh"></i>
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            /* No archives exist - show create new UI directly */
                            <div className="input-group">
                              <span className="input-group-text">/noai/archive/</span>
                              <input
                                type="text"
                                className="form-control"
                                value={formData.link_url.replace('/noai/archive/', '')}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  link_url: `/noai/archive/${e.target.value}`
                                })}
                                placeholder="ioai-2025-beijing"
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setFormData({
                                  ...formData,
                                  link_url: generateArchiveSlug(formData.year, formData.subtitle, formData.title)
                                })}
                                title="Auto-generate from Year & Subtitle"
                              >
                                <i className="icofont-refresh"></i>
                              </button>
                            </div>
                          )}

                          <small className="text-muted">
                            {archiveMode === 'existing'
                              ? 'Select an existing archive page to link to'
                              : 'A new archive page will be auto-created when you save'}
                          </small>
                        </div>
                      )}

                      {/* Non-archive link types */}
                      {formData.link_type && formData.link_type !== 'archive' && (
                        <div className="col-md-8">
                          <label className="form-label">Link URL</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.link_url}
                            onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                            placeholder={
                              formData.link_type === 'external'
                                ? 'https://example.com'
                                : '/noai'
                            }
                          />
                          <small className="text-muted">
                            {formData.link_type === 'external' && 'Full URL including https://'}
                            {formData.link_type === 'internal' && 'Internal page path starting with /'}
                          </small>
                        </div>
                      )}

                      {formData.link_url && (
                        <div className="col-12">
                          <div className={`alert py-2 d-flex align-items-center ${archiveMode === 'new' && formData.link_type === 'archive' ? 'alert-success' : 'alert-info'}`}>
                            <i className={`me-2 ${archiveMode === 'new' && formData.link_type === 'archive' ? 'icofont-check-circled' : 'icofont-info-circle'}`}></i>
                            <span>
                              {archiveMode === 'new' && formData.link_type === 'archive' ? (
                                <>Archive page <strong>{formData.link_url}</strong> will be auto-created</>
                              ) : (
                                <>This milestone will link to: <strong>{formData.link_url}</strong>
                                {formData.link_type === 'external' && ' (opens in new tab)'}</>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="col-12">
                        <hr className="my-3" />
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.is_published}
                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                          />
                          <label className="form-check-label">Published (visible on NOAI page)</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="icofont-save me-2"></i>
                          {editingMilestone ? 'Update' : 'Create'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
