'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - NEW TEMPLATE PAGE
// ═══════════════════════════════════════════════════════════════════════
// Create new form template
// Phase 3: Form Builder

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { FormBuilder } from '@/components/forms/FormBuilder'
import { Template, Question } from '@/hooks/useFormBuilder'
import '@/styles/form-builder.css'

export default function NewTemplatePage() {
  const router = useRouter()

  const handleSave = async (template: Template, questions: Question[]) => {
    try {
      // Create template
      const templateResponse = await fetch('/api/forms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          usage_type: template.usage_type,
          is_locked: template.is_locked,
          locked_to_event_id: template.locked_to_event_id,
          settings: template.settings,
        }),
      })

      const templateData = await templateResponse.json()

      if (!templateData.success) {
        alert(templateData.error?.message || 'Failed to create template')
        return
      }

      const templateId = templateData.data.id

      // Create questions
      if (questions.length > 0) {
        const questionsResponse = await fetch(`/api/forms/templates/${templateId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions }),
        })

        const questionsData = await questionsResponse.json()

        if (!questionsData.success) {
          alert('Template created but failed to save questions: ' + questionsData.error?.message)
          router.push(`/admin/templates/${templateId}`)
          return
        }
      }

      alert('Template created successfully!')
      router.push('/admin/templates')
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid p-0">
        {/* Header */}
        <div className="bg-white border-bottom px-4 py-3 mb-0">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Create Form Template</h2>
              <p className="text-muted mb-0">
                Build a dynamic form with drag-and-drop question types
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
        <FormBuilder onSave={handleSave} />
      </div>
    </DashboardLayout>
  )
}
