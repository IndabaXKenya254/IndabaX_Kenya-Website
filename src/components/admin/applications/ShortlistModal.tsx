'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SHORTLIST MODAL (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Modal for bulk shortlisting with survey template selector and deadline picker

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SurveyTemplate {
  id: string
  name: string
  description: string | null
  usage_type: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  category: string
}

interface ShortlistModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (surveyTemplateId: string, deadlineDays: number, emailTemplateId: string | null) => void
  selectedCount: number
}

export function ShortlistModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount
}: ShortlistModalProps) {
  const [surveyTemplates, setSurveyTemplates] = useState<SurveyTemplate[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState<string>('none')
  const [deadlineDays, setDeadlineDays] = useState(7)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch survey templates and email templates on mount
  useEffect(() => {
    if (isOpen) {
      fetchSurveyTemplates()
      fetchEmailTemplates()
    }
  }, [isOpen])

  const fetchSurveyTemplates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Issue #29b FIX: Fetch ALL templates so admin can select any template type
      const response = await fetch('/api/admin/form-templates')
      const result = await response.json()

      if (result.success) {
        const templates = result.data || []
        setSurveyTemplates(templates)

        // Auto-select if only one template
        if (templates.length === 1) {
          setSelectedTemplateId(templates[0].id)
        }
      } else {
        setError('Failed to fetch survey templates')
        console.error('Failed to fetch survey templates:', result.error)
      }
    } catch (error) {
      setError('Failed to fetch survey templates')
      console.error('Failed to fetch survey templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      const result = await response.json()

      if (result.success) {
        // Filter to only show shortlist/survey invitation templates
        const shortlistTemplates = result.data.filter(
          (t: EmailTemplate) => t.category === 'shortlist' || t.category === 'survey'
        )
        setEmailTemplates(shortlistTemplates || [])
      } else {
        console.error('Failed to fetch email templates:', result.error)
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error)
    }
  }

  const handleConfirm = () => {
    if (!selectedTemplateId) {
      setError('Please select a survey template')
      return
    }

    const emailTemplateId = selectedEmailTemplateId === 'none' ? null : selectedEmailTemplateId
    onConfirm(selectedTemplateId, deadlineDays, emailTemplateId)
    onClose()
  }

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const selectedTemplate = surveyTemplates.find(t => t.id === selectedTemplateId)

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="icofont-check-circled me-2"></i>
                Shortlist Applications
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            <div className="modal-body">
              {/* Summary */}
              <div className="alert alert-info">
                <i className="icofont-info-circle me-2"></i>
                You are about to shortlist <strong>{selectedCount}</strong> application(s) and send them a survey to complete.
              </div>

              {error && (
                <div className="alert alert-danger">
                  <i className="icofont-warning me-2"></i>
                  {error}
                </div>
              )}

              {/* Survey Template Selection (REQUIRED) */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="icofont-file-document me-2"></i>
                  Survey Template <span className="text-danger">*</span>
                </label>
                <p className="text-muted small mb-2">
                  Select the survey form that shortlisted applicants will need to complete.
                </p>

                {isLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted small mt-2">Loading survey templates...</p>
                  </div>
                ) : surveyTemplates.length === 0 ? (
                  <div className="alert alert-warning">
                    <i className="icofont-warning me-2"></i>
                    <strong>No survey templates found!</strong>
                    <p className="mb-2 small">You need to create a survey template before shortlisting applicants.</p>
                    <Link href="/admin/form-templates/new" className="btn btn-warning btn-sm">
                      <i className="icofont-plus me-1"></i>
                      Create Survey Template
                    </Link>
                  </div>
                ) : (
                  <select
                    className={`form-select ${!selectedTemplateId ? 'border-warning' : ''}`}
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value)
                      setError(null)
                    }}
                    required
                  >
                    <option value="">-- Select a survey template --</option>
                    {surveyTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                )}

                {selectedTemplate && (
                  <div className="mt-2 p-2 bg-light rounded">
                    <small className="text-muted">
                      <i className="icofont-info-circle me-1"></i>
                      {selectedTemplate.description || 'No description available'}
                    </small>
                  </div>
                )}
              </div>

              {/* Email Template Selection */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="icofont-email me-2"></i>
                  Email Template
                </label>
                <p className="text-muted small mb-2">
                  Select an email template for the shortlist notification, or use the default message.
                </p>

                <select
                  className="form-select"
                  value={selectedEmailTemplateId}
                  onChange={(e) => setSelectedEmailTemplateId(e.target.value)}
                >
                  <option value="none">Use Default Email</option>
                  {emailTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.subject}
                    </option>
                  ))}
                </select>

                {emailTemplates.length === 0 && (
                  <div className="alert alert-info small mt-2">
                    <i className="icofont-info-circle me-1"></i>
                    No shortlist email templates found. <Link href="/admin/email-templates/new" className="alert-link">Create one</Link> with category &quot;shortlist&quot; or &quot;survey&quot;.
                  </div>
                )}
              </div>

              {/* Deadline Picker */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  <i className="icofont-calendar me-2"></i>
                  Survey Deadline
                </label>
                <p className="text-muted small mb-2">
                  Number of days applicants have to complete the survey.
                </p>

                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <input
                    type="number"
                    className="form-control"
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="30"
                  />
                  <span className="input-group-text">days</span>
                </div>

                <small className="text-muted">
                  Deadline: {new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </small>
              </div>

              {/* Summary of Actions */}
              <div className="border-top pt-3 mt-3">
                <h6 className="fw-bold mb-2">What will happen:</h6>
                <ul className="mb-0">
                  <li>Applications will be marked as <span className="badge bg-info">Shortlisted</span></li>
                  <li>Survey emails will be sent to all {selectedCount} applicant(s)</li>
                  <li>Status will update to <span className="badge bg-primary">Survey Sent</span> after email delivery</li>
                  <li>Applicants will have {deadlineDays} day(s) to complete the survey</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                <i className="icofont-close me-2"></i>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={isLoading || !selectedTemplateId || surveyTemplates.length === 0}
              >
                <i className="icofont-check me-2"></i>
                Confirm Shortlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
