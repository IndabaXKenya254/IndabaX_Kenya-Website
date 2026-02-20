'use client'

// ═══════════════════════════════════════════════════════════════════════
// NOAI ARCHIVES ADMIN PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage NOAI archive pages (IOAI competitions, etc.)

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'

interface Archive {
  id: string
  slug: string
  title: string
  subtitle: string | null
  year: string | null
  description: string | null
  featured_image: string | null
  content_sections: any[]
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

interface TimelineMilestone {
  id: string
  year: string
  title: string
  subtitle: string
  description: string
  link_url: string | null
  link_type: string | null
  is_published: boolean
}

export default function NOAIArchivesAdminPage() {
  const [archives, setArchives] = useState<Archive[]>([])
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingArchive, setEditingArchive] = useState<Archive | null>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('')

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    year: '',
    slug: '',
    description: '',
    featured_image: '',
    is_published: true,
    display_order: 0,
  })

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('bucket', 'gallery-photos')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await res.json()

      if (data.success && data.url) {
        setFormData(prev => ({ ...prev, featured_image: data.url }))
        showSuccess('Uploaded!', 'Image uploaded successfully')
      } else {
        showError('Upload Failed', data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showError('Upload Failed', 'An error occurred while uploading')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    loadArchives()
    loadMilestones()
  }, [])

  const loadArchives = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/noai/archives')
      const data = await res.json()
      if (data.success) {
        setArchives(data.data || [])
      }
    } catch (error) {
      console.error('Error loading archives:', error)
      showError('Error', 'Failed to load archives')
    } finally {
      setLoading(false)
    }
  }

  const loadMilestones = async () => {
    try {
      const res = await fetch('/api/noai/timeline')
      const data = await res.json()
      if (data.success) {
        setMilestones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading milestones:', error)
    }
  }

  // Get milestones that don't have an archive yet
  const getUnlinkedMilestones = () => {
    return milestones.filter(m => {
      // Check if any archive has this milestone's year or is linked via URL
      const hasArchive = archives.some(a => {
        // Match by year
        if (a.year === m.year) return true
        // Match by slug in milestone's link_url
        if (m.link_url && m.link_url.includes(`/noai/archive/${a.slug}`)) return true
        return false
      })
      return !hasArchive
    })
  }

  // Pre-fill form from a timeline milestone
  const fillFromMilestone = (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId)
    if (!milestone) {
      setSelectedMilestoneId('')
      return
    }

    setSelectedMilestoneId(milestoneId)

    // Generate slug from milestone data
    const slug = generateSlug(milestone.subtitle || milestone.title, milestone.year)

    setFormData({
      title: milestone.subtitle || milestone.title,
      subtitle: milestone.title,
      year: milestone.year.replace(/[^\d]/g, '').substring(0, 4),
      slug: slug,
      description: milestone.description,
      featured_image: '',
      is_published: milestone.is_published,
      display_order: archives.length + 1,
    })
  }

  // Generate slug from title
  const generateSlug = (title: string, year: string): string => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // If it looks like an IOAI title, format it nicely
    if (title.toLowerCase().includes('ioai') || title.toLowerCase().includes('olympiad')) {
      // Extract location if present
      const locationMatch = title.match(/[-–]\s*([^,]+)/i)
      const location = locationMatch
        ? locationMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
        : ''

      const cleanYear = year.replace(/[^\d]/g, '').substring(0, 4)

      if (location && cleanYear) {
        return `ioai-${cleanYear}-${location}`
      }
    }

    return baseSlug
  }

  const openCreateModal = () => {
    setEditingArchive(null)
    setSelectedMilestoneId('')
    setFormData({
      title: '',
      subtitle: '',
      year: '',
      slug: '',
      description: '',
      featured_image: '',
      is_published: true,
      display_order: archives.length + 1,
    })
    setShowModal(true)
  }

  const openEditModal = (archive: Archive) => {
    setEditingArchive(archive)
    setFormData({
      title: archive.title,
      subtitle: archive.subtitle || '',
      year: archive.year || '',
      slug: archive.slug,
      description: archive.description || '',
      featured_image: archive.featured_image || '',
      is_published: archive.is_published,
      display_order: archive.display_order,
    })
    setShowModal(true)
  }

  const handleTitleChange = (title: string) => {
    const newSlug = generateSlug(title, formData.year)
    setFormData({
      ...formData,
      title,
      slug: editingArchive ? formData.slug : newSlug // Only auto-generate for new archives
    })
  }

  const handleYearChange = (year: string) => {
    const newSlug = generateSlug(formData.title, year)
    setFormData({
      ...formData,
      year,
      slug: editingArchive ? formData.slug : newSlug
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const method = editingArchive ? 'PUT' : 'POST'
      const url = editingArchive
        ? `/api/noai/archives/${editingArchive.id}`
        : '/api/noai/archives'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        showSuccess('Success', editingArchive ? 'Archive updated!' : 'Archive created!')
        setShowModal(false)
        // Optimistic update: Update local state directly
        if (editingArchive && data.data) {
          setArchives(prev => prev.map(a => a.id === editingArchive.id ? data.data : a))
        } else if (data.data) {
          setArchives(prev => [...prev, data.data].sort((a, b) => a.display_order - b.display_order))
        } else {
          loadArchives()
        }
      } else {
        showError('Error', data.error || 'Failed to save archive')
      }
    } catch (error) {
      console.error('Error saving archive:', error)
      showError('Error', 'Failed to save archive')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await showConfirm(
      'Delete Archive',
      `Are you sure you want to delete "${title}"? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      const res = await fetch(`/api/noai/archives/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        showSuccess('Deleted', 'Archive deleted successfully')
        // Optimistic update: Remove from local state
        setArchives(prev => prev.filter(a => a.id !== id))
      } else {
        showError('Error', data.error || 'Failed to delete archive')
      }
    } catch (error) {
      console.error('Error deleting archive:', error)
      showError('Error', 'Failed to delete archive')
    }
  }

  const togglePublished = async (archive: Archive) => {
    try {
      const res = await fetch(`/api/noai/archives/${archive.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...archive, is_published: !archive.is_published }),
      })

      const data = await res.json()

      if (data.success) {
        showSuccess('Updated', `Archive ${archive.is_published ? 'unpublished' : 'published'}`)
        // Optimistic update: Toggle in local state
        setArchives(prev => prev.map(a =>
          a.id === archive.id ? { ...a, is_published: !a.is_published } : a
        ))
      }
    } catch (error) {
      console.error('Error toggling published:', error)
      showError('Error', 'Failed to update archive')
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
                <li className="breadcrumb-item active">Archives</li>
              </ol>
            </nav>
            <h1 className="h3 mb-0">NOAI Archives</h1>
            <p className="text-muted">Manage archive pages for IOAI competitions and events</p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/noai/archive" target="_blank" className="btn btn-outline-primary">
              <i className="icofont-eye me-2"></i>
              Preview
            </Link>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <i className="icofont-plus me-2"></i>
              Add Archive
            </button>
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert alert-info mb-4">
          <i className="icofont-info-circle me-2"></i>
          <strong>Tip:</strong> You can create archives from existing Timeline milestones using the &quot;Quick Fill&quot; dropdown in the Add Archive form.
          Archives are automatically linked to milestones by year. URL format: <code>/noai/archive/&#123;slug&#125;</code>
        </div>

        {/* Unlinked Milestones Warning */}
        {getUnlinkedMilestones().length > 0 && (
          <div className="alert alert-warning mb-4">
            <i className="icofont-warning me-2"></i>
            <strong>{getUnlinkedMilestones().length} Timeline milestone(s) without archives:</strong>
            <span className="ms-2">
              {getUnlinkedMilestones().map(m => `[${m.year}] ${m.subtitle}`).join(', ')}
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : archives.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="icofont-archive text-muted" style={{ fontSize: '48px' }}></i>
              <h5 className="mt-3">No Archives</h5>
              <p className="text-muted">Create your first archive for IOAI participation records.</p>
              <button className="btn btn-primary" onClick={openCreateModal}>
                <i className="icofont-plus me-2"></i>
                Add First Archive
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
                      <th>Slug (URL)</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archives.map((archive) => (
                      <tr key={archive.id}>
                        <td>
                          <span className="badge bg-secondary">{archive.display_order}</span>
                        </td>
                        <td>
                          <span className="badge bg-primary">{archive.year || '-'}</span>
                        </td>
                        <td>
                          <div>
                            <strong>{archive.title}</strong>
                            {archive.subtitle && (
                              <>
                                <br />
                                <small className="text-muted">{archive.subtitle}</small>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <code className="text-primary">/noai/archive/{archive.slug}</code>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${archive.is_published ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => togglePublished(archive)}
                          >
                            {archive.is_published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              href={`/noai/archive/${archive.slug}`}
                              target="_blank"
                              className="btn btn-outline-info"
                              title="View"
                            >
                              <i className="icofont-eye"></i>
                            </Link>
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openEditModal(archive)}
                              title="Edit"
                            >
                              <i className="icofont-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(archive.id, archive.title)}
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
                    {editingArchive ? 'Edit Archive' : 'Add Archive'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {/* Create from Timeline Section */}
                    {!editingArchive && milestones.length > 0 && (
                      <div className="mb-4 p-3 bg-light rounded">
                        <label className="form-label fw-bold">
                          <i className="icofont-chart-flow me-2"></i>
                          Create from Timeline Milestone (Quick Fill)
                        </label>
                        <select
                          className="form-select"
                          value={selectedMilestoneId}
                          onChange={(e) => fillFromMilestone(e.target.value)}
                        >
                          <option value="">-- Select a timeline milestone --</option>
                          {milestones.map((m) => {
                            // Check if this milestone already has an archive
                            const hasArchive = archives.some(a =>
                              a.year === m.year ||
                              (m.link_url && m.link_url.includes(`/noai/archive/${a.slug}`))
                            )
                            return (
                              <option key={m.id} value={m.id} disabled={hasArchive}>
                                [{m.year}] {m.subtitle} {hasArchive ? '(Already has archive)' : ''}
                              </option>
                            )
                          })}
                        </select>
                        <small className="text-muted">
                          Select a timeline milestone to auto-fill the form below
                        </small>
                        {selectedMilestoneId && (
                          <div className="mt-2">
                            <span className="badge bg-success">
                              <i className="icofont-check me-1"></i>
                              Form pre-filled from milestone
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-md-8">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="IOAI 2025 - Beijing, China"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Year</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.year}
                          onChange={(e) => handleYearChange(e.target.value)}
                          placeholder="2025"
                        />
                      </div>

                      <div className="col-md-8">
                        <label className="form-label">Subtitle</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.subtitle}
                          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          placeholder="Kenya's Historic First Participation"
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

                      <div className="col-12">
                        <label className="form-label">URL Slug *</label>
                        <div className="input-group">
                          <span className="input-group-text">/noai/archive/</span>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="ioai-2025-beijing"
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setFormData({
                              ...formData,
                              slug: generateSlug(formData.title, formData.year)
                            })}
                            title="Regenerate from title"
                          >
                            <i className="icofont-refresh"></i>
                          </button>
                        </div>
                        <small className="text-muted">
                          This will be the URL: <code>/noai/archive/{formData.slug || 'slug-here'}</code>
                        </small>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Kenya made history by participating in the International Olympiad..."
                        ></textarea>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Featured Image</label>

                        {/* Image Preview */}
                        {formData.featured_image && (
                          <div className="mb-2">
                            <img
                              src={formData.featured_image}
                              alt="Preview"
                              style={{
                                maxWidth: '200px',
                                maxHeight: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger ms-2"
                              onClick={() => setFormData({ ...formData, featured_image: '' })}
                            >
                              <i className="icofont-trash"></i> Remove
                            </button>
                          </div>
                        )}

                        {/* Upload Input */}
                        <div className="input-group mb-2">
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                          {uploading && (
                            <span className="input-group-text">
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Uploading...
                            </span>
                          )}
                        </div>

                        {/* Or URL Input */}
                        <div className="input-group">
                          <span className="input-group-text">Or URL</span>
                          <input
                            type="url"
                            className="form-control"
                            value={formData.featured_image}
                            onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <small className="text-muted">Optional hero background image for the archive page</small>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.is_published}
                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                          />
                          <label className="form-check-label">Published (visible on archive listing)</label>
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
                          {editingArchive ? 'Update' : 'Create'}
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
