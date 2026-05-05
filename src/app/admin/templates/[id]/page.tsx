'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EDIT TEMPLATE PAGE
// ═══════════════════════════════════════════════════════════════════════
// Edit existing form template
// Phase 3: Form Builder

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { FormBuilder } from '@/components/forms/FormBuilder'
import { Template, Question } from '@/hooks/useFormBuilder'
import '@/styles/form-builder.css'

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/forms/templates/${templateId}`)
      const data = await response.json()

      if (data.success) {
        const templateData = data.data
        setTemplate({
          id: templateData.id,
          name: templateData.name,
          description: templateData.description,
          usage_type: templateData.usage_type,
          is_locked: templateData.is_locked,
          locked_to_event_id: templateData.locked_to_event_id,
          settings: templateData.settings,
        })
        setQuestions(templateData.form_questions || [])
      } else {
        alert('Failed to load template')
        router.push('/admin/templates')
      }
    } catch (error) {
      console.error('Failed to fetch template:', error)
      alert('Failed to load template')
      router.push('/admin/templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updatedTemplate: Template, updatedQuestions: Question[]) => {
    try {
      // Update template metadata
      const templateResponse = await fetch(`/api/forms/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedTemplate.name,
          description: updatedTemplate.description,
          usage_type: updatedTemplate.usage_type,
          is_locked: updatedTemplate.is_locked,
          locked_to_event_id: updatedTemplate.locked_to_event_id,
          settings: updatedTemplate.settings,
        }),
      })

      const templateData = await templateResponse.json()

      if (!templateData.success) {
        alert(templateData.error?.message || 'Failed to update template')
        return
      }

      // Update questions (delete all and recreate for simplicity)
      const questionsResponse = await fetch(`/api/forms/templates/${templateId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: updatedQuestions }),
      })

      const questionsData = await questionsResponse.json()

      if (!questionsData.success) {
        alert('Template updated but failed to save questions: ' + questionsData.error?.message)
        return
      }

      alert('Template updated successfully!')
      router.push('/admin/templates')
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading template...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!template) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="text-center py-5">
          <p className="text-muted">Template not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid p-0">
        {/* Header */}
        <div className="bg-white border-bottom px-4 py-3 mb-0">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Edit Template</h2>
              <p className="text-muted mb-0">
                Modify your form template and questions
              </p>
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push('/admin/templates')}
            >
              <i className="icofont-arrow-left me-2"></i>
              Back to Templates
            </button>
          </div>
        </div>

        {/* Form Builder */}
        <FormBuilder template={template} questions={questions} onSave={handleSave} />
      </div>
    </DashboardLayout>
  )
}
