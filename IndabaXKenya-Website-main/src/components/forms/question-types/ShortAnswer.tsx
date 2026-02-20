'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SHORT ANSWER QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Short text input question
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'

interface ShortAnswerProps {
  question: Question
  value?: string
  onChange?: (value: string) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function ShortAnswer({ question, value = '', onChange, onUpdate, mode }: ShortAnswerProps) {
  const config = question.config || {}
  const placeholder = config.placeholder || 'Your answer'
  const maxLength = config.maxLength || 500

  // Builder mode - show configuration options
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        {/* Issue #8 FIX: Add validation type selector */}
        <div className="mb-3">
          <label className="form-label">Validation Type</label>
          <select
            className="form-select"
            value={config.validationType || 'text'}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, validationType: e.target.value },
              })
            }
          >
            <option value="text">Plain Text</option>
            <option value="email">Email Address</option>
            <option value="phone">Phone Number</option>
            <option value="url">URL</option>
            <option value="number">Number Only</option>
          </select>
          <small className="text-muted">
            {config.validationType === 'email' && 'Must be a valid email address'}
            {config.validationType === 'phone' && 'Must be a valid phone number (e.g., +254...)'}
            {config.validationType === 'url' && 'Must be a valid URL'}
            {config.validationType === 'number' && 'Must contain only numbers'}
          </small>
        </div>
        <div className="mb-3">
          <label className="form-label">Placeholder Text</label>
          <input
            type="text"
            className="form-control"
            value={config.placeholder || ''}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, placeholder: e.target.value },
              })
            }
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Maximum Length</label>
          <input
            type="number"
            className="form-control"
            min="1"
            max="5000"
            value={config.maxLength || 500}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, maxLength: parseInt(e.target.value) },
              })
            }
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Minimum Length</label>
          <input
            type="number"
            className="form-control"
            min="0"
            max="5000"
            value={config.minLength || 0}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, minLength: parseInt(e.target.value) },
              })
            }
          />
        </div>
      </div>
    )
  }

  // Issue #8 FIX: Map validation type to HTML5 input type
  const getInputType = () => {
    switch (config.validationType) {
      case 'email': return 'email'
      case 'phone': return 'tel'
      case 'url': return 'url'
      case 'number': return 'number'
      default: return 'text'
    }
  }

  // Preview/Response mode - show input field
  return (
    <div className="question-type-preview">
      <input
        type={getInputType()}
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        maxLength={config.validationType !== 'number' ? maxLength : undefined}
        disabled={mode === 'preview'}
      />
      {maxLength && config.validationType !== 'number' && (
        <small className="text-muted">
          {value.length} / {maxLength} characters
        </small>
      )}
    </div>
  )
}
