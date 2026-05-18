'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TITLE & DESCRIPTION QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Display-only title and description section header
// Phase 3: Form Builder
// Issue #20 FIX: Use question.title and question.description instead of config.content

import { Question } from '@/hooks/useFormBuilder'

interface TitleDescriptionProps {
  question: Question
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function TitleDescription({ question, onUpdate, mode }: TitleDescriptionProps) {
  const config = question.config || {}
  const alignment = config.alignment || 'left'

  // Builder mode - just show alignment option (title/description edited in main panel)
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="alert alert-info mb-3">
          <small>
            <i className="icofont-info-circle me-1"></i>
            Use the <strong>Title</strong> and <strong>Description</strong> fields above to set the section header text.
          </small>
        </div>

        <div className="mb-3">
          <label className="form-label">Text Alignment</label>
          <select
            className="form-select"
            value={alignment}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, alignment: e.target.value },
              })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    )
  }

  // Preview/Response mode - Issue #20 FIX: Show title and description from question fields
  // Only render if there's a title or description to show
  if (!question.title && !question.description) {
    return null // Don't render empty section headers
  }

  return (
    <div className={`question-type-preview title-description-display text-${alignment}`} style={{ textAlign: alignment }}>
      {question.title && (
        <h4 className="title-description-heading fw-bold text-primary mb-2">
          {question.title}
        </h4>
      )}
      {question.description && (
        <p className="title-description-text text-muted mb-0">
          {question.description}
        </p>
      )}
    </div>
  )
}
