'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface PageSection {
  id: string
  section_key: string
  title: string
  content: any
  display_order: number
  is_published: boolean
  created_at?: string
  updated_at?: string
}

export default function NOAISectionsPage() {
  const [sections, setSections] = useState<PageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
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
    loadSections()
  }, [])

  const loadSections = async () => {
    try {
      const res = await fetch('/api/noai/sections')
      const data = await res.json()
      if (data.success) {
        setSections(data.data)
      }
    } catch (error) {
      console.error('Error loading sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (section: PageSection) => {
    setEditingId(section.id)
    setFormData({
      title: section.title,
      content: typeof section.content === 'string' ? section.content : (section.content.html || section.content.text || ''),
      display_order: section.display_order,
      is_published: section.is_published
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      title: '',
      content: '',
      display_order: 0,
      is_published: true
    })
  }

  const handleSave = async () => {
    if (!editingId) return

    setSaving(true)
    try {
      const res = await fetch('/api/noai/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title: formData.title,
          content: { html: formData.content },
          display_order: formData.display_order,
          is_published: formData.is_published
        })
      })

      const data = await res.json()
      if (data.success) {
        await loadSections()
        handleCancel()
        alert('Section updated successfully!')
      } else {
        alert('Error updating section: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error saving section')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (section: PageSection) => {
    try {
      const res = await fetch('/api/noai/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: section.id,
          is_published: !section.is_published
        })
      })

      const data = await res.json()
      if (data.success) {
        await loadSections()
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>NOAI Page Sections</h2>
            <p className="text-muted">Edit the main content sections displayed on the NOAI page</p>
          </div>
          <Link href="/admin/noai" className="btn btn-outline-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row">
            {sections.map((section) => (
              <div key={section.id} className="col-12 mb-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">{section.title}</h5>
                      <small className="text-muted">Key: {section.section_key}</small>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleTogglePublish(section)}
                        className={`btn btn-sm ${section.is_published ? 'btn-success' : 'btn-secondary'}`}
                      >
                        <i className={`icofont-${section.is_published ? 'check' : 'close'}-circled me-1`}></i>
                        {section.is_published ? 'Published' : 'Unpublished'}
                      </button>
                      {editingId === section.id ? (
                        <>
                          <button onClick={handleSave} className="btn btn-sm btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={handleCancel} className="btn btn-sm btn-secondary">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleEdit(section)} className="btn btn-sm btn-primary">
                          <i className="icofont-pencil me-1"></i>
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    {editingId === section.id ? (
                      <div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Content (HTML Editor)</label>
                          <ReactQuill
                            theme="snow"
                            value={formData.content}
                            onChange={(value) => setFormData({ ...formData, content: value })}
                            modules={quillModules}
                            style={{ height: '300px', marginBottom: '60px' }}
                          />
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Display Order</label>
                            <input
                              type="number"
                              className="form-control"
                              value={formData.display_order}
                              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Published</label>
                            <select
                              className="form-select"
                              value={formData.is_published ? 'true' : 'false'}
                              onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'true' })}
                            >
                              <option value="true">Published</option>
                              <option value="false">Unpublished</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div
                          className="content-preview"
                          dangerouslySetInnerHTML={{
                            __html: typeof section.content === 'string'
                              ? section.content
                              : (section.content.html || section.content.text || 'No content')
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="card-footer text-muted small">
                    Order: {section.display_order} | Last updated: {new Date(section.updated_at || '').toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
