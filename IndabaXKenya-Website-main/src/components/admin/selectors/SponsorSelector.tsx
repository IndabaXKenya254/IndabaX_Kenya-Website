'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * SPONSOR SELECTOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Multi-select component for selecting sponsors for events
 *
 * Features:
 * - Fetches sponsors from API
 * - Multi-select with checkboxes
 * - Search/filter sponsors
 * - Drag-and-drop to reorder (preserves display_order)
 * - Selected sponsors displayed as cards
 *
 * Usage:
 *   <SponsorSelector
 *     selectedIds={formData.sponsor_ids}
 *     onChange={(ids) => setFormData({...formData, sponsor_ids: ids})}
 *   />
 */

import { useState, useEffect } from 'react'

interface Sponsor {
  id: string
  name: string
  logo_url?: string
  tier?: string
  website_url?: string
}

interface SponsorSelectorProps {
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function SponsorSelector({
  selectedIds = [],
  onChange,
  label = 'Event Sponsors',
  placeholder = 'Search sponsors...',
  disabled = false,
}: SponsorSelectorProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch sponsors on mount
  useEffect(() => {
    fetchSponsors()
  }, [])

  async function fetchSponsors() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/sponsors', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sponsors')
      }

      const data = await response.json()
      setSponsors(data.data || [])
    } catch (err: any) {
      console.error('Error fetching sponsors:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle sponsor selection
  function toggleSponsor(sponsorId: string) {
    if (disabled) return

    const newSelectedIds = selectedIds.includes(sponsorId)
      ? selectedIds.filter(id => id !== sponsorId)
      : [...selectedIds, sponsorId]

    onChange(newSelectedIds)
  }

  // Remove sponsor from selection
  function removeSponsor(sponsorId: string) {
    if (disabled) return
    onChange(selectedIds.filter(id => id !== sponsorId))
  }

  // Move sponsor up in order
  function moveSponsorUp(index: number) {
    if (disabled || index === 0) return
    const newSelectedIds = [...selectedIds]
    const temp = newSelectedIds[index]
    newSelectedIds[index] = newSelectedIds[index - 1]
    newSelectedIds[index - 1] = temp
    onChange(newSelectedIds)
  }

  // Move sponsor down in order
  function moveSponsorDown(index: number) {
    if (disabled || index === selectedIds.length - 1) return
    const newSelectedIds = [...selectedIds]
    const temp = newSelectedIds[index]
    newSelectedIds[index] = newSelectedIds[index + 1]
    newSelectedIds[index + 1] = temp
    onChange(newSelectedIds)
  }

  // Filter sponsors by search query
  const filteredSponsors = sponsors.filter(sponsor =>
    sponsor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sponsor.tier?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected sponsor objects (in order)
  const selectedSponsors = selectedIds
    .map(id => sponsors.find(s => s.id === id))
    .filter(Boolean) as Sponsor[]

  // Tier badge colors
  const tierColors: Record<string, string> = {
    platinum: 'bg-secondary',
    gold: 'bg-warning text-dark',
    silver: 'bg-light text-dark',
    bronze: 'bg-danger bg-opacity-75',
    partner: 'bg-info',
    community: 'bg-success',
  }

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

      {/* Selected Sponsors (Cards) */}
      {selectedSponsors.length > 0 && (
        <div className="mb-3">
          {selectedSponsors.map((sponsor, index) => (
            <div
              key={sponsor.id}
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

                {/* Sponsor Logo */}
                {sponsor.logo_url && (
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                  />
                )}

                {/* Sponsor Info */}
                <div className="flex-grow-1">
                  <div className="fw-bold">{sponsor.name}</div>
                  {sponsor.tier && (
                    <span className={`badge ${tierColors[sponsor.tier] || 'bg-secondary'} text-uppercase`} style={{ fontSize: '0.7rem' }}>
                      {sponsor.tier}
                    </span>
                  )}
                </div>

                {/* Reorder Buttons */}
                {!disabled && (
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => moveSponsorUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => moveSponsorDown(index)}
                      disabled={index === selectedSponsors.length - 1}
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
                    onClick={() => removeSponsor(sponsor.id)}
                    title="Remove sponsor"
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
            {filteredSponsors.length === 0 ? (
              <div className="dropdown-item text-muted">
                No sponsors found
              </div>
            ) : (
              filteredSponsors.map(sponsor => (
                <div
                  key={sponsor.id}
                  className="dropdown-item d-flex align-items-center gap-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleSponsor(sponsor.id)}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.includes(sponsor.id)}
                    onChange={() => {}} // Handled by parent div onClick
                    style={{ cursor: 'pointer' }}
                  />

                  {sponsor.logo_url && (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    />
                  )}

                  <div className="flex-grow-1">
                    <div className="fw-bold">{sponsor.name}</div>
                    {sponsor.tier && (
                      <span className={`badge ${tierColors[sponsor.tier] || 'bg-secondary'} text-uppercase`} style={{ fontSize: '0.65rem' }}>
                        {sponsor.tier}
                      </span>
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
          Loading sponsors...
        </small>
      )}

      {/* Error State */}
      {error && (
        <small className="text-danger d-block mt-1">
          Error loading sponsors: {error}
        </small>
      )}

      {/* Help Text */}
      {!loading && !error && (
        <small className="text-muted d-block mt-1">
          Click to select sponsors. Use ↑↓ buttons to reorder. Display order is preserved.
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
