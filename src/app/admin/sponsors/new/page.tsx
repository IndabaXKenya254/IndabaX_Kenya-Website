'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert, FileUpload } from '@/components/admin/ui'
import { EventSelector } from '@/components/admin/selectors'
import { adminApi } from '@/lib/admin/api-client'

export default function CreateSponsorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', tier: 'gold', website_url: '', logo_url: '', sponsor_year: new Date().getFullYear(), force_previous: false, event_ids: [] as string[] })

  const handleChange = (e: any) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleFileSelect = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload/sponsor-logo', { method: 'POST', body: fd, credentials: 'include' })
    const result = await res.json()
    if (result.success) setFormData(prev => ({ ...prev, logo_url: result.data.url }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    const result = await adminApi.sponsors.create(formData)
    if (result.success) {
      setAlert({ type: 'success', message: 'Sponsor created!' })
      setTimeout(() => router.push('/admin/sponsors'), 1500)
    } else {
      setAlert({ type: 'danger', message: result.error })
      setLoading(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6"><h2>Add Sponsor</h2></div>
          <div className="col-md-6 text-md-end"><button className="btn btn-secondary" onClick={() => router.push('/admin/sponsors')}>← Back</button></div>
        </div>
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-8">
                  <div className="row">
                    <div className="col-md-8 mb-3"><label className="form-label">Name *</label><input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required /></div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Sponsor Year</label>
                      <input type="number" className="form-control" name="sponsor_year" value={formData.sponsor_year} onChange={handleChange} min="2020" max="2030" />
                      <small className="text-muted">Year participated</small>
                    </div>
                  </div>
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
                        <strong>Mark as Previous/Past Sponsor</strong>
                      </label>
                    </div>
                    <small className="text-muted">When enabled, shows as "previous" in the UI regardless of year.</small>
                  </div>
                  <div className="mb-3"><label className="form-label">Website URL</label><input type="url" className="form-control" name="website_url" value={formData.website_url} onChange={handleChange} /></div>
                  <div className="mb-3">
                    <EventSelector
                      selectedIds={formData.event_ids}
                      onChange={(event_ids) => setFormData(prev => ({ ...prev, event_ids }))}
                      label="Link to Events"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Tier</label>
                    <select className="form-select" name="tier" value={formData.tier} onChange={handleChange}>
                      <option value="platinum">Platinum</option>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="bronze">Bronze</option>
                    </select>
                  </div>
                  <FileUpload onFileSelect={handleFileSelect} accept="image/*" maxSize={2 * 1024 * 1024} preview currentUrl={formData.logo_url} label="Logo" />
                  <div className="d-grid gap-2 mt-4">
                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : '✓ Create Sponsor'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/sponsors')}>Clear</button>
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
