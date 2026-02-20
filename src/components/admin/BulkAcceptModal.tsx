'use client'

import { useState, useEffect } from 'react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  description?: string
}

interface BulkAcceptModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onConfirm: (templateId?: string, sendEmail?: boolean) => void
}

export function BulkAcceptModal({
  isOpen,
  onClose,
  selectedCount,
  onConfirm
}: BulkAcceptModalProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/email-templates')
      const result = await response.json()

      if (result.success) {
        setTemplates(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onConfirm(selectedTemplate || undefined, sendEmail)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1050 }}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Bulk Accept Applications</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            <div className="modal-body">
              <p className="mb-3">
                You are about to accept <strong>{selectedCount}</strong> application(s).
              </p>

              {/* Send Email Toggle */}
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sendEmailCheck"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="sendEmailCheck">
                  Send acceptance email to applicants
                </label>
              </div>

              {/* Email Template Selector */}
              {sendEmail && (
                <div className="mb-3">
                  <label htmlFor="templateSelect" className="form-label">
                    Email Template (optional)
                  </label>
                  <select
                    id="templateSelect"
                    className="form-select"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Default acceptance email</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Leave as default to use standard acceptance message
                  </div>

                  {selectedTemplate && (
                    <div className="mt-2">
                      {templates.find(t => t.id === selectedTemplate)?.description && (
                        <small className="text-muted">
                          {templates.find(t => t.id === selectedTemplate)?.description}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!sendEmail && (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Applications will be accepted without sending emails
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirm}
              >
                <i className="bi bi-check-circle me-2"></i>
                Accept {selectedCount} Application{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
