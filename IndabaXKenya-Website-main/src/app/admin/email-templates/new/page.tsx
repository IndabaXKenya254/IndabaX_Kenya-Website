'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - NEW EMAIL TEMPLATE PAGE (PHASE 7)
// ═══════════════════════════════════════════════════════════════════════
// Create new email template

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuillEditor } from '@/components/QuillEditor'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default function NewEmailTemplatePage() {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    bodyContent: '',
    description: '',
    category: 'custom',
    variables: '{{name}}, {{email}}, {{event_title}}'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const variablesArray = formData.variables
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)

      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables: variablesArray
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('Template created successfully!')
        router.push('/admin/email-templates')
      } else {
        alert(result.error || 'Failed to create template')
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  const commonVariables = [
    { key: '{{name}}', label: 'Name' },
    { key: '{{email}}', label: 'Email' },
    { key: '{{event_title}}', label: 'Event Title' },
    { key: '{{event_date}}', label: 'Event Date' },
    { key: '{{event_location}}', label: 'Event Location' },
    { key: '{{survey_link}}', label: 'Survey Link' },
    { key: '{{ticket_link}}', label: 'Ticket Link' },
    { key: '{{ticket_number}}', label: 'Ticket Number' },
    { key: '{{check_in_time}}', label: 'Check-In Time' }, // Issue #28
    { key: '{{deadline}}', label: 'Deadline' },
    { key: '{{dashboard_link}}', label: 'Dashboard Link' },
    { key: '{{application_reference}}', label: 'App Reference (15 chars)' }, // Issue #22: Shortened reference
    { key: '{{application_id}}', label: 'Full Application ID' }
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Create Email Template</h2>
            <p className="text-muted mb-0">Create a reusable email template with variables</p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => router.back()}
          >
            <i className="icofont-arrow-left me-2"></i>
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-lg-8">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Template Details</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Template Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="custom">Custom</option>
                      <option value="application">Application</option>
                      <option value="survey">Survey</option>
                      <option value="ticketing">Ticketing</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email Subject <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email Body <span className="text-danger">*</span></label>
                    <QuillEditor
                      value={formData.bodyContent}
                      onChange={(value) => setFormData({ ...formData, bodyContent: value })}
                      height="400px"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Available Variables</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.variables}
                      onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    />
                    <small className="text-muted">Comma-separated</small>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => router.back()}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="icofont-check me-2"></i>
                          Create Template
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card sticky-top" style={{ top: '90px', zIndex: 100 }}>
                <div className="card-header">
                  <h6 className="mb-0">Quick Variables</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-2">
                    {commonVariables.map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(variable.key)
                          alert(`Copied: ${variable.key}`)
                        }}
                      >
                        {variable.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
