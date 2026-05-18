'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { Alert } from '@/components/admin/ui'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError } from '@/lib/sweetalert'

interface Application {
  id: string
  event_id?: string
  application_type: 'registration' | 'call_for_papers'

  // Personal Info
  name: string
  email: string
  phone?: string
  organization?: string
  country?: string

  // Registration Specific
  ticket_type?: 'general' | 'student' | 'speaker'
  dietary_requirements?: string
  tshirt_size?: string
  accessibility_needs?: string

  // Call for Papers Specific
  presentation_type?: 'talk' | 'workshop' | 'poster'
  presentation_title?: string
  abstract?: string
  keywords?: string
  track?: string
  bio?: string
  linkedin_url?: string
  file_url?: string

  // Status
  status: 'pending' | 'accepted' | 'rejected'
  admin_notes?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string

  // Relations
  event?: { title: string }
}

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [notes, setNotes] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadApplication() }, [params.id])

  const loadApplication = async () => {
    setLoading(true)
    const result = await adminApi.applications.get(params.id as string)
    if (result.success && result.data) {
      const app = result.data as Application
      setApplication(app)
      setNotes(app.admin_notes || '')
    } else {
      setAlert({ type: 'danger', message: result.error || 'Failed to load application' })
    }
    setLoading(false)
  }

  const handleStatusChange = async (status: 'accepted' | 'rejected' | 'pending') => {
    setUpdating(true)
    try {
      const result = await adminApi.applications.update(params.id as string, {
        status,
        admin_notes: notes
      })

      if (result.success) {
        showSuccess(
          'Status Updated!',
          `Application has been ${status}`
        )
        loadApplication()
      } else {
        showError('Update Failed', result.error || 'Failed to update status')
      }
    } catch (error) {
      showError('Error', 'An error occurred while updating status')
    }
    setUpdating(false)
  }

  const handleSaveNotes = async () => {
    if (!application) return

    setUpdating(true)
    try {
      const result = await adminApi.applications.update(params.id as string, {
        status: application.status,
        admin_notes: notes,
      })

      if (result.success) {
        showSuccess('Notes Saved!', 'Admin notes have been updated')
        loadApplication()
      } else {
        showError('Save Failed', result.error || 'Failed to save notes')
      }
    } catch (error) {
      showError('Error', 'An error occurred while saving notes')
    }
    setUpdating(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-success'
      case 'rejected': return 'bg-danger'
      case 'pending': return 'bg-warning'
      default: return 'bg-secondary'
    }
  }

  const getTypeBadgeClass = (type: string) => {
    return type === 'registration' ? 'bg-primary' : 'bg-info'
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading application...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!application) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid">
          <div className="alert alert-danger">
            <i className="icofont-warning-alt me-2"></i>
            Application not found
          </div>
          <button className="btn btn-secondary" onClick={() => router.push('/admin/applications')}>
            ← Back to Applications
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const isRegistration = application.application_type === 'registration'
  const isCallForPapers = application.application_type === 'call_for_papers'

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-8">
            <h2>
              <i className="icofont-paper me-2"></i>
              Application Details
            </h2>
            <div className="mt-2">
              <span className={`badge ${getTypeBadgeClass(application.application_type)} me-2`}>
                {application.application_type.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`badge ${getStatusBadgeClass(application.status)}`}>
                {application.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="col-md-4 text-md-end">
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/admin/applications')}
            >
              <i className="icofont-arrow-left me-2"></i>
              Back to Applications
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="row">
          <div className="col-lg-8">
            {/* Personal Information */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="icofont-user me-2"></i>
                  Personal Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Full Name</label>
                    <p className="mb-0"><strong>{application.name}</strong></p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Email Address</label>
                    <p className="mb-0">
                      <a href={`mailto:${application.email}`}>{application.email}</a>
                    </p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Phone Number</label>
                    <p className="mb-0">{application.phone || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Country</label>
                    <p className="mb-0">{application.country || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small">Organization/Institution</label>
                  <p className="mb-0">{application.organization || 'N/A'}</p>
                </div>

                {isCallForPapers && application.linkedin_url && (
                  <div className="mb-3">
                    <label className="form-label text-muted small">LinkedIn Profile</label>
                    <p className="mb-0">
                      <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <i className="icofont-linkedin me-2"></i>
                        {application.linkedin_url}
                      </a>
                    </p>
                  </div>
                )}

                {isCallForPapers && application.bio && (
                  <div className="mb-3">
                    <label className="form-label text-muted small">Bio</label>
                    <p className="mb-0 text-justify">{application.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Event Registration Details */}
            {isRegistration && (
              <div className="card mb-4">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="icofont-ticket me-2"></i>
                    Registration Details
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Ticket Type</label>
                      <p className="mb-0">
                        <span className="badge bg-primary">
                          {application.ticket_type?.toUpperCase() || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small">T-Shirt Size</label>
                      <p className="mb-0">{application.tshirt_size?.toUpperCase() || 'N/A'}</p>
                    </div>
                  </div>

                  {application.dietary_requirements && (
                    <div className="mb-3">
                      <label className="form-label text-muted small">Dietary Requirements</label>
                      <p className="mb-0">{application.dietary_requirements}</p>
                    </div>
                  )}

                  {application.accessibility_needs && (
                    <div className="mb-3">
                      <label className="form-label text-muted small">Accessibility Needs</label>
                      <p className="mb-0">{application.accessibility_needs}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Call for Papers Details */}
            {isCallForPapers && (
              <div className="card mb-4">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="icofont-presentation me-2"></i>
                    Presentation Details
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Presentation Type</label>
                      <p className="mb-0">
                        <span className="badge bg-info">
                          {application.presentation_type?.toUpperCase() || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Track</label>
                      <p className="mb-0">{application.track || 'N/A'}</p>
                    </div>
                  </div>

                  {application.presentation_title && (
                    <div className="mb-3">
                      <label className="form-label text-muted small">Presentation Title</label>
                      <h6 className="mb-0">{application.presentation_title}</h6>
                    </div>
                  )}

                  {application.abstract && (
                    <div className="mb-3">
                      <label className="form-label text-muted small">Abstract</label>
                      <p className="mb-0 text-justify">{application.abstract}</p>
                    </div>
                  )}

                  {application.keywords && (
                    <div className="mb-3">
                      <label className="form-label text-muted small">Keywords</label>
                      <p className="mb-0">
                        {application.keywords.split(',').map((keyword, idx) => (
                          <span key={idx} className="badge bg-secondary me-1">
                            {keyword.trim()}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}

                  {application.file_url && (
                    <div className="mb-3">
                      <label className="form-label text-muted small">Attached File</label>
                      <p className="mb-0">
                        <a
                          href={application.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="icofont-file-pdf me-2"></i>
                          View/Download File
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="card mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">
                  <i className="icofont-clock-time me-2"></i>
                  Metadata
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Submitted At</label>
                    <p className="mb-0">{formatDate(application.submitted_at)}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Reviewed At</label>
                    <p className="mb-0">{formatDate(application.reviewed_at)}</p>
                  </div>
                </div>

                {application.event && (
                  <div className="mb-3">
                    <label className="form-label text-muted small">Event</label>
                    <p className="mb-0">
                      <i className="icofont-calendar me-2"></i>
                      {application.event.title}
                    </p>
                  </div>
                )}

                <div className="mb-0">
                  <label className="form-label text-muted small">Application ID</label>
                  <p className="mb-0">
                    <code>{application.id}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Status & Actions */}
            <div className="card mb-4 sticky-top" style={{ top: '20px' }}>
              <div className="card-header bg-dark text-white">
                <h5 className="mb-0">
                  <i className="icofont-flag me-2"></i>
                  Status & Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-muted small">Current Status</label>
                  <div>
                    <span className={`badge ${getStatusBadgeClass(application.status)} fs-6`}>
                      {application.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <hr />

                <label className="form-label text-muted small">Change Status</label>
                <div className="d-grid gap-2 mb-4">
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange('accepted')}
                    disabled={updating || application.status === 'accepted'}
                  >
                    <i className="icofont-check-circled me-2"></i>
                    Accept
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleStatusChange('rejected')}
                    disabled={updating || application.status === 'rejected'}
                  >
                    <i className="icofont-close-circled me-2"></i>
                    Reject
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={() => handleStatusChange('pending')}
                    disabled={updating || application.status === 'pending'}
                  >
                    <i className="icofont-clock-time me-2"></i>
                    Set Pending
                  </button>
                </div>

                <hr />

                {/* Admin Notes */}
                <label className="form-label text-muted small">Admin Notes</label>
                <textarea
                  className="form-control mb-3"
                  rows={8}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this application..."
                  disabled={updating}
                />
                <button
                  className="btn btn-primary w-100"
                  onClick={handleSaveNotes}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="icofont-save me-2"></i>
                      Save Notes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
