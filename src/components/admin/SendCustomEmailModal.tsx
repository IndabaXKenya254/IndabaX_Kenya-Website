'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const QuillEditor = dynamic(() => import('@/components/QuillEditor').then(mod => mod.QuillEditor), {
  ssr: false,
  loading: () => <div>Loading editor...</div>
})

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  description?: string
}

interface SendCustomEmailModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  recipientName: string
  recipientEmail: string
  onSuccess?: () => void
}

export function SendCustomEmailModal({
  isOpen,
  onClose,
  applicationId,
  recipientName,
  recipientEmail,
  onSuccess
}: SendCustomEmailModalProps): JSX.Element | null {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ccEmails, setCcEmails] = useState('')
  const [bccEmails, setBccEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    if (templateId) {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        setSubject(template.subject)
        setBody(template.body)
      }
    } else {
      setSubject('')
      setBody('')
    }
  }

  const handleSend = async () => {
    if (!subject || !body) {
      setError('Subject and body are required')
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate || undefined,
          subject,
          body,
          cc_emails: ccEmails ? ccEmails.split(',').map(e => e.trim()).filter(e => e) : undefined,
          bcc_emails: bccEmails ? bccEmails.split(',').map(e => e.trim()).filter(e => e) : undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess?.()
        onClose()
        // Reset form
        setSelectedTemplate('')
        setSubject('')
        setBody('')
        setCcEmails('')
        setBccEmails('')
      } else {
        setError(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Send email error:', error)
      setError('An error occurred while sending email')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (!sending) {
      onClose()
      setError(null)
    }
  }

  if (!isOpen) return null

  return (
    <React.Fragment>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={handleClose}
        style={{ zIndex: 1050 }}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-envelope me-2"></i>
                Send Custom Email
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                aria-label="Close"
                disabled={sending}
              />
            </div>

            <div className="modal-body">
              {/* Recipient Info */}
              <div className="alert alert-info mb-3">
                <strong>To:</strong> {recipientName} ({recipientEmail})
              </div>

              {error && (
                <div className="alert alert-danger mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {/* Template Selector */}
              <div className="mb-3">
                <label htmlFor="templateSelect" className="form-label">
                  Use Email Template (Optional)
                </label>
                <select
                  id="templateSelect"
                  className="form-select"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  disabled={loading || sending}
                >
                  <option value="">Write custom email from scratch</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="form-text">
                    {templates.find(t => t.id === selectedTemplate)?.description}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className="mb-3">
                <label htmlFor="subject" className="form-label">
                  Subject <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  className="form-control"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  disabled={sending}
                />
              </div>

              {/* Body */}
              <div className="mb-3">
                <label className="form-label">
                  Message <span className="text-danger">*</span>
                </label>
                <QuillEditor
                  value={body}
                  onChange={setBody}
                  height="300px"
                  disabled={sending}
                />
                <div className="form-text mt-2">
                  <strong>Available variables:</strong> {'{{name}}, {{email}}, {{event_title}}, {{event_date}}, {{event_location}}, {{status}}'}
                </div>
              </div>

              {/* CC/BCC */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="ccEmails" className="form-label">
                    CC (Optional)
                  </label>
                  <input
                    type="text"
                    id="ccEmails"
                    className="form-control"
                    value={ccEmails}
                    onChange={(e) => setCcEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    disabled={sending}
                  />
                  <div className="form-text">Comma-separated email addresses</div>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="bccEmails" className="form-label">
                    BCC (Optional)
                  </label>
                  <input
                    type="text"
                    id="bccEmails"
                    className="form-control"
                    value={bccEmails}
                    onChange={(e) => setBccEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    disabled={sending}
                  />
                  <div className="form-text">Comma-separated email addresses</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSend}
                disabled={sending || !subject || !body}
              >
                {sending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
