'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'

interface Participant {
  id: string
  year: number
  name: string | null
  school: string | null
  photo_url: string | null
  role: string
  achievement: string | null
  bio: string | null
  display_order: number
  is_published: boolean
}

interface Archive {
  id: string
  slug: string
  title: string
  year: string | null
  is_published: boolean
}

interface TimelineMilestone {
  id: string
  year: string
  title: string
  subtitle: string
  link_url: string | null
}

const CURRENT_YEAR = new Date().getFullYear()

// Generate years dynamically: from 2024 to current year + 1
const generateYears = () => {
  const startYear = 2024
  const endYear = CURRENT_YEAR + 1
  const years: number[] = []
  for (let y = startYear; y <= endYear; y++) {
    years.push(y)
  }
  return years
}

export default function ParticipantsAdminPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [archives, setArchives] = useState<Archive[]>([])
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    year: CURRENT_YEAR,
    name: '',
    school: '',
    photo_url: '',
    photo_file: null as File | null,
    role: 'contestant',
    achievement: '',
    bio: '',
    display_order: 0,
    is_published: true
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Dynamic years - auto includes next year for planning
  const years = generateYears()
  const ROLES = ['contestant', 'team_leader', 'deputy_leader', 'observer']
  const ACHIEVEMENTS = ['gold', 'silver', 'bronze', 'honorable_mention', 'participant']

  useEffect(() => {
    loadParticipants()
    loadArchives()
    loadMilestones()
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

  // Get archive or milestone for a given year
  const getYearInfo = (year: number) => {
    const yearStr = year.toString()
    const archive = archives.find(a => a.year === yearStr)
    const milestone = milestones.find(m => m.year === yearStr || m.year.startsWith(yearStr))
    return { archive, milestone }
  }

  const loadParticipants = async () => {
    try {
      // Include unpublished for admin, disable caching
      const res = await fetch('/api/noai/participants?all=true', {
        cache: 'no-store'
      })
      const data = await res.json()
      if (data.success) {
        // If grouped by year, flatten
        if (typeof data.data === 'object' && !Array.isArray(data.data)) {
          const flattened: Participant[] = []
          Object.values(data.data).forEach((yearParticipants: any) => {
            flattened.push(...yearParticipants)
          })
          setParticipants(flattened)
        } else {
          setParticipants(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (participant: Participant) => {
    setEditingId(participant.id)
    setShowAddForm(false)
    setFormData({
      year: participant.year,
      name: participant.name || '',
      school: participant.school || '',
      photo_url: participant.photo_url || '',
      photo_file: null,
      role: participant.role,
      achievement: participant.achievement || '',
      bio: participant.bio || '',
      display_order: participant.display_order,
      is_published: participant.is_published
    })
  }

  const handleAddNew = () => {
    setShowAddForm(true)
    setEditingId(null)
    const yearParticipants = participants.filter(p => p.year === selectedYear)
    setFormData({
      year: selectedYear,
      name: '',
      school: '',
      photo_url: '',
      photo_file: null,
      role: 'contestant',
      achievement: 'participant',
      bio: '',
      display_order: yearParticipants.length,
      is_published: true
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      year: CURRENT_YEAR,
      name: '',
      school: '',
      photo_url: '',
      photo_file: null,
      role: 'contestant',
      achievement: '',
      bio: '',
      display_order: 0,
      is_published: true
    })
  }

  // Compress image and create thumbnail
  const compressImage = async (file: File): Promise<{ original: string; thumbnail: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Original - compress to max 1024px
          const canvas1 = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxSize = 1024

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas1.width = width
          canvas1.height = height
          const ctx1 = canvas1.getContext('2d')!
          ctx1.drawImage(img, 0, 0, width, height)
          const original = canvas1.toDataURL('image/jpeg', 0.85)

          // Thumbnail - 300x300
          const canvas2 = document.createElement('canvas')
          canvas2.width = 300
          canvas2.height = 300
          const ctx2 = canvas2.getContext('2d')!
          const size = Math.min(img.width, img.height)
          const x = (img.width - size) / 2
          const y = (img.height - size) / 2
          ctx2.drawImage(img, x, y, size, size, 0, 0, 300, 300)
          const thumbnail = canvas2.toDataURL('image/jpeg', 0.8)

          resolve({ original, thumbnail })
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Upload to Supabase Storage
  const uploadImage = async (dataUrl: string, fileName: string): Promise<string> => {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], fileName, { type: 'image/jpeg' })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'gallery-photos')

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Upload failed')
    return data.url
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showError('File Too Large', 'File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const { original, thumbnail } = await compressImage(file)

      // Upload both versions
      const originalUrl = await uploadImage(original, `participant-${Date.now()}.jpg`)
      const thumbnailUrl = await uploadImage(thumbnail, `participant-${Date.now()}-thumb.jpg`)

      setFormData({
        ...formData,
        photo_url: originalUrl,
        photo_file: file
      })

      showSuccess('Uploaded!', 'Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      showError('Upload Failed', (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.photo_url) {
      showError('Photo Required', 'Please upload an image first')
      return
    }

    setSaving(true)
    showLoading('Saving participant...')

    try {
      const payload = {
        ...(editingId && { id: editingId }),
        year: formData.year,
        name: formData.name || null,
        school: formData.school || null,
        photo_url: formData.photo_url,
        role: formData.role,
        achievement: formData.achievement || null,
        bio: formData.bio || null,
        display_order: formData.display_order,
        is_published: formData.is_published
      }

      const res = await fetch('/api/noai/participants', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      closeAlert()

      if (data.success) {
        // Optimistic update: Update local state directly
        if (editingId && data.data) {
          setParticipants(prev => prev.map(p => p.id === editingId ? data.data : p))
        } else if (data.data) {
          setParticipants(prev => [...prev, data.data])
        } else {
          await loadParticipants()
        }
        handleCancel()
        showSuccess('Success!', editingId ? 'Participant updated' : 'Participant added')
      } else {
        showError('Error', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error saving:', error)
      closeAlert()
      showError('Error', 'Failed to save participant')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirmation('this participant')
    if (!confirmed) return

    // Optimistic update - remove from local state immediately for instant UX
    const previousParticipants = [...participants]
    setParticipants(prev => prev.filter(p => p.id !== id))
    showSuccess('Deleted!', 'Participant deleted successfully')

    try {
      const res = await fetch(`/api/noai/participants?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        // Rollback on error
        setParticipants(previousParticipants)
        const errorData = await res.json().catch(() => ({}))
        showError('Delete Failed', errorData.error?.message || `Server error: ${res.status}`)
        return
      }

      const data = await res.json()

      if (!data.success) {
        // Rollback on API error
        setParticipants(previousParticipants)
        showError('Delete Failed', data.error?.message || data.error || 'Failed to delete participant')
      }
    } catch (error) {
      // Rollback on network error
      setParticipants(previousParticipants)
      console.error('Error deleting:', error)
      showError('Error', 'Network error - please try again')
    }
  }

  const handleTogglePublish = async (participant: Participant) => {
    try {
      const res = await fetch('/api/noai/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: participant.id,
          is_published: !participant.is_published
        })
      })

      const data = await res.json()
      if (data.success) {
        // Optimistic update: Toggle in local state
        setParticipants(prev => prev.map(p =>
          p.id === participant.id ? { ...p, is_published: !p.is_published } : p
        ))
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const filteredParticipants = participants
    .filter(p => p.year === selectedYear)
    .sort((a, b) => a.display_order - b.display_order)

  const publishedCount = filteredParticipants.filter(p => p.is_published).length

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>NOAI Participants Management</h2>
            <p className="text-muted">Manage team members for each year</p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/admin/noai" className="btn btn-outline-secondary">
              <i className="icofont-arrow-left me-2"></i>
              Back
            </Link>
            <button
              onClick={handleAddNew}
              className="btn btn-primary"
            >
              <i className="icofont-plus me-2"></i>
              Add Participant
            </button>
          </div>
        </div>

        {/* Year Filter */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span className="fw-bold">Select Year:</span>
              {years.map(year => {
                const count = participants.filter(p => p.year === year && p.is_published).length
                const { archive, milestone } = getYearInfo(year)
                const hasArchive = !!archive
                return (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`btn btn-sm ${selectedYear === year ? 'btn-primary' : hasArchive ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                    title={hasArchive ? `Linked to: ${archive.title}` : milestone ? `Milestone: ${milestone.title}` : 'No archive/milestone'}
                  >
                    {year} ({count})
                    {hasArchive && <i className="icofont-check-circled ms-1"></i>}
                  </button>
                )
              })}
            </div>

            {/* Selected Year Info */}
            {(() => {
              const { archive, milestone } = getYearInfo(selectedYear)
              if (archive || milestone) {
                return (
                  <div className="mt-3">
                    {archive && (
                      <div className="d-inline-flex align-items-center me-3">
                        <span className="badge bg-success me-2">
                          <i className="icofont-archive me-1"></i>
                          Archive
                        </span>
                        <Link
                          href={`/noai/archive/${archive.slug}`}
                          target="_blank"
                          className="text-decoration-none"
                        >
                          {archive.title}
                          <i className="icofont-external-link ms-1"></i>
                        </Link>
                      </div>
                    )}
                    {milestone && (
                      <div className="d-inline-flex align-items-center">
                        <span className="badge bg-primary me-2">
                          <i className="icofont-chart-flow me-1"></i>
                          Timeline
                        </span>
                        <span>{milestone.title} - {milestone.subtitle}</span>
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <div className="alert alert-warning mt-3 mb-0 py-2">
                  <i className="icofont-warning me-2"></i>
                  <strong>No Archive/Timeline for {selectedYear}!</strong> Participants won&apos;t appear on an archive page.
                  <Link href="/admin/noai/timeline" className="ms-2">
                    Create a Timeline Milestone
                    <i className="icofont-arrow-right ms-1"></i>
                  </Link>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">{editingId ? 'Edit Participant' : 'Add New Participant'}</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Timeline / Archive <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={(() => {
                      // Find matching archive or milestone for current year
                      const { archive, milestone } = getYearInfo(formData.year)
                      if (archive) return `archive:${archive.id}`
                      if (milestone) return `milestone:${milestone.id}`
                      return `year:${formData.year}`
                    })()}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.startsWith('archive:')) {
                        const archiveId = value.replace('archive:', '')
                        const archive = archives.find(a => a.id === archiveId)
                        if (archive) {
                          setFormData({ ...formData, year: parseInt(archive.year || String(CURRENT_YEAR)) })
                        }
                      } else if (value.startsWith('milestone:')) {
                        const milestoneId = value.replace('milestone:', '')
                        const milestone = milestones.find(m => m.id === milestoneId)
                        if (milestone) {
                          const yearNum = parseInt(milestone.year.replace(/[^\d]/g, '').substring(0, 4))
                          setFormData({ ...formData, year: yearNum || CURRENT_YEAR })
                        }
                      } else if (value.startsWith('year:')) {
                        setFormData({ ...formData, year: parseInt(value.replace('year:', '')) })
                      }
                    }}
                  >
                    {/* Archives (preferred) */}
                    {archives.length > 0 && (
                      <optgroup label="📁 Archives (Recommended)">
                        {archives.map(archive => (
                          <option key={`archive:${archive.id}`} value={`archive:${archive.id}`}>
                            [{archive.year}] {archive.title}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* Timeline Milestones without archives */}
                    {milestones.filter(m => !archives.some(a => a.year === m.year)).length > 0 && (
                      <optgroup label="📅 Timeline Milestones (No Archive Yet)">
                        {milestones
                          .filter(m => !archives.some(a => a.year === m.year))
                          .map(milestone => (
                            <option key={`milestone:${milestone.id}`} value={`milestone:${milestone.id}`}>
                              [{milestone.year}] {milestone.subtitle}
                            </option>
                          ))}
                      </optgroup>
                    )}

                    {/* Years without any timeline/archive */}
                    <optgroup label="📆 Other Years (No Timeline)">
                      {years
                        .filter(year => {
                          const { archive, milestone } = getYearInfo(year)
                          return !archive && !milestone
                        })
                        .map(year => (
                          <option key={`year:${year}`} value={`year:${year}`}>
                            {year} (No archive/timeline)
                          </option>
                        ))}
                    </optgroup>
                  </select>

                  {/* Status indicator */}
                  {(() => {
                    const { archive, milestone } = getYearInfo(formData.year)
                    if (archive) {
                      return (
                        <small className="text-success d-block mt-1">
                          <i className="icofont-check-circled me-1"></i>
                          Will appear on: <strong>{archive.title}</strong> archive page
                        </small>
                      )
                    }
                    if (milestone) {
                      return (
                        <small className="text-primary d-block mt-1">
                          <i className="icofont-info-circle me-1"></i>
                          Linked to timeline: {milestone.subtitle}
                          <Link href="/admin/noai/archives" className="ms-2 text-decoration-none">
                            Create Archive →
                          </Link>
                        </small>
                      )
                    }
                    return (
                      <small className="text-warning d-block mt-1">
                        <i className="icofont-warning me-1"></i>
                        No archive - participant won&apos;t appear on archive pages
                        <Link href="/admin/noai/timeline" className="ms-2 text-decoration-none">
                          Create Timeline →
                        </Link>
                      </small>
                    )
                  })()}
                </div>

                <div className="col-md-2 mb-3">
                  <label className="form-label fw-bold">Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || CURRENT_YEAR })}
                    min="2024"
                    max="2030"
                  />
                  <small className="text-muted">Auto-filled</small>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Name (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">School (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder="e.g., Nairobi Academy"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Photo Upload (Required)</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <small className="text-muted d-block mt-1">
                  {uploading ? (
                    <span className="text-primary">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Compressing and uploading image...
                    </span>
                  ) : (
                    'Select an image file (max 10MB). Will be automatically compressed and optimized.'
                  )}
                </small>
                {formData.photo_url && (
                  <div className="mt-2">
                    <small className="text-success">
                      <i className="icofont-check-circled me-1"></i>
                      Image uploaded successfully
                    </small>
                  </div>
                )}
              </div>

              {formData.photo_url && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Preview</label>
                  <div>
                    <img
                      src={formData.photo_url}
                      alt="Preview"
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EInvalid URL%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">Bio (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief description about the participant (optional)"
                />
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Role</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>
                        {role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Achievement (Optional)</label>
                  <select
                    className="form-select"
                    value={formData.achievement}
                    onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                  >
                    <option value="">None</option>
                    {ACHIEVEMENTS.map(ach => (
                      <option key={ach} value={ach}>
                        {ach.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    min="0"
                  />
                  <small className="text-muted">Display order (lower numbers appear first)</small>
                </div>
              </div>

              <div className="mt-3 d-flex gap-2">
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                </button>
                <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row">
            {filteredParticipants.map((participant) => (
              <div key={participant.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div className="card h-100">
                  <img
                    src={participant.photo_url || '/images/placeholder.jpg'}
                    alt={participant.name || 'Participant'}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="card-body">
                    {participant.name && (
                      <h6 className="card-title">{participant.name}</h6>
                    )}
                    {participant.school && (
                      <p className="card-text small text-muted mb-1">{participant.school}</p>
                    )}
                    <p className="card-text small mb-2">
                      <span className="badge bg-primary">
                        {participant.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </p>
                    {participant.achievement && (
                      <span className="badge bg-warning text-dark mb-2">
                        {participant.achievement.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    )}
                  </div>
                  <div className="card-footer">
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        onClick={() => handleTogglePublish(participant)}
                        className={`btn btn-sm ${participant.is_published ? 'btn-success' : 'btn-secondary'}`}
                      >
                        {participant.is_published ? 'Published' : 'Draft'}
                      </button>
                      <button onClick={() => handleEdit(participant)} className="btn btn-sm btn-primary">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(participant.id)} className="btn btn-sm btn-danger">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredParticipants.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info">
                  <i className="icofont-info-circle me-2"></i>
                  No participants for year {selectedYear}. Click &quot;Add Participant&quot; to get started!
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
