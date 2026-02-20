'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * TAG SELECTOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Multi-select component for selecting tags (event tags or post tags)
 *
 * Features:
 * - Fetches tags from API
 * - Multi-select with checkboxes
 * - Search/filter tags
 * - Selected tags displayed as badges
 * - Create new tag inline (optional)
 *
 * Usage:
 *   <TagSelector
 *     type="event"
 *     selectedIds={formData.tag_ids}
 *     onChange={(ids) => setFormData({...formData, tag_ids: ids})}
 *   />
 */

import { useState, useEffect } from 'react'

interface Tag {
  id: string
  name: string
  slug: string
}

interface TagSelectorProps {
  type: 'event' | 'post'
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function TagSelector({
  type,
  selectedIds = [],
  onChange,
  label,
  placeholder,
  disabled = false,
}: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch tags on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchTags()
  }, [type])

  async function fetchTags() {
    setLoading(true)
    setError(null)

    try {
      const endpoint = type === 'event'
        ? '/api/admin/tags/events'
        : '/api/admin/tags/posts'

      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tags')
      }

      const data = await response.json()
      setTags(data.data || [])
    } catch (err: any) {
      console.error('Error fetching tags:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle tag selection
  function toggleTag(tagId: string) {
    if (disabled) return

    const newSelectedIds = selectedIds.includes(tagId)
      ? selectedIds.filter(id => id !== tagId)
      : [...selectedIds, tagId]

    onChange(newSelectedIds)
  }

  // Remove tag from selection
  function removeTag(tagId: string) {
    if (disabled) return
    onChange(selectedIds.filter(id => id !== tagId))
  }

  // Filter tags by search query
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected tag objects
  const selectedTags = tags.filter(tag => selectedIds.includes(tag.id))

  const defaultLabel = type === 'event' ? 'Event Tags' : 'Post Tags'
  const defaultPlaceholder = 'Search tags...'

  return (
    <div className="form-group">
      {/* Label */}
      <label className="form-label">
        {label || defaultLabel}
        {selectedIds.length > 0 && (
          <span className="text-muted ms-2">
            ({selectedIds.length} selected)
          </span>
        )}
      </label>

      {/* Selected Tags (Badges) */}
      {selectedTags.length > 0 && (
        <div className="mb-2 d-flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <span
              key={tag.id}
              className="badge bg-primary d-flex align-items-center gap-2"
              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
            >
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => removeTag(tag.id)}
                  aria-label={`Remove ${tag.name}`}
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
          placeholder={placeholder || defaultPlaceholder}
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
            {filteredTags.length === 0 ? (
              <div className="dropdown-item text-muted">
                No tags found
              </div>
            ) : (
              filteredTags.map(tag => (
                <div
                  key={tag.id}
                  className="dropdown-item d-flex align-items-center gap-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleTag(tag.id)}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.includes(tag.id)}
                    onChange={() => {}} // Handled by parent div onClick
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{tag.name}</span>
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
          Loading tags...
        </small>
      )}

      {/* Error State */}
      {error && (
        <small className="text-danger d-block mt-1">
          Error loading tags: {error}
        </small>
      )}

      {/* Help Text */}
      {!loading && !error && (
        <small className="text-muted d-block mt-1">
          Click to select multiple tags. Selected tags appear as badges above.
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
