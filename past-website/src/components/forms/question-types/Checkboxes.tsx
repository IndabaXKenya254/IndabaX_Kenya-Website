'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CHECKBOXES QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Multiple selection from options
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

// Helper to get display label from option
function getOptionLabel(option: OptionItem): string {
  return typeof option === 'string' ? option : option.label
}

// Helper to get value from option
function getOptionValue(option: OptionItem): string {
  return typeof option === 'string' ? option : option.value
}

interface CheckboxesProps {
  question: Question
  value?: string[]
  onChange?: (value: string[]) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function Checkboxes({ question, value = [], onChange, onUpdate, mode }: CheckboxesProps) {
  const config = question.config || {}
  const rawOptions: OptionItem[] = config.options || ['Option 1']
  const normalizedOptions = normalizeOptions(rawOptions)
  const allowOther = config.allowOther || false
  const randomize = config.randomize || false
  const minSelections = config.minSelections || 0
  const maxSelections = config.maxSelections || normalizedOptions.length

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

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange?.(newValue)
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

        <div className="row mb-3">
          <div className="col-6">
            <label className="form-label">Min Selections</label>
            <input
              type="number"
              className="form-control"
              min="0"
              max={normalizedOptions.length}
              value={minSelections}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, minSelections: parseInt(e.target.value) },
                })
              }
            />
          </div>
          <div className="col-6">
            <label className="form-label">Max Selections</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max={normalizedOptions.length}
              value={maxSelections}
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, maxSelections: parseInt(e.target.value) },
                })
              }
            />
          </div>
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

  // Preview/Response mode - show checkboxes
  const displayOptions = randomize && mode === 'response'
    ? [...normalizedOptions].sort(() => Math.random() - 0.5)
    : normalizedOptions

  const optionValues = normalizedOptions.map(o => o.value)
  const otherValue = value.find(v => !optionValues.includes(v) && v !== '__other__')

  return (
    <div className="question-type-preview">
      {displayOptions.map((option, index) => (
        <div key={index} className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            id={`${question.id}-option-${index}`}
            value={option.value}
            checked={value.includes(option.value)}
            onChange={() => handleToggleOption(option.value)}
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
            type="checkbox"
            className="form-check-input"
            id={`${question.id}-option-other`}
            value="__other__"
            checked={value.includes('__other__') || !!otherValue}
            onChange={() => handleToggleOption('__other__')}
            disabled={mode === 'preview'}
          />
          <label className="form-check-label" htmlFor={`${question.id}-option-other`}>
            Other:
          </label>
          {(value.includes('__other__') || otherValue) && (
            <input
              type="text"
              className="form-control mt-2"
              placeholder="Please specify"
              value={otherValue || ''}
              onChange={(e) => {
                const filteredValue = value.filter(v => optionValues.includes(v) || v === '__other__')
                onChange?.([...filteredValue, e.target.value])
              }}
              disabled={mode === 'preview'}
            />
          )}
        </div>
      )}
      {(minSelections > 0 || maxSelections < normalizedOptions.length) && (
        <small className="text-muted">
          {minSelections > 0 && maxSelections < normalizedOptions.length
            ? `Select between ${minSelections} and ${maxSelections} options`
            : minSelections > 0
            ? `Select at least ${minSelections} option(s)`
            : `Select up to ${maxSelections} option(s)`}
        </small>
      )}
    </div>
  )
}
