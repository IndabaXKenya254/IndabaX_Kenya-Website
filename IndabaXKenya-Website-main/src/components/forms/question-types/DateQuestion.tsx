'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - DATE QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Date picker question
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'

interface DateQuestionProps {
  question: Question
  value?: string
  onChange?: (value: string) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function DateQuestion({ question, value = '', onChange, onUpdate, mode }: DateQuestionProps) {
  const config = question.config || {}
  const includeTime = config.includeTime || false
  const minDate = config.minDate || ''
  const maxDate = config.maxDate || ''
  const defaultToToday = config.defaultToToday || false

  // Builder mode
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="includeTime"
              checked={includeTime}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, includeTime: e.target.checked },
                })
              }
            />
            <label className="form-check-label" htmlFor="includeTime">
              Include time selection
            </label>
          </div>
        </div>

        <div className="mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="defaultToToday"
              checked={defaultToToday}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, defaultToToday: e.target.checked },
                })
              }
            />
            <label className="form-check-label" htmlFor="defaultToToday">
              Default to today&apos;s date
            </label>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Minimum Date (optional)</label>
          <input
            type="date"
            className="form-control"
            value={minDate}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, minDate: e.target.value },
              })
            }
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Maximum Date (optional)</label>
          <input
            type="date"
            className="form-control"
            value={maxDate}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, maxDate: e.target.value },
              })
            }
          />
        </div>
      </div>
    )
  }

  // Preview/Response mode
  return (
    <div className="question-type-preview">
      <input
        type={includeTime ? 'datetime-local' : 'date'}
        className="form-control"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        min={minDate}
        max={maxDate}
        disabled={mode === 'preview'}
      />
    </div>
  )
}
