'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - VIEW EMAIL TEMPLATE PAGE (PHASE 7)
// ═══════════════════════════════════════════════════════════════════════
// View individual email template details

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  description: string | null
  type: string | null
  category: string | null
  is_reusable: boolean
  is_system: boolean
  variables: string[]
  created_by: string
  created_at: string
  updated_at: string
  user_profiles: {
    id: string
    name: string
    email: string
  }
}

export default function ViewEmailTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplate()
  }, [id])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/email-templates/${id}`)
      const result = await response.json()

      if (result.success) {
        setTemplate(result.data)
      } else {
        alert('Template not found')
        router.push('/admin/email-templates')
      }
    } catch (error) {
      console.error('Failed to fetch template:', error)
      alert('Failed to load template')
      router.push('/admin/email-templates')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Loading template...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!template) {
    return null
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="mb-1 h4 h3-md">{template.name}</h2>
            <p className="text-muted mb-0">
              {template.is_system ? (
                <span className="badge bg-dark me-2">System Template</span>
              ) : (
                <span className="badge bg-light text-dark me-2">Custom Template</span>
              )}
              <span className="badge bg-primary">{template.category || template.type || 'custom'}</span>
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-outline-secondary btn-sm btn-md-md"
              onClick={() => router.back()}
            >
              <i className="icofont-arrow-left me-1 me-md-2"></i>
              <span className="d-none d-sm-inline">Back</span>
            </button>
            {!template.is_system && (
              <button
                className="btn btn-primary btn-sm btn-md-md"
                onClick={() => router.push(`/admin/email-templates/${id}/edit`)}
              >
                <i className="icofont-edit me-1 me-md-2"></i>
                <span className="d-none d-sm-inline">Edit</span>
              </button>
            )}
          </div>
        </div>

        <div className="row g-3 g-lg-4">
          {/* Main Content */}
          <div className="col-12 col-lg-8">
            {/* Description */}
            {template.description && (
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">Description</h6>
                </div>
                <div className="card-body">
                  <p className="mb-0">{template.description}</p>
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Email Subject</h6>
              </div>
              <div className="card-body p-2 p-md-3">
                <p className="mb-0 font-monospace small" style={{ wordBreak: 'break-word' }}>{template.subject}</p>
              </div>
            </div>

            {/* Body */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Email Body (Preview)</h6>
              </div>
              <div className="card-body p-2 p-md-3">
                {/* Use iframe to isolate email CSS from affecting the page */}
                <iframe
                  srcDoc={template.body}
                  title="Email Preview"
                  className="w-100 border rounded"
                  style={{
                    minHeight: '500px',
                    backgroundColor: '#f4f4f4'
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            {/* HTML Source */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">HTML Source</h6>
              </div>
              <div className="card-body p-2 p-md-3">
                <pre
                  className="mb-0 p-2 p-md-3 bg-dark text-light rounded"
                  style={{
                    maxHeight: '300px',
                    overflow: 'auto',
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  <code>{template.body}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-12 col-lg-4">
            {/* Metadata */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Template Info</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small className="text-muted d-block">Created By</small>
                  <div>{template.user_profiles?.name || 'Unknown'}</div>
                  <small className="text-muted">{template.user_profiles?.email}</small>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Created</small>
                  <div>{new Date(template.created_at).toLocaleString()}</div>
                </div>
                <div className="mb-0">
                  <small className="text-muted d-block">Last Updated</small>
                  <div>{new Date(template.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Variables */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Variables Used</h6>
              </div>
              <div className="card-body">
                {template.variables && template.variables.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {template.variables.map((variable, index) => (
                      <code key={index} className="badge bg-light text-dark">
                        {variable}
                      </code>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mb-0 small">No variables defined</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
