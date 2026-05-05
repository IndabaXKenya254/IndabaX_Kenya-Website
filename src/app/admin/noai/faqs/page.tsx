'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  display_order: number
  is_published: boolean
}

const CATEGORIES = ['general', 'eligibility', 'application', 'competition', 'logistics', 'awards']

export default function FAQsAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    display_order: 0,
    is_published: true
  })
  const [saving, setSaving] = useState(false)

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  }

  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    try {
      const res = await fetch('/api/noai/faqs')
      const data = await res.json()
      if (data.success) {
        // If grouped by category, flatten
        if (typeof data.data === 'object' && !Array.isArray(data.data)) {
          const flattened: FAQ[] = []
          Object.values(data.data).forEach((categoryFaqs: any) => {
            flattened.push(...categoryFaqs)
          })
          setFaqs(flattened)
        } else {
          setFaqs(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id)
    setShowAddForm(false)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      display_order: faq.display_order,
      is_published: faq.is_published
    })
  }

  const handleAddNew = () => {
    setShowAddForm(true)
    setEditingId(null)
    setFormData({
      question: '',
      answer: '',
      category: selectedCategory === 'all' ? 'general' : selectedCategory,
      display_order: faqs.length,
      is_published: true
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      display_order: 0,
      is_published: true
    })
  }

  const handleSave = async () => {
    if (!formData.question || !formData.answer) {
      alert('Question and answer are required!')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...(editingId && { id: editingId }),
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        display_order: formData.display_order,
        is_published: formData.is_published
      }

      const res = await fetch('/api/noai/faqs', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        // Optimistic update: Update local state directly
        if (editingId && data.data) {
          setFaqs(prev => prev.map(f => f.id === editingId ? data.data : f))
        } else if (data.data) {
          setFaqs(prev => [...prev, data.data])
        } else {
          await loadFAQs()
        }
        handleCancel()
        alert(editingId ? 'FAQ updated!' : 'FAQ created!')
      } else {
        alert('Error: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving FAQ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return

    try {
      const res = await fetch(`/api/noai/faqs?id=${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        // Optimistic update: Remove from local state
        setFaqs(prev => prev.filter(f => f.id !== id))
        alert('FAQ deleted!')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error deleting FAQ')
    }
  }

  const handleTogglePublish = async (faq: FAQ) => {
    try {
      const res = await fetch('/api/noai/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: faq.id,
          is_published: !faq.is_published
        })
      })

      const data = await res.json()
      if (data.success) {
        await loadFAQs()
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const filteredFAQs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(f => f.category === selectedCategory)

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>NOAI FAQs Management</h2>
            <p className="text-muted">Manage frequently asked questions</p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/admin/noai" className="btn btn-outline-secondary">
              <i className="icofont-arrow-left me-2"></i>
              Back
            </Link>
            <button onClick={handleAddNew} className="btn btn-primary">
              <i className="icofont-plus me-2"></i>
              Add New FAQ
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              >
                All ({faqs.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)} ({faqs.filter(f => f.category === cat).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">{editingId ? 'Edit FAQ' : 'Add New FAQ'}</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Question</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g., What is NOAI?"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Answer (HTML Editor)</label>
                <ReactQuill
                  theme="snow"
                  value={formData.answer}
                  onChange={(value) => setFormData({ ...formData, answer: value })}
                  modules={quillModules}
                  style={{ height: '200px', marginBottom: '60px' }}
                />
              </div>

              <div className="row">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Status</label>
                  <select
                    className="form-select"
                    value={formData.is_published ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'true' })}
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 d-flex gap-2">
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                </button>
                <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* FAQs List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className="col-12 mb-3">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">{faq.question}</h6>
                      <small className="text-muted">
                        Category: {faq.category} | Order: {faq.display_order}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleTogglePublish(faq)}
                        className={`btn btn-sm ${faq.is_published ? 'btn-success' : 'btn-secondary'}`}
                      >
                        {faq.is_published ? 'Published' : 'Draft'}
                      </button>
                      <button onClick={() => handleEdit(faq)} className="btn btn-sm btn-primary">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(faq.id)} className="btn btn-sm btn-danger">
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                  </div>
                </div>
              </div>
            ))}

            {filteredFAQs.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info">
                  <i className="icofont-info-circle me-2"></i>
                  No FAQs found. Click &quot;Add New FAQ&quot; to get started!
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
