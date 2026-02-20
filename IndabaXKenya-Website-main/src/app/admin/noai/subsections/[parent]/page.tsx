'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface Subsection {
  id: string
  parent_section_key: string
  title: string
  content: any
  display_order: number
  is_published: boolean
  icon?: string
  style_variant?: string
}

export default function SubsectionsEditorPage() {
  const params = useParams()
  const router = useRouter()
  const parent = params.parent as string

  const [subsections, setSubsections] = useState<Subsection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    display_order: 0,
    is_published: true,
    icon: '',
    style_variant: 'card'
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

  const parentTitles: Record<string, string> = {
    'about_noai': 'About NOAI',
    'kenya_journey': 'Kenya\'s Journey'
  }

  useEffect(() => {
    loadSubsections()
  }, [parent])

  const loadSubsections = async () => {
    try {
      const res = await fetch(`/api/noai/subsections?parent=${parent}`)
      const data = await res.json()
      if (data.success) {
        setSubsections(data.data)
      }
    } catch (error) {
      console.error('Error loading subsections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (subsection: Subsection) => {
    setEditingId(subsection.id)
    setShowAddForm(false)
    setFormData({
      title: subsection.title,
      content: subsection.content.html || subsection.content.text || '',
      display_order: subsection.display_order,
      is_published: subsection.is_published,
      icon: subsection.icon || '',
      style_variant: subsection.style_variant || 'card'
    })
  }

  const handleAddNew = () => {
    setShowAddForm(true)
    setEditingId(null)
    setFormData({
      title: '',
      content: '',
      display_order: subsections.length,
      is_published: true,
      icon: 'icofont-check-circled',
      style_variant: 'card'
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      title: '',
      content: '',
      display_order: 0,
      is_published: true,
      icon: '',
      style_variant: 'card'
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...(editingId ? { id: editingId } : { parent_section_key: parent }),
        title: formData.title,
        content: { html: formData.content },
        display_order: formData.display_order,
        is_published: formData.is_published,
        icon: formData.icon || null,
        style_variant: formData.style_variant
      }

      const res = await fetch('/api/noai/subsections', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        await loadSubsections()
        handleCancel()
        alert(editingId ? 'Subsection updated!' : 'Subsection created!')
      } else {
        alert('Error: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving subsection')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subsection?')) return

    try {
      const res = await fetch(`/api/noai/subsections?id=${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        await loadSubsections()
        alert('Subsection deleted!')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error deleting subsection')
    }
  }

  const handleTogglePublish = async (subsection: Subsection) => {
    try {
      const res = await fetch('/api/noai/subsections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subsection.id,
          is_published: !subsection.is_published
        })
      })

      const data = await res.json()
      if (data.success) {
        await loadSubsections()
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
            <h2>{parentTitles[parent]} - Content Sections</h2>
            <p className="text-muted">Add, edit, or remove content blocks for this section</p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/admin/noai" className="btn btn-outline-secondary">
              <i className="icofont-arrow-left me-2"></i>
              Back
            </Link>
            <button onClick={handleAddNew} className="btn btn-primary">
              <i className="icofont-plus me-2"></i>
              Add New Section
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">{editingId ? 'Edit Section' : 'Add New Section'}</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8 mb-3">
                  <label className="form-label fw-bold">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., What is NOAI?"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Icon (Icofont class)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g., icofont-brain-alt"
                  />
                </div>
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
                  <label className="form-label fw-bold">Style</label>
                  <select
                    className="form-select"
                    value={formData.style_variant}
                    onChange={(e) => setFormData({ ...formData, style_variant: e.target.value })}
                  >
                    <option value="card">Card</option>
                    <option value="timeline">Timeline</option>
                    <option value="highlight">Highlight</option>
                  </select>
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

        {/* Subsections List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row">
            {subsections.map((subsection) => (
              <div key={subsection.id} className="col-12 mb-3">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">{subsection.title}</h5>
                      <small className="text-muted">Order: {subsection.display_order} | Icon: {subsection.icon || 'None'}</small>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleTogglePublish(subsection)}
                        className={`btn btn-sm ${subsection.is_published ? 'btn-success' : 'btn-secondary'}`}
                      >
                        {subsection.is_published ? 'Published' : 'Draft'}
                      </button>
                      <button onClick={() => handleEdit(subsection)} className="btn btn-sm btn-primary">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(subsection.id)} className="btn btn-sm btn-danger">
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div dangerouslySetInnerHTML={{ __html: subsection.content.html || subsection.content.text || 'No content' }} />
                  </div>
                </div>
              </div>
            ))}

            {subsections.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info">
                  <i className="icofont-info-circle me-2"></i>
                  No content sections yet. Click &quot;Add New Section&quot; to get started!
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
