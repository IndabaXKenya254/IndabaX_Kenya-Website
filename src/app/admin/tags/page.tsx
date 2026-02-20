'use client'

// ═══════════════════════════════════════════════════════════════════════
// TAGS MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage event tags and post tags

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert, Pagination, SearchFilter } from '@/components/admin/ui'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'
import { useAdminEventTags, useAdminPostTags } from '@/hooks/useAdminApi'

interface Tag {
  id: string
  name: string
  slug: string
  created_at?: string
  usage_count?: number
}

export default function TagsManagementPage() {
  const [activeTab, setActiveTab] = useState<'event' | 'post'>('event')
  const [eventCurrentPage, setEventCurrentPage] = useState(1)
  const [postCurrentPage, setPostCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [alert, setAlert] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '' })

  // React Query hooks - both are called, React Query caches them
  const { data: eventTagsData, isLoading: eventLoading, refetch: refetchEvent } = useAdminEventTags()
  const { data: postTagsData, isLoading: postLoading, refetch: refetchPost } = useAdminPostTags()

  // Derive current view data based on active tab
  const currentTags = activeTab === 'event' ? (eventTagsData || []) : (postTagsData || [])
  const loading = activeTab === 'event' ? eventLoading : postLoading
  const eventTotalItems = !eventTagsData || eventTagsData.length === 0 ? 0 : eventTagsData.length
  const postTotalItems = !postTagsData || postTagsData.length === 0 ? 0 : postTagsData.length
  const refetch = activeTab === 'event' ? refetchEvent : refetchPost

  function openCreateModal() {
    setEditingTag(null)
    setFormData({ name: '', slug: '' })
    setShowCreateModal(true)
  }

  function openEditModal(tag: Tag) {
    setEditingTag(tag)
    setFormData({ name: tag.name, slug: tag.slug })
    setShowCreateModal(true)
  }

  function closeModal() {
    setShowCreateModal(false)
    setEditingTag(null)
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

  async function handleSaveTag(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim() || !formData.slug.trim()) {
      setAlert({ type: 'danger', message: 'Name and slug are required' })
      return
    }

    try {
      const endpoint = activeTab === 'event'
        ? adminApi.tags.events
        : adminApi.tags.posts

      let result
      if (editingTag) {
        result = await endpoint.update(editingTag.id, formData)
      } else {
        result = await endpoint.create(formData)
      }

      if (result.success) {
        showSuccess(
          editingTag ? 'Tag Updated!' : 'Tag Created!',
          `Tag "${formData.name}" has been ${editingTag ? 'updated' : 'created'} successfully`
        )
        closeModal()
        refetch()
      } else {
        setAlert({ type: 'danger', message: result.error || `Failed to ${editingTag ? 'update' : 'create'} tag` })
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred while saving the tag' })
    }
  }

  async function handleDeleteTag(tag: Tag) {
    const confirmed = await showConfirm(
      'Delete Tag?',
      `Are you sure you want to delete "${tag.name}"? ${tag.usage_count ? `This tag is used in ${tag.usage_count} items.` : ''}`,
      'warning'
    )

    if (!confirmed) return

    try {
      const endpoint = activeTab === 'event'
        ? adminApi.tags.events
        : adminApi.tags.posts

      const result = await endpoint.delete(tag.id)

      if (result.success) {
        showSuccess('Tag Deleted!', `Tag "${tag.name}" has been deleted successfully`)
        refetch()
      } else {
        showError('Delete Failed', result.error || 'Failed to delete tag')
      }
    } catch (error) {
      showError('Error', 'An error occurred while deleting the tag')
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Tags Management</h2>
            <p className="text-muted">Manage event tags and post tags</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
              disabled={loading}
            >
              <i className="icofont-plus me-2"></i>
              Create New Tag
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search tags by name..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={activeTab === 'event' ? eventTotalItems : postTotalItems}
        />

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'event' ? 'active' : ''}`}
              onClick={() => setActiveTab('event')}
              disabled={loading}
            >
              Event Tags ({!eventTagsData || eventTagsData.length === 0 ? 0 : eventTagsData.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'post' ? 'active' : ''}`}
              onClick={() => setActiveTab('post')}
              disabled={loading}
            >
              Post Tags ({!postTagsData || postTagsData.length === 0 ? 0 : postTagsData.length})
            </button>
          </li>
        </ul>

        {/* Tags List */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading tags...</p>
              </div>
            ) : !currentTags || currentTags.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="icofont-tags" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">No {activeTab} tags found</p>
                <button className="btn btn-primary mt-2" onClick={openCreateModal}>
                  Create Your First Tag
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
                    {(currentTags || []).map((tag) => (
                      <tr key={tag.id}>
                        <td>
                          <span className="badge bg-primary">{tag.name}</span>
                        </td>
                        <td>
                          <code>{tag.slug}</code>
                        </td>
                        <td>
                          {tag.usage_count !== undefined ? (
                            <span className="badge bg-secondary">{tag.usage_count} items</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {tag.created_at ? new Date(tag.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-primary"
                              onClick={() => openEditModal(tag)}
                              title="Edit tag"
                            >
                              <i className="icofont-edit"></i>
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteTag(tag)}
                              title="Delete tag"
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

            {!loading && ((activeTab === 'event' && eventTotalItems > 0) || (activeTab === 'post' && postTotalItems > 0)) && (
              <Pagination
                currentPage={activeTab === 'event' ? eventCurrentPage : postCurrentPage}
                totalPages={Math.ceil((activeTab === 'event' ? eventTotalItems : postTotalItems) / itemsPerPage)}
                onPageChange={(page) => activeTab === 'event' ? setEventCurrentPage(page) : setPostCurrentPage(page)}
                totalItems={activeTab === 'event' ? eventTotalItems : postTotalItems}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSaveTag}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingTag ? 'Edit Tag' : 'Create New Tag'}
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
                      Tag Name <span className="text-danger">*</span>
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
                    <small className="text-muted">The display name of the tag</small>
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

                  <div className="alert alert-info">
                    <i className="icofont-info-circle me-2"></i>
                    This tag will be available for {activeTab === 'event' ? 'events' : 'posts'}
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
                        {editingTag ? 'Update Tag' : 'Create Tag'}
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
