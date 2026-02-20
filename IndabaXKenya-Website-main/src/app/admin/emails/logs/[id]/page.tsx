'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL LOG DETAIL PAGE (PHASE 7 - DAY 3)
// ═══════════════════════════════════════════════════════════════════════
// View details of a single email log

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { EmailViewer } from '@/components/admin/EmailViewer'

interface EmailLog {
  id: string
  from_email: string
  recipient_email: string
  recipient_name: string | null
  cc_emails: string[] | null
  bcc_emails: string[] | null
  subject: string
  body: string
  status: string
  error_message: string | null
  attempts: number
  sent_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string | null
  template_id: string | null
  variables_used: Record<string, any> | null
  sent_by: string | null
  event_id: string | null
  registration_id: string | null
  email_templates?: {
    id: string
    name: string
    subject: string
  }
  user_profiles?: {
    id: string
    name: string
    email: string
  }
  events?: {
    id: string
    title: string
  }
  registrations?: {
    id: string
    user_id: string
  }
}

export default function EmailLogDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [log, setLog] = useState<EmailLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchLog()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchLog = async () => {
    try {
      const response = await fetch(`/api/admin/emails/logs/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setLog(result.data)
      } else {
        setError(result.error || 'Failed to fetch email log')
      }
    } catch (err) {
      console.error('Failed to fetch email log:', err)
      setError('Failed to fetch email log')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badgeClass = {
      sent: 'bg-success',
      pending: 'bg-warning',
      failed: 'bg-danger',
      delivered: 'bg-primary'
    }[status] || 'bg-secondary'

    return <span className={`badge ${badgeClass}`}>{status}</span>
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Loading email log...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !log) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="alert alert-danger">
            <i className="icofont-warning me-2"></i>
            {error || 'Email log not found'}
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => router.push('/admin/emails/logs')}
          >
            <i className="icofont-arrow-left me-2"></i>
            Back to Email Logs
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button
              className="btn btn-link text-decoration-none p-0 mb-2"
              onClick={() => router.push('/admin/emails/logs')}
            >
              <i className="icofont-arrow-left me-2"></i>
              Back to Email Logs
            </button>
            <h2 className="mb-1">Email Log Details</h2>
            <p className="text-muted mb-0">
              {log.recipient_name || log.recipient_email}
            </p>
          </div>
          {getStatusBadge(log.status)}
        </div>

        {/* Main Content */}
        <div className="row">
          {/* Left Column - Email Details */}
          <div className="col-lg-7 col-xl-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="icofont-email me-2"></i>
                  Email Content
                </h5>
              </div>
              <div className="card-body">
                {/* Subject */}
                <div className="mb-4">
                  <label className="text-muted small">Subject</label>
                  <h5>{log.subject}</h5>
                </div>

                {/* Recipients */}
                <div className="mb-4">
                  <label className="text-muted small">From</label>
                  <p className="mb-0">{log.from_email}</p>
                </div>

                <div className="mb-4">
                  <label className="text-muted small">To</label>
                  <p className="mb-0">
                    {log.recipient_name && <strong>{log.recipient_name} </strong>}
                    &lt;{log.recipient_email}&gt;
                  </p>
                </div>

                {log.cc_emails && log.cc_emails.length > 0 && (
                  <div className="mb-4">
                    <label className="text-muted small">CC</label>
                    <p className="mb-0">{log.cc_emails.join(', ')}</p>
                  </div>
                )}

                {log.bcc_emails && log.bcc_emails.length > 0 && (
                  <div className="mb-4">
                    <label className="text-muted small">BCC</label>
                    <p className="mb-0">{log.bcc_emails.join(', ')}</p>
                  </div>
                )}

                {/* Body */}
                <div className="mb-3">
                  <label className="text-muted small d-block mb-2">Email Body</label>
                  <EmailViewer htmlContent={log.body} />
                </div>
              </div>
            </div>

            {/* Variables Used */}
            {log.variables_used && Object.keys(log.variables_used).length > 0 && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="icofont-code me-2"></i>
                    Variables Used
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Variable</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(log.variables_used).map(([key, value]) => (
                        <tr key={key}>
                          <td><code>{key}</code></td>
                          <td>{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="col-lg-5 col-xl-4">
            {/* Status Info */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="icofont-info-circle me-2"></i>
                  Delivery Status
                </h5>
              </div>
              {/* Issue #38 FIX: Compact grid layout for delivery status */}
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="text-muted small d-block">Status</label>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block">Attempts</label>
                    <span>{log.attempts}</span>
                  </div>
                </div>

                {log.error_message && (
                  <div className="mb-3">
                    <label className="text-muted small">Error Message</label>
                    <div className="alert alert-danger mb-0 py-2 small" style={{ wordBreak: 'break-word' }}>
                      {log.error_message}
                    </div>
                  </div>
                )}

                <div className="row mb-2">
                  <div className="col-12">
                    <label className="text-muted small d-block">Created</label>
                    <small>{new Date(log.created_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</small>
                  </div>
                </div>

                {log.sent_at && (
                  <div className="row mb-2">
                    <div className="col-12">
                      <label className="text-muted small d-block">Sent</label>
                      <small>{new Date(log.sent_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</small>
                    </div>
                  </div>
                )}

                {log.delivered_at && (
                  <div className="row mb-2">
                    <div className="col-12">
                      <label className="text-muted small d-block">Delivered</label>
                      <small>{new Date(log.delivered_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Information */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="icofont-link me-2"></i>
                  Related Information
                </h5>
              </div>
              <div className="card-body">
                {log.email_templates && (
                  <div className="mb-3">
                    <label className="text-muted small">Template</label>
                    <p className="mb-0">
                      <a
                        href={`/admin/email-templates/${log.template_id}`}
                        className="text-decoration-none"
                      >
                        {log.email_templates.name}
                      </a>
                    </p>
                  </div>
                )}

                {log.user_profiles && (
                  <div className="mb-3">
                    <label className="text-muted small">Sent By</label>
                    <p className="mb-0">
                      {log.user_profiles.name}
                      <br />
                      <small className="text-muted">{log.user_profiles.email}</small>
                    </p>
                  </div>
                )}

                {log.events && (
                  <div className="mb-3">
                    <label className="text-muted small">Related Event</label>
                    <p className="mb-0">
                      <a
                        href={`/admin/events/${log.event_id}`}
                        className="text-decoration-none"
                      >
                        {log.events.title}
                      </a>
                    </p>
                  </div>
                )}

                {log.registration_id && (
                  <div className="mb-3">
                    <label className="text-muted small">Registration ID</label>
                    <p className="mb-0">
                      <code className="small">{log.registration_id}</code>
                    </p>
                  </div>
                )}

                {!log.email_templates && !log.user_profiles && !log.events && !log.registration_id && (
                  <p className="text-muted mb-0 small">No related information</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
