'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TEMPLATE SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Select form templates for event registration flows
// Phase 4: Registration Flow

import { useState, useEffect } from 'react'

interface Template {
  id: string
  name: string
  description: string | null
  usage_type: string
  is_locked: boolean
  question_count?: number
}

interface TemplateSelectorProps {
  selectedId: string | null
  onChange: (templateId: string | null) => void
  disabled?: boolean
  usageType?: 'application' | 'initial_interest' | 'detailed_survey' | 'all'
  label?: string
  helperText?: string
  required?: boolean
}

export function TemplateSelector({
  selectedId,
  onChange,
  disabled = false,
  usageType = 'all',
  label = 'Select Template',
  helperText,
  required = false,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [usageType])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (usageType && usageType !== 'all') {
        params.append('usage_type', usageType)
      }

      const response = await fetch(`/api/forms/templates?${params.toString()}`, {
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        setTemplates(result.data || [])
      } else {
        setError(result.error?.message || 'Failed to load templates')
      }
    } catch (err) {
      setError('An error occurred while loading templates')
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onChange(value === '' ? null : value)
  }

  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>

      {loading ? (
        <div className="form-select d-flex align-items-center" style={{ minHeight: '38px' }}>
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="text-muted small">Loading templates...</span>
        </div>
      ) : error ? (
        <div>
          <div className="form-select text-danger d-flex align-items-center justify-content-between" style={{ minHeight: '38px' }}>
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-link text-primary p-0"
              onClick={loadTemplates}
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <select
          className="form-select"
          value={selectedId || ''}
          onChange={handleChange}
          disabled={disabled}
          required={required}
        >
          <option value="">None (no form)</option>
          {templates.length === 0 ? (
            <option value="" disabled>
              No templates available
            </option>
          ) : (
            templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.question_count !== undefined && ` (${template.question_count} questions)`}
                {template.is_locked && ' 🔒'}
              </option>
            ))
          )}
        </select>
      )}

      {helperText && (
        <small className="text-muted d-block mt-1">
          <i className="icofont-info-circle me-1"></i>
          {helperText}
        </small>
      )}

      {templates.length === 0 && !loading && !error && (
        <small className="text-warning d-block mt-1">
          <i className="icofont-warning me-1"></i>
          No templates found. Create one in the{' '}
          <a href="/admin/forms/templates" className="text-decoration-underline">
            Form Templates
          </a>{' '}
          section.
        </small>
      )}
    </div>
  )
}
