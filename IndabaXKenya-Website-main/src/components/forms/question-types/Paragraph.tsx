'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PARAGRAPH QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Long text input question
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'

interface ParagraphProps {
  question: Question
  value?: string
  onChange?: (value: string) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function Paragraph({ question, value = '', onChange, onUpdate, mode }: ParagraphProps) {
  const config = question.config || {}
  const placeholder = config.placeholder || 'Your answer'
  const maxLength = config.maxLength || 5000

  // Builder mode - show configuration options
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
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
            max="10000"
            value={config.maxLength || 5000}
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
            max="10000"
            value={config.minLength || 0}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, minLength: parseInt(e.target.value) },
              })
            }
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Number of Rows</label>
          <input
            type="number"
            className="form-control"
            min="3"
            max="20"
            value={config.rows || 5}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, rows: parseInt(e.target.value) },
              })
            }
          />
        </div>
      </div>
    )
  }

  // Preview/Response mode - show textarea
  return (
    <div className="question-type-preview">
      <textarea
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        maxLength={maxLength}
        rows={config.rows || 5}
        disabled={mode === 'preview'}
      />
      {maxLength && (
        <small className="text-muted">
          {value.length} / {maxLength} characters
        </small>
      )}
    </div>
  )
}
