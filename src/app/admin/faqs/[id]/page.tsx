'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { Alert } from '@/components/admin/ui'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { adminApi } from '@/lib/admin/api-client'

export default function EditFaqPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [alert, setAlert] = useState<any>(null)
  const [formData, setFormData] = useState({ question: '', answer: '', category: 'general', classification: 'website', order: '0' })

  useEffect(() => {
    (async () => {
      const result = await adminApi.faqs.get(params.id as string)
      if (result.success) {
        const faq: any = result.data
        setFormData({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          classification: faq.classification || 'website',
          order: String(faq.order)
        })
      }
      setLoadingData(false)
    })()
  }, [params.id])

  const handleChange = (e: any) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleAnswerChange = (value: string) => {
    setFormData(prev => ({ ...prev, answer: value }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    const data = { ...formData, order: parseInt(formData.order) }
    const result = await adminApi.faqs.update(params.id as string, data)
    if (result.success) {
      setAlert({ type: 'success', message: 'FAQ updated!' })
      setTimeout(() => router.push('/admin/faqs'), 1500)
    } else {
      setAlert({ type: 'danger', message: result.error })
      setLoading(false)
    }
  }

  if (loadingData) return <DashboardLayout allowedRoles={['admin']}><div className="text-center py-5"><div className="spinner-border" /></div></DashboardLayout>

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6"><h2>Edit FAQ</h2></div>
          <div className="col-md-6 text-md-end"><button className="btn btn-secondary" onClick={() => router.push('/admin/faqs')}>← Back</button></div>
        </div>
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3"><label className="form-label">Question *</label><input type="text" className="form-control" name="question" value={formData.question} onChange={handleChange} required /></div>
              <div className="mb-3">
                <label className="form-label">Answer *</label>
                <RichTextEditor
                  value={formData.answer}
                  onChange={handleAnswerChange}
                  placeholder="Write your answer here... Use formatting to make it clear and easy to read."
                  disabled={loading}
                />
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Classification *</label>
                  <select className="form-select" name="classification" value={formData.classification} onChange={handleChange} required>
                    <option value="website">Website (General)</option>
                    <option value="noai">NOAI (National Olympiad)</option>
                  </select>
                  <small className="form-text text-muted">
                    Choose where this FAQ appears: Website or NOAI pages
                  </small>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Category</label>
                  <select className="form-select" name="category" value={formData.category} onChange={handleChange}>
                    <option value="general">General</option>
                    <option value="registration">Registration</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="travel">Travel</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Display Order</label>
                  <input type="number" className="form-control" name="order" value={formData.order} onChange={handleChange} min="0" />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Updating...' : '✓ Update FAQ'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/faqs')}>Clear</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
