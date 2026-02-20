'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * EXPERTISE SELECTOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Multi-select component for selecting expertise areas for speakers
 *
 * Features:
 * - Fetches expertise areas from API
 * - Multi-select with checkboxes
 * - Search/filter expertise
 * - Selected expertise displayed as badges
 *
 * Usage:
 *   <ExpertiseSelector
 *     selectedIds={formData.expertise_ids}
 *     onChange={(ids) => setFormData({...formData, expertise_ids: ids})}
 *   />
 */

import { useState, useEffect } from 'react'

interface Expertise {
  id: string
  name: string
  slug: string
}

interface ExpertiseSelectorProps {
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function ExpertiseSelector({
  selectedIds = [],
  onChange,
  label = 'Expertise Areas',
  placeholder = 'Search expertise...',
  disabled = false,
}: ExpertiseSelectorProps) {
  const [expertiseList, setExpertiseList] = useState<Expertise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch expertise on mount
  useEffect(() => {
    fetchExpertise()
  }, [])

  async function fetchExpertise() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/expertise', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch expertise areas')
      }

      const data = await response.json()
      setExpertiseList(data.data || [])
    } catch (err: any) {
      console.error('Error fetching expertise:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle expertise selection
  function toggleExpertise(expertiseId: string) {
    if (disabled) return

    const newSelectedIds = selectedIds.includes(expertiseId)
      ? selectedIds.filter(id => id !== expertiseId)
      : [...selectedIds, expertiseId]

    onChange(newSelectedIds)
  }

  // Remove expertise from selection
  function removeExpertise(expertiseId: string) {
    if (disabled) return
    onChange(selectedIds.filter(id => id !== expertiseId))
  }

  // Filter expertise by search query
  const filteredExpertise = expertiseList.filter(exp =>
    exp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected expertise objects
  const selectedExpertise = expertiseList.filter(exp => selectedIds.includes(exp.id))

  return (
    <div className="form-group">
      {/* Label */}
      <label className="form-label">
        {label}
        {selectedIds.length > 0 && (
          <span className="text-muted ms-2">
            ({selectedIds.length} selected)
          </span>
        )}
      </label>

      {/* Selected Expertise (Badges) */}
      {selectedExpertise.length > 0 && (
        <div className="mb-2 d-flex flex-wrap gap-2">
          {selectedExpertise.map(exp => (
            <span
              key={exp.id}
              className="badge bg-success d-flex align-items-center gap-2"
              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
            >
              {exp.name}
              {!disabled && (
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => removeExpertise(exp.id)}
                  aria-label={`Remove ${exp.name}`}
                />
              )}
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Toggle Input */}
      <div className="position-relative">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          disabled={disabled || loading}
        />

        {/* Dropdown Menu */}
        {showDropdown && !loading && !error && (
          <div
            className="dropdown-menu show w-100 shadow"
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              marginTop: '0.25rem',
            }}
          >
            {filteredExpertise.length === 0 ? (
              <div className="dropdown-item text-muted">
                No expertise areas found
              </div>
            ) : (
              filteredExpertise.map(exp => (
                <div
                  key={exp.id}
                  className="dropdown-item d-flex align-items-center gap-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpertise(exp.id)}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.includes(exp.id)}
                    onChange={() => {}} // Handled by parent div onClick
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{exp.name}</span>
                </div>
              ))
            )}

            <div className="dropdown-divider" />
            <button
              type="button"
              className="dropdown-item text-primary"
              onClick={() => setShowDropdown(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <small className="text-muted d-block mt-1">
          Loading expertise areas...
        </small>
      )}

      {/* Error State */}
      {error && (
        <small className="text-danger d-block mt-1">
          Error loading expertise: {error}
        </small>
      )}

      {/* Help Text */}
      {!loading && !error && (
        <small className="text-muted d-block mt-1">
          Click to select multiple expertise areas. Selected areas appear as badges above.
        </small>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: -1 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
