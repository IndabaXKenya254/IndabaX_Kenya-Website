'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TIME QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Time picker question
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'

interface TimeQuestionProps {
  question: Question
  value?: string
  onChange?: (value: string) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function TimeQuestion({ question, value = '', onChange, onUpdate, mode }: TimeQuestionProps) {
  const config = question.config || {}
  const format = config.format || '24h'

  // Builder mode
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="mb-3">
          <label className="form-label">Time Format</label>
          <select
            className="form-select"
            value={format}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, format: e.target.value },
              })
            }
          >
            <option value="24h">24 Hour</option>
            <option value="12h">12 Hour (AM/PM)</option>
          </select>
        </div>
      </div>
    )
  }

  // Preview/Response mode
  return (
    <div className="question-type-preview">
      <input
        type="time"
        className="form-control"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={mode === 'preview'}
      />
      {format === '12h' && (
        <small className="text-muted">Time will be displayed in 12-hour format</small>
      )}
    </div>
  )
}
