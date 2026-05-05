'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { Alert, FileUpload } from '@/components/admin/ui'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { ExpertiseSelector, EventSelector } from '@/components/admin/selectors'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError } from '@/lib/sweetalert'

export default function CreateSpeakerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '', // Job title
    bio_short: '', // Short bio/excerpt
    bio_full: '', // Full biography
    organization: '',
    linkedin_url: '',
    photo_url: '',
    speaker_year: new Date().getFullYear(), // Default to current year
    force_previous: false, // When true, shows as "previous" regardless of year
    expertise_ids: [] as string[],
    event_ids: [] as string[]
  })

  const handleChange = (e: any) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleBioFullChange = (value: string) => {
    setFormData(prev => ({ ...prev, bio_full: value }))
  }

  const handleFileSelect = async (file: File) => {
    setUploadingImage(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/upload/speaker-photo', { method: 'POST', body: fd, credentials: 'include' })
      const result = await res.json()
      if (result.success && result.data?.url) {
        setFormData(prev => ({ ...prev, photo_url: result.data.url }))
        showSuccess('Image Uploaded!', 'Speaker photo uploaded successfully')
      } else {
        showError('Upload Failed', result.error || 'Failed to upload photo')
      }
    } catch (error) {
      showError('Upload Error', 'An error occurred while uploading the photo')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    const result = await adminApi.speakers.create(formData)
    if (result.success) {
      setAlert({ type: 'success', message: 'Speaker created!' })
      setTimeout(() => router.push('/admin/speakers'), 1500)
    } else {
      setAlert({ type: 'danger', message: result.error })
      setLoading(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6"><h2>Add Speaker</h2></div>
          <div className="col-md-6 text-md-end">
            <button className="btn btn-secondary" onClick={() => router.push('/admin/speakers')}>← Back</button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-8">
                  {/* Name and Year Row */}
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label className="form-label">Name *</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Speaker Year</label>
                      <input
                        type="number"
                        className="form-control"
                        name="speaker_year"
                        value={formData.speaker_year}
                        onChange={handleChange}
                        min="2020"
                        max="2030"
                        placeholder="2025"
                      />
                      <small className="text-muted">Year participated</small>
                    </div>
                  </div>

                  {/* Force Previous Toggle */}
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="force_previous"
                        checked={formData.force_previous}
                        onChange={(e) => setFormData(prev => ({ ...prev, force_previous: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="force_previous">
                        <strong>Mark as Previous/Past Speaker</strong>
                      </label>
                    </div>
                    <small className="text-muted">
                      When enabled, this speaker will show as "previous" in the UI regardless of year.
                      Use this to prep for the new year before Jan 1st.
                    </small>
                  </div>

                  {/* Title (Job Title) */}
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Senior Data Scientist, ML Engineer, Professor of AI"
                    />
                    <small className="text-muted">Job title or professional designation</small>
                  </div>

                  {/* Organization */}
                  <div className="mb-3">
                    <label className="form-label">Organization</label>
                    <input type="text" className="form-control" name="organization" value={formData.organization} onChange={handleChange} />
                  </div>

                  {/* Short Bio */}
                  <div className="mb-3">
                    <label className="form-label">Short Bio</label>
                    <textarea
                      className="form-control"
                      name="bio_short"
                      value={formData.bio_short}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                      placeholder="A brief 1-2 sentence summary about the speaker (max 500 characters)"
                    />
                    <small className="text-muted">{formData.bio_short.length}/500 characters</small>
                  </div>

                  {/* Full Bio */}
                  <div className="mb-3">
                    <label className="form-label">Full Biography</label>
                    <RichTextEditor
                      value={formData.bio_full}
                      onChange={handleBioFullChange}
                      placeholder="Write the speaker's full biography... Highlight their achievements, expertise, and background."
                      disabled={loading}
                    />
                  </div>

                  {/* LinkedIn URL */}
                  <div className="mb-3">
                    <label className="form-label">LinkedIn URL</label>
                    <input type="url" className="form-control" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <ExpertiseSelector
                      selectedIds={formData.expertise_ids}
                      onChange={(expertise_ids) => setFormData(prev => ({ ...prev, expertise_ids }))}
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <EventSelector
                      selectedIds={formData.event_ids}
                      onChange={(event_ids) => setFormData(prev => ({ ...prev, event_ids }))}
                      label="Speaking at Events"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <FileUpload onFileSelect={handleFileSelect} accept="image/*" maxSize={5 * 1024 * 1024} preview currentUrl={formData.photo_url} label="Photo" />
                  <div className="d-grid gap-2 mt-4">
                    <button type="submit" className="btn btn-primary" disabled={loading || uploadingImage}>
                      {uploadingImage ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Uploading Image...
                        </>
                      ) : loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating...
                        </>
                      ) : (
                        '✓ Create Speaker'
                      )}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/speakers')} disabled={loading || uploadingImage}>Clear</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
