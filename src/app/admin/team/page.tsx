'use client'

// ═══════════════════════════════════════════════════════════════════════
// TEAM MEMBERS MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { Alert, Pagination, SearchFilter, FileUpload } from '@/components/admin/ui'
import { EventSelector } from '@/components/admin/selectors'
import { showSuccess, showError, showConfirm, showLoading, closeAlert, showValidationError } from '@/lib/sweetalert'
import { useAdminTeam } from '@/hooks/useAdminApi'

interface TeamMember {
  id: string
  name: string
  role: string
  photo_url?: string | null
  bio?: string | null
  linkedin_url?: string | null
  twitter_url?: string | null
  display_order: number
  is_active: boolean
}

export default function TeamManagementPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<string>('')
  const [alert, setAlert] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // React Query hook - automatic caching and deduplication
  const filters = useMemo(() => ({
    search: searchTerm.trim() || undefined,
    is_active: filterActive !== '' ? (filterActive === 'true') : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  }), [searchTerm, filterActive, itemsPerPage, currentPage])

  const { data: team, isLoading: loading, refetch } = useAdminTeam(filters)
  const totalItems = !team || team.length === 0 ? 0 : team.length

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    photo_url: '',
    bio: '',
    linkedin_url: '',
    twitter_url: '',
    display_order: 0,
    is_active: true,
    event_ids: [] as string[]
  })

  function openCreateModal() {
    setEditingMember(null)
    setFormData({
      name: '',
      role: '',
      photo_url: '',
      bio: '',
      linkedin_url: '',
      twitter_url: '',
      display_order: 0,
      is_active: true,
      event_ids: []
    })
    setShowModal(true)
  }

  async function openEditModal(member: TeamMember) {
    setEditingMember(member)
    setFormData({
      name: member.name,
      role: member.role,
      photo_url: member.photo_url || '',
      bio: member.bio || '',
      linkedin_url: member.linkedin_url || '',
      twitter_url: member.twitter_url || '',
      display_order: member.display_order,
      is_active: member.is_active,
      event_ids: [] // Will be populated below
    })
    setShowModal(true)

    // Fetch linked events for this team member
    try {
      const res = await fetch(`/api/admin/team/${member.id}/events`, { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          setFormData(prev => ({ ...prev, event_ids: result.data.map((e: any) => e.event_id) }))
        }
      }
    } catch (error) {
      console.error('Failed to load linked events:', error)
      // Non-critical - user can still edit without event data
    }
  }

  function closeModal() {
    setShowModal(false)
    setEditingMember(null)
  }

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  async function handleFileSelect(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload/team-photo', {
        method: 'POST',
        body: fd,
        credentials: 'include'
      })
      const result = await res.json()

      if (result.success) {
        setFormData(prev => ({ ...prev, photo_url: result.data.url }))
        showSuccess('Photo Uploaded!', 'Photo uploaded successfully', 1500)
      } else {
        showError('Upload Failed', result.error?.message || 'Failed to upload photo')
      }
    } catch (error) {
      showError('Upload Error', 'An error occurred while uploading photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    // Validation
    const errors: string[] = []
    if (!formData.name.trim()) errors.push('Name is required')
    if (!formData.role.trim()) errors.push('Role is required')
    if (formData.linkedin_url && !formData.linkedin_url.startsWith('http')) {
      errors.push('LinkedIn URL must be a valid URL (starting with http:// or https://)')
    }
    if (formData.twitter_url && !formData.twitter_url.startsWith('http')) {
      errors.push('Twitter URL must be a valid URL (starting with http:// or https://)')
    }

    if (errors.length > 0) {
      showValidationError(errors)
      return
    }

    setSaving(true)
    showLoading(editingMember ? 'Updating team member...' : 'Adding team member...')

    try {
      const body = editingMember ? { id: editingMember.id, ...formData } : formData

      const response = await fetch('/api/admin/team', {
        method: editingMember ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()
      closeAlert()

      if (result.success) {
        showSuccess(
          editingMember ? 'Team Member Updated!' : 'Team Member Added!',
          `${formData.name} has been ${editingMember ? 'updated' : 'added'} successfully`
        )
        closeModal()
        refetch()
      } else {
        const errorMessage = typeof result.error === 'object'
          ? (result.error?.message || JSON.stringify(result.error))
          : (result.error || 'Failed to save team member')
        showError('Save Failed', errorMessage)
      }
    } catch (error) {
      closeAlert()
      console.error('Save team member error:', error)
      showError('Error', 'An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(member: TeamMember) {
    const confirmed = await showConfirm(
      'Delete Team Member?',
      `Are you sure you want to delete "${member.name}"? This action cannot be undone.`,
      'warning'
    )

    if (!confirmed) return

    showLoading('Deleting team member...')

    try {
      const response = await fetch(`/api/admin/team?id=${member.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      closeAlert()

      if (result.success) {
        showSuccess('Deleted!', `${member.name} has been removed from the team`)
        refetch()
      } else {
        const errorMessage = typeof result.error === 'object'
          ? (result.error?.message || JSON.stringify(result.error))
          : (result.error || 'Failed to delete team member')
        showError('Delete Failed', errorMessage)
      }
    } catch (error) {
      closeAlert()
      console.error('Delete team member error:', error)
      showError('Error', 'An error occurred while deleting')
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>
              <i className="icofont-users-alt-5 me-2"></i>
              Team Management
            </h2>
            <p className="text-muted">Manage organizing team members</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button className="btn btn-primary" onClick={openCreateModal} disabled={loading}>
              <i className="icofont-plus me-2"></i>
              Add Team Member
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="row mb-3">
          <div className="col-md-8">
            <SearchFilter
              searchPlaceholder="Search team members by name or role..."
              onSearchChange={setSearchTerm}
              currentItemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small">Filter by Status</label>
            <select className="form-select" value={filterActive} onChange={(e) => setFilterActive(e.target.value)} disabled={loading}>
              <option value="">All Members</option>
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
            <p className="mt-3 text-muted">Loading team members...</p>
          </div>
        ) : !team || team.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5 text-muted">
              <i className="icofont-users-alt-5" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3">No team members found</p>
              <button className="btn btn-primary mt-2" onClick={openCreateModal}>
                Add Your First Team Member
              </button>
            </div>
          </div>
        ) : (
          <div className="row">
            {(team || []).map((member) => (
              <div key={member.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        {member.photo_url && (
                          <img src={member.photo_url} alt={member.name} className="rounded-circle me-3" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                        )}
                        <div>
                          <h5 className="mb-1">{member.name}</h5>
                          <p className="text-muted small mb-0">{member.role}</p>
                        </div>
                      </div>
                      {!member.is_active && <span className="badge bg-secondary">Inactive</span>}
                    </div>

                    {member.bio && (
                      <p className="small text-muted mb-2">
                        {member.bio.length > 100 ? `${member.bio.substring(0, 100)}...` : member.bio}
                      </p>
                    )}

                    <div className="mb-3">
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary me-2">
                          <i className="icofont-linkedin"></i>
                        </a>
                      )}
                      {member.twitter_url && (
                        <a href={member.twitter_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                          <i className="icofont-twitter"></i>
                        </a>
                      )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Order: {member.display_order}</small>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-primary" onClick={() => openEditModal(member)} title="Edit">
                          <i className="icofont-edit"></i>
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(member)} title="Delete">
                          <i className="icofont-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingMember ? 'Edit Team Member' : 'Add Team Member'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving || uploading}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label className="form-label">Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required disabled={saving || uploading} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Display Order</label>
                      <input type="number" className="form-control" name="display_order" value={formData.display_order} onChange={handleChange} min="0" disabled={saving || uploading} />
                      <small className="text-muted">Lower numbers appear first</small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Role <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="role" value={formData.role} onChange={handleChange} placeholder="Conference Chair" required disabled={saving || uploading} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Photo</label>
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept="image/*"
                      maxSize={5 * 1024 * 1024}
                      preview
                      currentUrl={formData.photo_url}
                      label={uploading ? 'Uploading...' : 'Upload Photo'}
                      disabled={saving || uploading}
                    />
                    <small className="text-muted d-block mt-2">Professional headshot recommended (Max 5MB)</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Bio</label>
                    <textarea className="form-control" name="bio" value={formData.bio} onChange={handleChange} rows={4} placeholder="Brief background and expertise..." disabled={saving || uploading} />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">LinkedIn URL</label>
                      <input type="url" className="form-control" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/username" disabled={saving || uploading} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Twitter URL</label>
                      <input type="url" className="form-control" name="twitter_url" value={formData.twitter_url} onChange={handleChange} placeholder="https://twitter.com/username" disabled={saving || uploading} />
                    </div>
                  </div>

                  <div className="mb-3">
                    <EventSelector
                      selectedIds={formData.event_ids}
                      onChange={(event_ids) => setFormData(prev => ({ ...prev, event_ids }))}
                      label="Link to Events"
                      disabled={saving || uploading}
                    />
                  </div>

                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} disabled={saving || uploading} />
                    <label className="form-check-label" htmlFor="is_active">
                      Active (visible on public team page)
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving || uploading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {editingMember ? 'Updating...' : 'Creating...'}
                      </>
                    ) : uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading Photo...
                      </>
                    ) : (
                      <>
                        <i className="icofont-check me-2"></i>
                        {editingMember ? 'Update Member' : 'Create Member'}
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
