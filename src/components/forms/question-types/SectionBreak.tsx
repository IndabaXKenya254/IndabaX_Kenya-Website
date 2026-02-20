'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SECTION BREAK QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Visual section divider
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'

interface SectionBreakProps {
  question: Question
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function SectionBreak({ question, onUpdate, mode }: SectionBreakProps) {
  const config = question.config || {}
  const pageBreak = config.pageBreak || false

  // Builder mode
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="pageBreak"
              checked={pageBreak}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, pageBreak: e.target.checked },
                })
              }
            />
            <label className="form-check-label" htmlFor="pageBreak">
              Start new page after this section
            </label>
          </div>
        </div>
        <div className="alert alert-info">
          <small>
            <i className="icofont-info-circle me-1"></i>
            Section breaks help organize your form into logical sections
          </small>
        </div>
      </div>
    )
  }

  // Preview/Response mode - Issue #25 FIX: Show title and description
  return (
    <div className="question-type-preview section-break-display">
      {/* Section Title and Description */}
      {(question.title || question.description) && (
        <div className="section-break-content mb-3">
          {question.title && (
            <h5 className="section-break-title fw-bold text-primary mb-2">
              {question.title}
            </h5>
          )}
          {question.description && (
            <p className="section-break-description text-muted mb-0">
              {question.description}
            </p>
          )}
        </div>
      )}
      <hr className="my-3" style={{ borderTop: '2px solid #dee2e6' }} />
      {/* Only show Page Break badge in preview mode, NOT in response mode (user-facing) */}
      {pageBreak && mode === 'preview' && (
        <div className="text-center">
          <small className="badge bg-secondary">Page Break</small>
        </div>
      )}
    </div>
  )
}
