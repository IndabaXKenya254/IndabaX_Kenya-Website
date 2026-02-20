'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - STATS ADMIN PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage homepage stats/fun facts with preview and active/inactive toggles

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'
import type { Stat } from '@/app/api/stats/route'
import { useAdminStats } from '@/hooks/useAdminApi'

export default function AdminStatsPage() {
  // React Query hook - automatic caching and deduplication
  const { data: stats, isLoading: loading, refetch } = useAdminStats()

  const [showPreview, setShowPreview] = useState(false)
  const [editingStat, setEditingStat] = useState<Stat | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    value: 0,
    suffix: '',
    icon: 'icofont-chart-bar-graph',
    color: '#006700',
    display_order: 0,
    is_active: true,
  })

  const handleDelete = async (stat: Stat) => {
    const confirmed = await showDeleteConfirmation(`"${stat.label}"`)
    if (!confirmed) return

    showLoading('Deleting stat...')

    try {
      const result = await adminApi.stats.delete(stat.id)
      closeAlert()

      if (result.success) {
        showSuccess('Deleted!', 'Stat has been deleted successfully', 2000)
        refetch()
      } else {
        showError('Delete Failed', result.error || 'Failed to delete stat')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'An unexpected error occurred while deleting')
    }
  }

  const handleToggleActive = async (stat: Stat) => {
    try {
      const result = await adminApi.stats.update(stat.id, {
        is_active: !stat.is_active
      })

      if (result.success) {
        showSuccess('Updated!', `Stat ${stat.is_active ? 'deactivated' : 'activated'}`, 1500)
        refetch()
      } else {
        showError('Update Failed', result.error || 'Failed to toggle status')
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred')
    }
  }

  const openCreateForm = () => {
    setEditingStat(null)
    setFormData({
      label: '',
      value: 0,
      suffix: '',
      icon: 'icofont-chart-bar-graph',
      color: '#006700',
      display_order: 0,
      is_active: true,
    })
    setShowForm(true)
  }

  const openEditForm = (stat: Stat) => {
    setEditingStat(stat)
    setFormData({
      label: stat.label,
      value: stat.value,
      suffix: stat.suffix,
      icon: stat.icon,
      color: stat.color,
      display_order: stat.display_order,
      is_active: stat.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.label || formData.value === undefined) {
      showError('Validation Error', 'Label and value are required')
      return
    }

    showLoading(editingStat ? 'Updating stat...' : 'Creating stat...')

    try {
      const result = editingStat
        ? await adminApi.stats.update(editingStat.id, formData)
        : await adminApi.stats.create(formData)

      closeAlert()

      if (result.success) {
        showSuccess('Success!', `Stat ${editingStat ? 'updated' : 'created'} successfully`, 2000)
        setShowForm(false)
        refetch()
      } else {
        showError('Failed', result.error || 'Failed to save stat')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'An unexpected error occurred')
    }
  }

  // Common icon options
  const iconOptions = [
    'icofont-users-alt-4',
    'icofont-microphone',
    'icofont-globe',
    'icofont-calendar',
    'icofont-chart-bar-graph',
    'icofont-network',
    'icofont-trophy',
    'icofont-ui-office',
  ]

  // Common color options - Tech-Forward Palette
  const colorOptions = [
    '#006700', // Primary Green (brand)
    '#91C1C5', // Soft Teal (tech)
    '#BE511F', // Burnt Orange (energy)
    '#e2b273', // Muted Gold (prestige)
    '#02000D', // Dark Navy (professional)
    '#00ba00', // Bright Green (success)
    '#f86c2c', // Bright Orange (warning)
    '#B80101', // Red (error)
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Statistics / Fun Facts</h2>
            <p className="text-muted">Manage homepage statistics counter</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-primary me-2"
              onClick={() => setShowPreview(!showPreview)}
            >
              <i className="icofont-eye"></i> {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            <button
              className="btn btn-primary"
              onClick={openCreateForm}
            >
              <span className="me-2">➕</span>
              Create Stat
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="icofont-eye me-2"></i>
                Homepage Preview (Active Stats Only)
              </h5>
            </div>
            <div className="card-body" style={{ backgroundColor: '#f8f9fa', padding: '3rem 1rem' }}>
              <div className="row g-4 text-center">
                {(stats || []).filter(stat => stat.is_active).map((stat) => (
                  <div key={stat.id} className="col-lg-3 col-md-6">
                    <div className="funfact-item" style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <i className={stat.icon} style={{ fontSize: '3rem', color: stat.color, marginBottom: '1rem' }}></i>
                      <h3 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: stat.color, marginBottom: '0.5rem' }}>
                        {stat.value}{stat.suffix}
                      </h3>
                      <p style={{ fontSize: '1rem', color: '#6c757d', marginBottom: 0 }}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats List */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : !stats || stats.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No stats found. Create your first stat to get started!</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Icon</th>
                      <th>Label</th>
                      <th>Value</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((stat) => (
                      <tr key={stat.id}>
                        <td>
                          <i className={stat.icon} style={{ fontSize: '2rem', color: stat.color }}></i>
                        </td>
                        <td>
                          <strong>{stat.label}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>
                            {stat.value}{stat.suffix}
                          </span>
                        </td>
                        <td>{stat.display_order}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={stat.is_active}
                              onChange={() => handleToggleActive(stat)}
                            />
                            <label className="form-check-label">
                              {stat.is_active ? 'Active' : 'Inactive'}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => openEditForm(stat)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(stat)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingStat ? 'Edit Stat' : 'Create Stat'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-8">
                        <label className="form-label">Label *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.label}
                          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g., Attendees, Speakers, Countries"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Display Order</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.display_order}
                          onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Value *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: parseInt(e.target.value) }))}
                          placeholder="e.g., 500"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Suffix</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.suffix}
                          onChange={(e) => setFormData(prev => ({ ...prev, suffix: e.target.value }))}
                          placeholder="e.g., +, K, M (optional)"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Icon (Icofont class)</label>
                      <select
                        className="form-select mb-2"
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      >
                        {iconOptions.map(icon => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">Or enter custom Icofont class:</small>
                      <input
                        type="text"
                        className="form-control mt-1"
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="icofont-..."
                      />
                      <div className="mt-2 text-center">
                        <i className={formData.icon} style={{ fontSize: '3rem', color: formData.color }}></i>
                        <div className="text-muted small">Preview</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Color</label>
                      <div className="d-flex gap-2 mb-2">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`btn ${formData.color === color ? 'border-dark' : ''}`}
                            style={{ width: '40px', height: '40px', backgroundColor: color, padding: 0 }}
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#006700"
                      />
                    </div>

                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      />
                      <label className="form-check-label">Active (show on website)</label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingStat ? 'Update' : 'Create'} Stat
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
