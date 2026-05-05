'use client'

// ═══════════════════════════════════════════════════════════════════════
// ADMIN: Email Recipients Management (CC/BCC)
// ═══════════════════════════════════════════════════════════════════════
// Manage email addresses that receive CC/BCC copies of system emails
// Created: December 28, 2025
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'
import type { EmailRecipient } from '@/types/api'

const RECIPIENT_TYPES = [
  { value: 'cc', label: 'CC (Carbon Copy)', description: 'Visible to all recipients' },
  { value: 'bcc', label: 'BCC (Blind Carbon Copy)', description: 'Hidden from other recipients' },
]

const EMAIL_CATEGORIES = [
  { value: 'all', label: 'All Emails', description: 'Receive all system emails' },
  { value: 'applications', label: 'Applications', description: 'Application submissions and updates' },
  { value: 'registrations', label: 'Registrations', description: 'Event registrations' },
  { value: 'notifications', label: 'Notifications', description: 'General notifications' },
  { value: 'support', label: 'Support', description: 'Contact form submissions' },
]

export default function EmailRecipientsPage() {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState<EmailRecipient | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    recipient_type: 'cc' as 'cc' | 'bcc',
    email_category: 'all' as EmailRecipient['email_category'],
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  // Fetch recipients
  const fetchRecipients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email-recipients', { credentials: 'include' })
      const result = await response.json()

      if (result.success) {
        setRecipients(result.data)
      } else {
        showError('Error', result.error || 'Failed to load email recipients')
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
      showError('Error', 'Failed to load email recipients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipients()
  }, [])

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      recipient_type: 'cc',
      email_category: 'all',
      is_active: true,
    })
    setEditingRecipient(null)
  }

  // Open modal for new recipient
  const handleAdd = () => {
    resetForm()
    setShowModal(true)
  }

  // Open modal for editing
  const handleEdit = (recipient: EmailRecipient) => {
    setEditingRecipient(recipient)
    setFormData({
      email: recipient.email,
      name: recipient.name || '',
      recipient_type: recipient.recipient_type,
      email_category: recipient.email_category,
      is_active: recipient.is_active,
    })
    setShowModal(true)
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingRecipient
        ? `/api/admin/email-recipients/${editingRecipient.id}`
        : '/api/admin/email-recipients'

      const method = editingRecipient ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        showSuccess('Success', editingRecipient ? 'Email recipient updated!' : 'Email recipient added!')
        setShowModal(false)
        resetForm()
        fetchRecipients()
      } else {
        showError('Error', result.error || 'Failed to save email recipient')
      }
    } catch (error) {
      console.error('Error saving recipient:', error)
      showError('Error', 'Failed to save email recipient')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async (recipient: EmailRecipient) => {
    const confirmed = await showDeleteConfirmation(`"${recipient.email}"`)
    if (!confirmed) return

    showLoading('Deleting...')

    try {
      const response = await fetch(`/api/admin/email-recipients/${recipient.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      closeAlert()
      const result = await response.json()

      if (result.success) {
        showSuccess('Deleted', 'Email recipient removed successfully')
        fetchRecipients()
      } else {
        showError('Error', result.error || 'Failed to delete email recipient')
      }
    } catch (error) {
      closeAlert()
      console.error('Error deleting recipient:', error)
      showError('Error', 'Failed to delete email recipient')
    }
  }

  // Toggle active status
  const handleToggleActive = async (recipient: EmailRecipient) => {
    try {
      const response = await fetch(`/api/admin/email-recipients/${recipient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !recipient.is_active }),
      })

      const result = await response.json()

      if (result.success) {
        showSuccess('Updated', `Email recipient ${recipient.is_active ? 'disabled' : 'enabled'}`)
        fetchRecipients()
      } else {
        showError('Error', result.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      showError('Error', 'Failed to update status')
    }
  }

  // Group recipients by category
  const groupedRecipients = EMAIL_CATEGORIES.map(category => ({
    ...category,
    recipients: recipients.filter(r => r.email_category === category.value),
  }))

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-8">
            <h2>
              <i className="icofont-envelope me-2"></i>
              Email Recipients (CC/BCC)
            </h2>
            <p className="text-muted">
              Manage email addresses that receive copies of system emails for team tracking and collaboration.
            </p>
          </div>
          <div className="col-md-4 text-md-end">
            <button className="btn btn-primary" onClick={handleAdd}>
              <i className="icofont-plus me-2"></i>
              Add Recipient
            </button>
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert alert-info mb-4">
          <i className="icofont-info-circle me-2"></i>
          <strong>How it works:</strong> Email addresses added here will automatically receive CC or BCC copies of
          system emails (applications, registrations, etc.) so your team can track and respond to communications.
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading email recipients...</p>
          </div>
        )}

        {/* Recipients List */}
        {!loading && (
          <div className="row">
            {groupedRecipients.map(category => (
              <div key={category.value} className="col-lg-6 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">{category.label}</h5>
                      <small className="opacity-75">{category.description}</small>
                    </div>
                    <span className="badge bg-light text-primary">
                      {category.recipients.length}
                    </span>
                  </div>
                  <div className="card-body">
                    {category.recipients.length === 0 ? (
                      <p className="text-muted text-center py-3">
                        <i className="icofont-inbox d-block mb-2" style={{ fontSize: '2rem' }}></i>
                        No recipients for this category
                      </p>
                    ) : (
                      <div className="list-group list-group-flush">
                        {category.recipients.map(recipient => (
                          <div
                            key={recipient.id}
                            className={`list-group-item d-flex justify-content-between align-items-center ${!recipient.is_active ? 'opacity-50' : ''}`}
                          >
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className={`badge ${recipient.recipient_type === 'cc' ? 'bg-success' : 'bg-secondary'}`}
                                >
                                  {recipient.recipient_type.toUpperCase()}
                                </span>
                                <strong>{recipient.email}</strong>
                                {!recipient.is_active && (
                                  <span className="badge bg-warning text-dark">Disabled</span>
                                )}
                              </div>
                              {recipient.name && (
                                <small className="text-muted">{recipient.name}</small>
                              )}
                            </div>
                            <div className="btn-group btn-group-sm">
                              <button
                                className={`btn ${recipient.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                onClick={() => handleToggleActive(recipient)}
                                title={recipient.is_active ? 'Disable' : 'Enable'}
                              >
                                <i className={`icofont-${recipient.is_active ? 'eye-blocked' : 'eye'}`}></i>
                              </button>
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleEdit(recipient)}
                                title="Edit"
                              >
                                <i className="icofont-edit"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(recipient)}
                                title="Delete"
                              >
                                <i className="icofont-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingRecipient ? 'Edit Email Recipient' : 'Add Email Recipient'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {/* Email */}
                    <div className="mb-3">
                      <label className="form-label">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="team@example.com"
                        required
                      />
                    </div>

                    {/* Name */}
                    <div className="mb-3">
                      <label className="form-label">Display Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                      <small className="text-muted">Optional - helps identify the recipient</small>
                    </div>

                    {/* Recipient Type */}
                    <div className="mb-3">
                      <label className="form-label">
                        Recipient Type <span className="text-danger">*</span>
                      </label>
                      <div className="row">
                        {RECIPIENT_TYPES.map(type => (
                          <div key={type.value} className="col-6">
                            <div
                              className={`card cursor-pointer ${formData.recipient_type === type.value ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setFormData({ ...formData, recipient_type: type.value as 'cc' | 'bcc' })}
                            >
                              <div className="card-body py-2 px-3">
                                <div className="form-check mb-0">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="recipient_type"
                                    checked={formData.recipient_type === type.value}
                                    onChange={() => setFormData({ ...formData, recipient_type: type.value as 'cc' | 'bcc' })}
                                  />
                                  <label className="form-check-label">
                                    <strong>{type.label}</strong>
                                    <br />
                                    <small className="text-muted">{type.description}</small>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Email Category */}
                    <div className="mb-3">
                      <label className="form-label">
                        Email Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.email_category}
                        onChange={(e) => setFormData({ ...formData, email_category: e.target.value as EmailRecipient['email_category'] })}
                        required
                      >
                        {EMAIL_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label} - {cat.description}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">
                        Choose which types of emails this recipient should receive
                      </small>
                    </div>

                    {/* Active Toggle */}
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="is_active">
                        Active (receives emails)
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      disabled={saving}
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
                          {editingRecipient ? 'Update' : 'Add'} Recipient
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
