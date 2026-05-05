'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PRICING TIERS ADMIN PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage pricing tiers with preview and active/inactive toggles

import { useState } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'
import type { PricingTier } from '@/app/api/pricing/route'
import { useAdminPricing } from '@/hooks/useAdminApi'

export default function AdminPricingPage() {
  // React Query hook - automatic caching and deduplication
  const { data: pricingTiers, isLoading: loading, refetch } = useAdminPricing()

  const [showPreview, setShowPreview] = useState(false)
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    currency: 'KSH',
    period: '3 Days',
    description: '',
    featured: false,
    badge: '',
    features: [] as string[],
    requirements: [] as string[],
    button_text: 'Register Now',
    button_link: '/register',
    display_order: 0,
    is_active: true,
  })

  const [featureInput, setFeatureInput] = useState('')
  const [requirementInput, setRequirementInput] = useState('')

  const handleDelete = async (tier: PricingTier) => {
    const confirmed = await showDeleteConfirmation(`"${tier.title}"`)
    if (!confirmed) return

    showLoading('Deleting pricing tier...')

    try {
      const result = await adminApi.pricing.delete(tier.id)
      closeAlert()

      if (result.success) {
        showSuccess('Deleted!', 'Pricing tier has been deleted successfully', 2000)
        refetch()
      } else {
        showError('Delete Failed', result.error || 'Failed to delete pricing tier')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'An unexpected error occurred while deleting')
    }
  }

  const handleToggleActive = async (tier: PricingTier) => {
    try {
      const result = await adminApi.pricing.update(tier.id, {
        is_active: !tier.is_active
      })

      if (result.success) {
        showSuccess('Updated!', `Pricing tier ${tier.is_active ? 'deactivated' : 'activated'}`, 1500)
        refetch()
      } else {
        showError('Update Failed', result.error || 'Failed to toggle status')
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred')
    }
  }

  const openCreateForm = () => {
    setEditingTier(null)
    setFormData({
      title: '',
      price: '',
      currency: 'KSH',
      period: '3 Days',
      description: '',
      featured: false,
      badge: '',
      features: [],
      requirements: [],
      button_text: 'Register Now',
      button_link: '/register',
      display_order: 0,
      is_active: true,
    })
    setShowForm(true)
  }

  const openEditForm = (tier: PricingTier) => {
    setEditingTier(tier)
    setFormData({
      title: tier.title,
      price: tier.price,
      currency: tier.currency,
      period: tier.period,
      description: tier.description || '',
      featured: tier.featured,
      badge: tier.badge || '',
      features: tier.features || [],
      requirements: tier.requirements || [],
      button_text: tier.button_text,
      button_link: tier.button_link,
      display_order: tier.display_order,
      is_active: tier.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.price || formData.features.length === 0) {
      showError('Validation Error', 'Title, price, and at least one feature are required')
      return
    }

    showLoading(editingTier ? 'Updating pricing tier...' : 'Creating pricing tier...')

    try {
      const result = editingTier
        ? await adminApi.pricing.update(editingTier.id, formData)
        : await adminApi.pricing.create(formData)

      closeAlert()

      if (result.success) {
        showSuccess('Success!', `Pricing tier ${editingTier ? 'updated' : 'created'} successfully`, 2000)
        setShowForm(false)
        refetch()
      } else {
        showError('Failed', result.error || 'Failed to save pricing tier')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'An unexpected error occurred')
    }
  }

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }))
      setFeatureInput('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }))
      setRequirementInput('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Pricing Tiers</h2>
            <p className="text-muted">Manage conference registration pricing</p>
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
              Create Pricing Tier
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="icofont-eye me-2"></i>
                Homepage Preview (Active Tiers Only)
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                {(pricingTiers || []).filter(tier => tier.is_active).map((tier) => (
                  <div key={tier.id} className="col-lg-3 col-md-6">
                    <div className={`pricing-item ${tier.featured ? 'featured' : ''}`} style={{ position: 'relative', border: tier.featured ? '2px solid #007bff' : '1px solid #dee2e6', borderRadius: '8px', padding: '2rem', backgroundColor: '#fff' }}>
                      {tier.badge && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#007bff', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          {tier.badge}
                        </div>
                      )}
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{tier.title}</h3>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff', marginBottom: '0.5rem' }}>
                        {tier.price === 'FREE' ? 'FREE' : `${tier.currency} ${tier.price}`}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1.5rem' }}>
                        {tier.period}
                      </div>
                      {tier.description && (
                        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1.5rem' }}>
                          {tier.description}
                        </p>
                      )}
                      <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                        {tier.features.map((feature: string, idx: number) => (
                          <li key={idx} style={{ fontSize: '0.875rem', marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <i className="icofont-check" style={{ position: 'absolute', left: 0, color: '#28a745' }}></i>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {tier.requirements && tier.requirements.length > 0 && (
                        <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '1rem', marginTop: '1rem' }}>
                          <small style={{ fontWeight: 'bold', color: '#6c757d' }}>Requirements:</small>
                          <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                            {tier.requirements.map((req: string, idx: number) => (
                              <li key={idx} style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem', paddingLeft: '1rem', position: 'relative' }}>
                                <i className="icofont-info-circle" style={{ position: 'absolute', left: 0 }}></i>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button className="btn btn-primary btn-block w-100" style={{ marginTop: '1rem' }}>
                        {tier.button_text}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tiers List */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : !pricingTiers || pricingTiers.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No pricing tiers found. Create your first pricing tier to get started!</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Features</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingTiers.map((tier) => (
                      <tr key={tier.id}>
                        <td>
                          <strong>{tier.title}</strong>
                          {tier.featured && <span className="badge bg-primary ms-2">Featured</span>}
                          {tier.badge && <span className="badge bg-info ms-2">{tier.badge}</span>}
                        </td>
                        <td>
                          {tier.price === 'FREE' ? 'FREE' : `${tier.currency} ${tier.price}`}
                          <div className="text-muted small">{tier.period}</div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{tier.features?.length || 0} features</span>
                          {tier.requirements && tier.requirements.length > 0 && (
                            <span className="badge bg-warning ms-1">{tier.requirements.length} requirements</span>
                          )}
                        </td>
                        <td>{tier.display_order}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={tier.is_active}
                              onChange={() => handleToggleActive(tier)}
                            />
                            <label className="form-check-label">
                              {tier.is_active ? 'Active' : 'Inactive'}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => openEditForm(tier)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(tier)}
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
            <div className="modal-dialog modal-lg modal-dialog-scrollable" style={{ maxWidth: '95%', margin: '0.5rem auto' }}>
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingTier ? 'Edit Pricing Tier' : 'Create Pricing Tier'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-8">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                      <div className="col-md-4">
                        <label className="form-label">Price *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="FREE or 5,000"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Currency</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.currency}
                          onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Period</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.period}
                          onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Badge (optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.badge}
                          onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                          placeholder="Most Popular, New, etc."
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch mt-4">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={formData.featured}
                            onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                          />
                          <label className="form-check-label">Featured (highlight with border)</label>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Features * (at least one required)</label>
                      <div className="input-group mb-2">
                        <input
                          type="text"
                          className="form-control"
                          value={featureInput}
                          onChange={(e) => setFeatureInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                          placeholder="Type a feature and press Add"
                        />
                        <button type="button" className="btn btn-primary" onClick={addFeature}>
                          Add
                        </button>
                      </div>
                      <ul className="list-group">
                        {formData.features.map((feature, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                            <span><i className="icofont-check text-success me-2"></i>{feature}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeFeature(idx)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Requirements (optional)</label>
                      <div className="input-group mb-2">
                        <input
                          type="text"
                          className="form-control"
                          value={requirementInput}
                          onChange={(e) => setRequirementInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                          placeholder="Type a requirement and press Add"
                        />
                        <button type="button" className="btn btn-primary" onClick={addRequirement}>
                          Add
                        </button>
                      </div>
                      <ul className="list-group">
                        {formData.requirements.map((req, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                            <span><i className="icofont-info-circle text-warning me-2"></i>{req}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeRequirement(idx)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Button Text</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.button_text}
                          onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Button Link</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.button_link}
                          onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                        />
                      </div>
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
                      {editingTier ? 'Update' : 'Create'} Pricing Tier
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
