'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert, FileUpload } from '@/components/admin/ui'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { ExpertiseSelector, EventSelector } from '@/components/admin/selectors'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError } from '@/lib/sweetalert'

interface SpeakerFormData {
  name: string
  title: string
  organization: string
  photo_url: string
  bio_short: string
  bio_full: string
  linkedin_url: string
  twitter_url: string
  website_url: string
  is_featured: boolean
  force_previous: boolean
  display_order: number
  speaker_year: number | null
  expertise_ids: string[]
  event_ids: string[]
}

export default function EditSpeakerPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [formData, setFormData] = useState<SpeakerFormData>({
    name: '',
    title: '',
    organization: '',
    photo_url: '',
    bio_short: '',
    bio_full: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: '',
    is_featured: false,
    force_previous: false,
    display_order: 0,
    speaker_year: new Date().getFullYear(),
    expertise_ids: [],
    event_ids: []
  })

  useEffect(() => {
    (async () => {
      const result = await adminApi.speakers.get(params.id as string)
      if (result.success && result.data) {
        const s: any = result.data
        // Extract expertise IDs from relationship objects
        const expertise_ids = s.expertise?.map((exp: any) => exp.id) || []
        // Extract event IDs from relationship objects
        const event_ids = s.events?.map((e: any) => e.id) || []

        setFormData({
          name: s.name || '',
          title: s.title || '',
          organization: s.organization || '',
          photo_url: s.photo_url || '',
          bio_short: s.bio_short || '',
          bio_full: s.bio_full || s.bio || '', // Fallback to 'bio' for backward compatibility
          linkedin_url: s.linkedin_url || '',
          twitter_url: s.twitter_url || '',
          website_url: s.website_url || '',
          is_featured: s.is_featured || false,
          force_previous: s.force_previous || false,
          display_order: s.display_order || 0,
          speaker_year: s.speaker_year || new Date().getFullYear(),
          expertise_ids,
          event_ids
        })
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to load speaker' })
      }
      setLoadingData(false)
    })()
  }, [params.id])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }))
  }

  const handleBioShortChange = (value: string) => {
    setFormData(prev => ({ ...prev, bio_short: value }))
  }

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
    setAlert(null)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setAlert({ type: 'danger', message: 'Name is required' })
        setLoading(false)
        return
      }

      const result = await adminApi.speakers.update(params.id as string, formData)

      if (result.success) {
        showSuccess('Speaker Updated!', `${formData.name} has been updated successfully`)
        setTimeout(() => router.push('/admin/speakers'), 1500)
      } else {
        showError('Update Failed', result.error || 'Failed to update speaker')
        setLoading(false)
      }
    } catch (error) {
      showError('Error', 'An error occurred while updating the speaker')
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading speaker data...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>
              <i className="icofont-user-alt-4 me-2"></i>
              Edit Speaker
            </h2>
            <p className="text-muted">Update speaker profile and information</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/admin/speakers')}
              disabled={loading}
            >
              <i className="icofont-arrow-left me-2"></i>
              Back to Speakers
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-lg-8">
              {/* Basic Information */}
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="icofont-info-circle me-2"></i>
                    Basic Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Dr. Jane Smith"
                        required
                        disabled={loading}
                      />
                      <small className="text-muted">Speaker&apos;s full name as it should appear</small>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Speaker Year</label>
                      <input
                        type="number"
                        className="form-control"
                        name="speaker_year"
                        value={formData.speaker_year || ''}
                        onChange={handleChange}
                        min="2020"
                        max="2030"
                        placeholder="2025"
                        disabled={loading}
                      />
                      <small className="text-muted">Year participated (e.g., 2025)</small>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Display Order</label>
                      <input
                        type="number"
                        className="form-control"
                        name="display_order"
                        value={formData.display_order}
                        onChange={handleChange}
                        min="0"
                        disabled={loading}
                      />
                      <small className="text-muted">Order to display (0 = first)</small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Title/Position</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Senior AI Researcher, Lead Data Scientist"
                      disabled={loading}
                    />
                    <small className="text-muted">Professional title or position</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Organization/Institution</label>
                    <input
                      type="text"
                      className="form-control"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="e.g., University of Nairobi, Google Research"
                      disabled={loading}
                    />
                    <small className="text-muted">Organization where the speaker works</small>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="is_featured"
                          name="is_featured"
                          checked={formData.is_featured}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="is_featured">
                          <strong>Featured Speaker</strong>
                          <div className="text-muted small">Highlight this speaker on the homepage</div>
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="force_previous"
                          name="force_previous"
                          checked={formData.force_previous}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="force_previous">
                          <strong>Mark as Previous/Past</strong>
                          <div className="text-muted small">Show as past speaker regardless of year</div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Biography */}
              <div className="card mb-4">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="icofont-file-text me-2"></i>
                    Biography
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <label className="form-label">
                      Short Bio (For Cards)
                    </label>
                    <RichTextEditor
                      value={formData.bio_short}
                      onChange={handleBioShortChange}
                      placeholder="Write a brief 2-3 sentence bio for speaker cards..."
                      disabled={loading}
                    />
                    <small className="text-muted">
                      Keep this brief - displayed on speaker cards (2-3 sentences recommended)
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Full Bio (Detailed)
                    </label>
                    <RichTextEditor
                      value={formData.bio_full}
                      onChange={handleBioFullChange}
                      placeholder="Write the speaker's full biography... Highlight their achievements, expertise, research, and background."
                      disabled={loading}
                    />
                    <small className="text-muted">
                      Detailed biography for speaker profile pages (can be longer)
                    </small>
                  </div>
                </div>
              </div>

              {/* Expertise */}
              <div className="card mb-4">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="icofont-brain me-2"></i>
                    Areas of Expertise
                  </h5>
                </div>
                <div className="card-body">
                  <ExpertiseSelector
                    selectedIds={formData.expertise_ids}
                    onChange={(expertise_ids) => setFormData(prev => ({ ...prev, expertise_ids }))}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Event Linking Card */}
              <div className="card mt-4 border-info">
                <div className="card-header bg-info bg-opacity-10">
                  <h5 className="mb-0">
                    <i className="icofont-calendar me-2"></i>
                    Speaking at Events
                  </h5>
                </div>
                <div className="card-body">
                  <EventSelector
                    selectedIds={formData.event_ids}
                    onChange={(event_ids) => setFormData(prev => ({ ...prev, event_ids }))}
                    label="Link to Events"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="card mb-4">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">
                    <i className="icofont-social-reddit me-2"></i>
                    Social Media & Links
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="icofont-linkedin me-2"></i>
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <i className="icofont-twitter me-2"></i>
                      Twitter/X Profile
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      name="twitter_url"
                      value={formData.twitter_url}
                      onChange={handleChange}
                      placeholder="https://twitter.com/username"
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <i className="icofont-web me-2"></i>
                      Personal Website
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              {/* Photo Upload */}
              <div className="card mb-4 sticky-top" style={{ top: '90px', zIndex: 100 }}>
                <div className="card-header bg-dark text-white">
                  <h5 className="mb-0">
                    <i className="icofont-image me-2"></i>
                    Speaker Photo
                  </h5>
                </div>
                <div className="card-body">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                    preview
                    currentUrl={formData.photo_url}
                    label="Upload Photo"
                  />
                  <small className="text-muted d-block mt-2">
                    <i className="icofont-info-circle me-1"></i>
                    Recommended: Square image, at least 400x400px
                  </small>
                </div>
              </div>

              {/* Actions */}
              <div className="card">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">
                    <i className="icofont-ui-settings me-2"></i>
                    Actions
                  </h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading || uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Uploading Image...
                        </>
                      ) : loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating Speaker...
                        </>
                      ) : (
                        <>
                          <i className="icofont-save me-2"></i>
                          Update Speaker
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => router.push('/admin/speakers')}
                      disabled={loading || uploadingImage}
                    >
                      <i className="icofont-close-line me-2"></i>
                      Cancel
                    </button>
                  </div>

                  <hr />

                  <div className="alert alert-info small mb-0">
                    <i className="icofont-info-circle me-2"></i>
                    <strong>Tip:</strong> Make sure to fill in both short and full bios. The short bio appears on cards, while the full bio is for detail pages.
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
