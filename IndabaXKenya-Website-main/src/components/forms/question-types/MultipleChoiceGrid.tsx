'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - MULTIPLE CHOICE GRID QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Grid with radio buttons (single selection per row)
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'

interface MultipleChoiceGridProps {
  question: Question
  value?: Record<string, string>
  onChange?: (value: Record<string, string>) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function MultipleChoiceGrid({ question, value = {}, onChange, onUpdate, mode }: MultipleChoiceGridProps) {
  const config = question.config || {}
  const rows = config.rows || ['Row 1']
  const columns = config.columns || ['Column 1']

  const handleAddRow = () => {
    const newRows = [...rows, `Row ${rows.length + 1}`]
    onUpdate?.({
      config: { ...config, rows: newRows },
    })
  }

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return
    const newRows = rows.filter((_: any, i: number) => i !== index)
    onUpdate?.({
      config: { ...config, rows: newRows },
    })
  }

  const handleUpdateRow = (index: number, rowValue: string) => {
    const newRows = [...rows]
    newRows[index] = rowValue
    onUpdate?.({
      config: { ...config, rows: newRows },
    })
  }

  const handleAddColumn = () => {
    const newColumns = [...columns, `Column ${columns.length + 1}`]
    onUpdate?.({
      config: { ...config, columns: newColumns },
    })
  }

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) return
    const newColumns = columns.filter((_: any, i: number) => i !== index)
    onUpdate?.({
      config: { ...config, columns: newColumns },
    })
  }

  const handleUpdateColumn = (index: number, colValue: string) => {
    const newColumns = [...columns]
    newColumns[index] = colValue
    onUpdate?.({
      config: { ...config, columns: newColumns },
    })
  }

  // Issue #5 FIX: Toggle selection - clicking selected radio deselects it
  const handleCellChange = (row: string, col: string) => {
    const newValue = { ...value }
    if (newValue[row] === col) {
      delete newValue[row] // Deselect
    } else {
      newValue[row] = col // Select
    }
    onChange?.(newValue)
  }

  // Issue #8, #47: Clear all selections
  const handleClearAll = () => {
    onChange?.({})
  }

  // Check if any selections exist
  const hasSelections = Object.keys(value).length > 0

  // Builder mode
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="mb-3">
          <label className="form-label">Rows (Questions)</label>
          {rows.map((row: string, index: number) => (
            <div key={index} className="input-group mb-2">
              <input
                type="text"
                className="form-control"
                value={row}
                onChange={(e) => handleUpdateRow(index, e.target.value)}
              />
              <button
                className="btn btn-outline-danger"
                type="button"
                onClick={() => handleRemoveRow(index)}
                disabled={rows.length <= 1}
              >
                <i className="icofont-trash"></i>
              </button>
            </div>
          ))}
          <button className="btn btn-sm btn-outline-primary" onClick={handleAddRow}>
            <i className="icofont-plus me-1"></i>
            Add Row
          </button>
        </div>

        <div className="mb-3">
          <label className="form-label">Columns (Options)</label>
          {columns.map((col: string, index: number) => (
            <div key={index} className="input-group mb-2">
              <input
                type="text"
                className="form-control"
                value={col}
                onChange={(e) => handleUpdateColumn(index, e.target.value)}
              />
              <button
                className="btn btn-outline-danger"
                type="button"
                onClick={() => handleRemoveColumn(index)}
                disabled={columns.length <= 1}
              >
                <i className="icofont-trash"></i>
              </button>
            </div>
          ))}
          <button className="btn btn-sm btn-outline-primary" onClick={handleAddColumn}>
            <i className="icofont-plus me-1"></i>
            Add Column
          </button>
        </div>
      </div>
    )
  }

  // Preview/Response mode
  return (
    <div className="question-type-preview">
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th></th>
              {columns.map((col: string, index: number) => (
                <th key={index} className="text-center">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string, rowIndex: number) => (
              <tr key={rowIndex}>
                <td><strong>{row}</strong></td>
                {columns.map((col: string, colIndex: number) => (
                  <td key={colIndex} className="text-center">
                    {/* Issue #5 FIX: Use onClick instead of onChange to allow deselection */}
                    <input
                      type="radio"
                      name={`grid-${question.id}-row-${rowIndex}`}
                      checked={value[row] === col}
                      onClick={() => handleCellChange(row, col)}
                      onChange={() => {}} // React requires onChange with checked
                      disabled={mode === 'preview'}
                      style={{ cursor: mode === 'preview' ? 'default' : 'pointer' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Issue #8, #47: Clear Selections button */}
      {mode === 'response' && hasSelections && (
        <div className="mt-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleClearAll}
          >
            <i className="icofont-close-line me-1"></i>
            Clear Selections
          </button>
        </div>
      )}
    </div>
  )
}
