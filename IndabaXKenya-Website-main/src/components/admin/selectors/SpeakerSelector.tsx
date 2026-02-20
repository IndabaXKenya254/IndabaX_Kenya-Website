'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * SPEAKER SELECTOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Multi-select component for selecting speakers for events
 *
 * Features:
 * - Fetches speakers from API
 * - Multi-select with checkboxes
 * - Search/filter speakers
 * - Drag-and-drop to reorder (preserves display_order)
 * - Selected speakers displayed as cards
 *
 * Usage:
 *   <SpeakerSelector
 *     selectedIds={formData.speaker_ids}
 *     onChange={(ids) => setFormData({...formData, speaker_ids: ids})}
 *   />
 */

import { useState, useEffect } from 'react'

interface Speaker {
  id: string
  name: string
  title?: string
  organization?: string
  photo_url?: string
  country?: string
}

interface SpeakerSelectorProps {
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function SpeakerSelector({
  selectedIds = [],
  onChange,
  label = 'Event Speakers',
  placeholder = 'Search speakers...',
  disabled = false,
}: SpeakerSelectorProps) {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch speakers on mount
  useEffect(() => {
    fetchSpeakers()
  }, [])

  async function fetchSpeakers() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/speakers', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch speakers')
      }

      const data = await response.json()
      setSpeakers(data.data || [])
    } catch (err: any) {
      console.error('Error fetching speakers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle speaker selection
  function toggleSpeaker(speakerId: string) {
    if (disabled) return

    const newSelectedIds = selectedIds.includes(speakerId)
      ? selectedIds.filter(id => id !== speakerId)
      : [...selectedIds, speakerId]

    onChange(newSelectedIds)
  }

  // Remove speaker from selection
  function removeSpeaker(speakerId: string) {
    if (disabled) return
    onChange(selectedIds.filter(id => id !== speakerId))
  }

  // Move speaker up in order
  function moveSpeakerUp(index: number) {
    if (disabled || index === 0) return
    const newSelectedIds = [...selectedIds]
    const temp = newSelectedIds[index]
    newSelectedIds[index] = newSelectedIds[index - 1]
    newSelectedIds[index - 1] = temp
    onChange(newSelectedIds)
  }

  // Move speaker down in order
  function moveSpeakerDown(index: number) {
    if (disabled || index === selectedIds.length - 1) return
    const newSelectedIds = [...selectedIds]
    const temp = newSelectedIds[index]
    newSelectedIds[index] = newSelectedIds[index + 1]
    newSelectedIds[index + 1] = temp
    onChange(newSelectedIds)
  }

  // Filter speakers by search query
  const filteredSpeakers = speakers.filter(speaker =>
    speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.organization?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected speaker objects (in order)
  const selectedSpeakers = selectedIds
    .map(id => speakers.find(s => s.id === id))
    .filter(Boolean) as Speaker[]

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

      {/* Selected Speakers (Cards) */}
      {selectedSpeakers.length > 0 && (
        <div className="mb-3">
          {selectedSpeakers.map((speaker, index) => (
            <div
              key={speaker.id}
              className="card mb-2"
              style={{ backgroundColor: '#f8f9fa' }}
            >
              <div className="card-body py-2 px-3 d-flex align-items-center gap-3">
                {/* Order Badge */}
                <div
                  className="badge bg-secondary"
                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {index + 1}
                </div>

                {/* Speaker Photo */}
                {speaker.photo_url && (
                  <img
                    src={speaker.photo_url}
                    alt={speaker.name}
                    className="rounded-circle"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                )}

                {/* Speaker Info */}
                <div className="flex-grow-1">
                  <div className="fw-bold">{speaker.name}</div>
                  {speaker.title && (
                    <small className="text-muted">
                      {speaker.title}
                      {speaker.organization && ` at ${speaker.organization}`}
                    </small>
                  )}
                </div>

                {/* Reorder Buttons */}
                {!disabled && (
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => moveSpeakerUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => moveSpeakerDown(index)}
                      disabled={index === selectedSpeakers.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                )}

                {/* Remove Button */}
                {!disabled && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeSpeaker(speaker.id)}
                    title="Remove speaker"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
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
              maxHeight: '400px',
              overflowY: 'auto',
              marginTop: '0.25rem',
            }}
          >
            {filteredSpeakers.length === 0 ? (
              <div className="dropdown-item text-muted">
                No speakers found
              </div>
            ) : (
              filteredSpeakers.map(speaker => (
                <div
                  key={speaker.id}
                  className="dropdown-item d-flex align-items-center gap-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleSpeaker(speaker.id)}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.includes(speaker.id)}
                    onChange={() => {}} // Handled by parent div onClick
                    style={{ cursor: 'pointer' }}
                  />

                  {speaker.photo_url && (
                    <img
                      src={speaker.photo_url}
                      alt={speaker.name}
                      className="rounded-circle"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  )}

                  <div>
                    <div className="fw-bold">{speaker.name}</div>
                    {speaker.title && (
                      <small className="text-muted d-block">
                        {speaker.title}
                        {speaker.organization && ` - ${speaker.organization}`}
                      </small>
                    )}
                  </div>
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
          Loading speakers...
        </small>
      )}

      {/* Error State */}
      {error && (
        <small className="text-danger d-block mt-1">
          Error loading speakers: {error}
        </small>
      )}

      {/* Help Text */}
      {!loading && !error && (
        <small className="text-muted d-block mt-1">
          Click to select speakers. Use ↑↓ buttons to reorder. Display order is preserved.
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
