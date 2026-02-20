'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - DROPDOWN QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Dropdown select question
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

interface DropdownProps {
  question: Question
  value?: string
  onChange?: (value: string) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function Dropdown({ question, value = '', onChange, onUpdate, mode }: DropdownProps) {
  const config = question.config || {}
  const rawOptions: OptionItem[] = config.options || ['Option 1']
  const normalizedOptions = normalizeOptions(rawOptions)

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

  // Builder mode
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
      </div>
    )
  }

  // Preview/Response mode
  return (
    <div className="question-type-preview">
      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={mode === 'preview'}
      >
        <option value="">Select an option...</option>
        {normalizedOptions.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
