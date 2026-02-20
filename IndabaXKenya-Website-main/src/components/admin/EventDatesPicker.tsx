// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT DATES PICKER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Visual calendar picker for selecting specific event dates
// Complements weekend checkboxes for precise date configuration

'use client'

import React, { useState, useEffect } from 'react'

interface EventDatesPickerProps {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  selectedDates: string[] | null // Array of YYYY-MM-DD dates
  onChange: (dates: string[]) => void
  disabled?: boolean
}

export function EventDatesPicker({
  startDate,
  endDate,
  selectedDates,
  onChange,
  disabled = false
}: EventDatesPickerProps) {
  const [allDates, setAllDates] = useState<Date[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Generate all dates between start and end
  useEffect(() => {
    if (!startDate || !endDate) {
      setAllDates([])
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const dates: Date[] = []
    const current = new Date(start)

    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    setAllDates(dates)
  }, [startDate, endDate])

  // Initialize selected dates
  useEffect(() => {
    if (selectedDates && selectedDates.length > 0) {
      setSelected(new Set(selectedDates))
    } else {
      // Default: select all dates
      setSelected(new Set(allDates.map(d => formatDate(d))))
    }
  }, [selectedDates, allDates])

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const getDayNumber = (date: Date): number => {
    return date.getDate()
  }

  const toggleDate = (dateStr: string) => {
    if (disabled) return

    const newSelected = new Set(selected)
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr)
    } else {
      newSelected.add(dateStr)
    }
    setSelected(newSelected)
    onChange(Array.from(newSelected).sort())
  }

  const selectAll = () => {
    const allDateStrs = allDates.map(d => formatDate(d))
    setSelected(new Set(allDateStrs))
    onChange(allDateStrs)
  }

  const clearAll = () => {
    setSelected(new Set())
    onChange([])
  }

  const selectWeekdays = () => {
    const weekdayDates = allDates.filter(d => {
      const day = d.getDay()
      return day !== 0 && day !== 6 // Not Sunday or Saturday
    })
    const dateStrs = weekdayDates.map(d => formatDate(d))
    setSelected(new Set(dateStrs))
    onChange(dateStrs)
  }

  if (!startDate || !endDate || allDates.length === 0) {
    return (
      <div className="alert alert-info">
        <i className="icofont-info-circle me-2"></i>
        Please select start and end dates first to configure event days
      </div>
    )
  }

  return (
    <div className="event-dates-picker">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <strong>Select Event Days</strong>
          <p className="text-muted small mb-0">
            Click dates to select/deselect • {selected.size} of {allDates.length} days selected
          </p>
        </div>
        <div className="btn-group btn-group-sm">
          <button
            type="button"
            className="btn btn-primary"
            onClick={selectAll}
            disabled={disabled}
          >
            All
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={selectWeekdays}
            disabled={disabled}
          >
            Weekdays
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearAll}
            disabled={disabled}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="dates-grid">
        {allDates.map((date) => {
          const dateStr = formatDate(date)
          const isSelected = selected.has(dateStr)
          const dayOfWeek = date.getDay()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

          return (
            <button
              key={dateStr}
              type="button"
              className={`date-cell ${isSelected ? 'selected' : ''} ${isWeekend ? 'weekend' : ''}`}
              onClick={() => toggleDate(dateStr)}
              disabled={disabled}
              title={date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            >
              <div className="day-name">{getDayName(date)}</div>
              <div className="day-number">{getDayNumber(date)}</div>
              {isSelected && (
                <div className="checkmark">
                  <i className="icofont-check"></i>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <style jsx>{`
        .dates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .date-cell {
          position: relative;
          padding: 12px 8px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .date-cell:hover:not(:disabled) {
          border-color: #007bff;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
        }

        .date-cell.selected {
          background: #007bff;
          border-color: #0056b3;
          color: white;
        }

        .date-cell.weekend {
          background: #fff3cd;
        }

        .date-cell.weekend.selected {
          background: linear-gradient(135deg, #007bff 0%, #ffc107 100%);
        }

        .date-cell:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .day-name {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .day-number {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .checkmark {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #007bff;
        }

        .selected .checkmark {
          color: #fff;
          background: rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 576px) {
          .dates-grid {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
            gap: 6px;
          }

          .date-cell {
            padding: 8px 4px;
          }

          .day-name {
            font-size: 0.65rem;
          }

          .day-number {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  )
}
