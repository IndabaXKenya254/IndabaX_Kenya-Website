'use client'

// ═══════════════════════════════════════════════════════════════════════
// EXPERTISE MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage speaker expertise areas

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert, Pagination, SearchFilter } from '@/components/admin/ui'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'
import { useAdminExpertise } from '@/hooks/useAdminApi'

interface Expertise {
  id: string
  name: string
  slug: string
  created_at?: string
  usage_count?: number
}

export default function ExpertiseManagementPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [alert, setAlert] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingExpertise, setEditingExpertise] = useState<Expertise | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '' })

  // React Query hook - automatic caching and deduplication
  const filters = useMemo(() => ({
    search: searchTerm.trim() || undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  }), [searchTerm, itemsPerPage, currentPage])

  const { data: expertise, isLoading: loading, refetch } = useAdminExpertise(filters)
  const totalItems = !expertise || expertise.length === 0 ? 0 : expertise.length // Note: API needs to return count for accurate pagination

  function openCreateModal() {
    setEditingExpertise(null)
    setFormData({ name: '', slug: '' })
    setShowCreateModal(true)
  }

  function openEditModal(exp: Expertise) {
    setEditingExpertise(exp)
    setFormData({ name: exp.name, slug: exp.slug })
    setShowCreateModal(true)
  }

  function closeModal() {
    setShowCreateModal(false)
    setEditingExpertise(null)
    setFormData({ name: '', slug: '' })
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function handleNameChange(name: string) {
    setFormData({
      name,
      slug: generateSlug(name)
    })
  }

  async function handleSaveExpertise(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim() || !formData.slug.trim()) {
      setAlert({ type: 'danger', message: 'Name and slug are required' })
      return
    }

    try {
      let result
      if (editingExpertise) {
        result = await adminApi.expertise.update(editingExpertise.id, formData)
      } else {
        result = await adminApi.expertise.create(formData)
      }

      if (result.success) {
        showSuccess(
          editingExpertise ? 'Expertise Updated!' : 'Expertise Created!',
          `Expertise "${formData.name}" has been ${editingExpertise ? 'updated' : 'created'} successfully`
        )
        closeModal()
        refetch()
      } else {
        setAlert({ type: 'danger', message: result.error || `Failed to ${editingExpertise ? 'update' : 'create'} expertise` })
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred while saving the expertise' })
    }
  }

  async function handleDeleteExpertise(exp: Expertise) {
    const confirmed = await showConfirm(
      'Delete Expertise?',
      `Are you sure you want to delete "${exp.name}"? ${exp.usage_count ? `This expertise is used by ${exp.usage_count} speakers.` : ''}`,
      'warning'
    )

    if (!confirmed) return

    try {
      const result = await adminApi.expertise.delete(exp.id)

      if (result.success) {
        showSuccess('Expertise Deleted!', `Expertise "${exp.name}" has been deleted successfully`)
        refetch()
      } else {
        showError('Delete Failed', result.error || 'Failed to delete expertise')
      }
    } catch (error) {
      showError('Error', 'An error occurred while deleting the expertise')
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Expertise Management</h2>
            <p className="text-muted">Manage speaker expertise areas</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-success"
              onClick={openCreateModal}
              disabled={loading}
            >
              <i className="icofont-plus me-2"></i>
              Create New Expertise
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search expertise by name..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
        />

        {/* Expertise List */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading expertise areas...</p>
              </div>
            ) : !expertise || expertise.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="icofont-brain" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">No expertise areas found</p>
                <button className="btn btn-success mt-2" onClick={openCreateModal}>
                  Create Your First Expertise Area
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Usage</th>
                      <th>Created</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(expertise || []).map((exp) => (
                      <tr key={exp.id}>
                        <td>
                          <span className="badge bg-success">{exp.name}</span>
                        </td>
                        <td>
                          <code>{exp.slug}</code>
                        </td>
                        <td>
                          {exp.usage_count !== undefined ? (
                            <span className="badge bg-secondary">{exp.usage_count} speakers</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {exp.created_at ? new Date(exp.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-success"
                              onClick={() => openEditModal(exp)}
                              title="Edit expertise"
                            >
                              <i className="icofont-edit"></i>
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteExpertise(exp)}
                              title="Delete expertise"
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
            )}

            {!loading && totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage)}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="card mt-4 border-success">
          <div className="card-body">
            <h5 className="card-title">
              <i className="icofont-info-circle me-2"></i>
              About Expertise Areas
            </h5>
            <p className="mb-0">
              Expertise areas help categorize speakers by their fields of knowledge and specialization.
              These areas can be assigned to speakers when creating or editing their profiles.
            </p>
            <hr />
            <small className="text-muted">
              <strong>Examples:</strong> Machine Learning, Natural Language Processing, Computer Vision,
              Data Science, AI Ethics, Robotics, Deep Learning, etc.
            </small>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSaveExpertise}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingExpertise ? 'Edit Expertise Area' : 'Create New Expertise Area'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                    disabled={loading}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Expertise Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Machine Learning"
                      required
                      disabled={loading}
                      autoFocus
                    />
                    <small className="text-muted">The display name of the expertise area</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Slug <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g. machine-learning"
                      required
                      disabled={loading}
                    />
                    <small className="text-muted">URL-friendly version (auto-generated)</small>
                  </div>

                  <div className="alert alert-success">
                    <i className="icofont-info-circle me-2"></i>
                    This expertise area will be available when creating or editing speakers
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
                    className="btn btn-success"
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
                        {editingExpertise ? 'Update Expertise' : 'Create Expertise'}
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
