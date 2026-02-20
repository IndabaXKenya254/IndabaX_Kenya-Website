'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - LINEAR SCALE QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Rating scale question (e.g., 1-5)
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'

interface LinearScaleProps {
  question: Question
  value?: number
  onChange?: (value: number) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function LinearScale({ question, value, onChange, onUpdate, mode }: LinearScaleProps) {
  const config = question.config || {}
  const min = config.min || 1
  const max = config.max || 5
  const minLabel = config.minLabel || 'Poor'
  const maxLabel = config.maxLabel || 'Excellent'

  // Builder mode
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="row mb-3">
          <div className="col-6">
            <label className="form-label">Minimum Value</label>
            <input
              type="number"
              className="form-control"
              min="0"
              max="10"
              value={min}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, min: parseInt(e.target.value) },
                })
              }
            />
          </div>
          <div className="col-6">
            <label className="form-label">Maximum Value</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max="10"
              value={max}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, max: parseInt(e.target.value) },
                })
              }
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Minimum Label</label>
          <input
            type="text"
            className="form-control"
            value={minLabel}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, minLabel: e.target.value },
              })
            }
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Maximum Label</label>
          <input
            type="text"
            className="form-control"
            value={maxLabel}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, maxLabel: e.target.value },
              })
            }
          />
        </div>
      </div>
    )
  }

  // Preview/Response mode
  const scaleOptions = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="question-type-preview">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">{minLabel}</small>
        <small className="text-muted">{maxLabel}</small>
      </div>
      <div className="d-flex justify-content-between gap-2">
        {scaleOptions.map((num) => (
          <div key={num} className="form-check text-center">
            <input
              type="radio"
              className="form-check-input"
              name={`scale-${question.id}`}
              id={`${question.id}-scale-${num}`}
              value={num}
              checked={value === num}
              onChange={() => onChange?.(num)}
              disabled={mode === 'preview'}
            />
            <label className="form-check-label d-block" htmlFor={`${question.id}-scale-${num}`}>
              {num}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
