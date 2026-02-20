'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - MULTIPLE CHOICE QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Single selection from options
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'

// Option can be either a string or an object with value/label
type OptionItem = string | { value: string; label: string }

// Helper to normalize options - handles both string[] and {value, label}[]
function normalizeOptions(options: OptionItem[]): { value: string; label: string }[] {
  return options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return { value: opt.value, label: opt.label }
  })
}

interface MultipleChoiceProps {
  question: Question
  value?: string
  onChange?: (value: string) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function MultipleChoice({ question, value = '', onChange, onUpdate, mode }: MultipleChoiceProps) {
  const config = question.config || {}
  const rawOptions: OptionItem[] = config.options || ['Option 1']
  const normalizedOptions = normalizeOptions(rawOptions)
  const allowOther = config.allowOther || false
  const randomize = config.randomize || false

  const handleAddOption = () => {
    const newOptions = [...normalizedOptions, { value: `option_${normalizedOptions.length + 1}`, label: `Option ${normalizedOptions.length + 1}` }]
    onUpdate?.({
      config: { ...config, options: newOptions },
    })
  }

  const handleRemoveOption = (index: number) => {
    if (normalizedOptions.length <= 1) return
    const newOptions = normalizedOptions.filter((_, i) => i !== index)
    onUpdate?.({
      config: { ...config, options: newOptions },
    })
  }

  const handleUpdateOption = (index: number, newLabel: string) => {
    const newOptions = [...normalizedOptions]
    newOptions[index] = { ...newOptions[index], label: newLabel }
    onUpdate?.({
      config: { ...config, options: newOptions },
    })
  }

  // Builder mode - show configuration options
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="mb-3">
          <label className="form-label">Options</label>
          {normalizedOptions.map((option, index) => (
            <div key={index} className="input-group mb-2">
              <input
                type="text"
                className="form-control"
                value={option.label}
                onChange={(e) => handleUpdateOption(index, e.target.value)}
              />
              <button
                className="btn btn-outline-danger"
                type="button"
                onClick={() => handleRemoveOption(index)}
                disabled={normalizedOptions.length <= 1}
              >
                <i className="icofont-trash"></i>
              </button>
            </div>
          ))}
          <button className="btn btn-sm btn-outline-primary" onClick={handleAddOption}>
            <i className="icofont-plus me-1"></i>
            Add Option
          </button>
        </div>

        <div className="mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="allowOther"
              checked={allowOther}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, allowOther: e.target.checked },
                })
              }
            />
            <label className="form-check-label" htmlFor="allowOther">
              Allow &quot;Other&quot; option
            </label>
          </div>
        </div>

        <div className="mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="randomize"
              checked={randomize}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, randomize: e.target.checked },
                })
              }
            />
            <label className="form-check-label" htmlFor="randomize">
              Randomize option order
            </label>
          </div>
        </div>
      </div>
    )
  }

  // Preview/Response mode - show radio buttons
  const displayOptions = randomize && mode === 'response'
    ? [...normalizedOptions].sort(() => Math.random() - 0.5)
    : normalizedOptions

  const optionValues = normalizedOptions.map(o => o.value)

  return (
    <div className="question-type-preview">
      {displayOptions.map((option, index) => (
        <div key={index} className="form-check mb-2">
          <input
            type="radio"
            className="form-check-input"
            name={`question-${question.id}`}
            id={`${question.id}-option-${index}`}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={mode === 'preview'}
          />
          <label className="form-check-label" htmlFor={`${question.id}-option-${index}`}>
            {option.label}
          </label>
        </div>
      ))}
      {allowOther && (
        <div className="form-check mb-2">
          <input
            type="radio"
            className="form-check-input"
            name={`question-${question.id}`}
            id={`${question.id}-option-other`}
            value="__other__"
            checked={value === '__other__' || Boolean(value && !optionValues.includes(value))}
            onChange={() => onChange?.('__other__')}
            disabled={mode === 'preview'}
          />
          <label className="form-check-label" htmlFor={`${question.id}-option-other`}>
            Other:
          </label>
          {(value === '__other__' || (value && !optionValues.includes(value))) && (
            <input
              type="text"
              className="form-control mt-2"
              placeholder="Please specify"
              value={value !== '__other__' ? value : ''}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={mode === 'preview'}
            />
          )}
        </div>
      )}
    </div>
  )
}
