'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * VENUE SELECTOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Single-select dropdown for selecting an event venue
 *
 * Features:
 * - Fetches venues from API
 * - Single-select dropdown
 * - Search/filter venues
 * - Displays selected venue
 * - Optional "No venue" selection
 *
 * Usage:
 *   <VenueSelector
 *     selectedId={formData.venue_id}
 *     onChange={(id) => setFormData({...formData, venue_id: id})}
 *   />
 */

import { useState, useEffect } from 'react'

interface Venue {
  id: string
  name: string
  city?: string | null
  country: string
}

interface VenueSelectorProps {
  selectedId?: string | null
  onChange: (selectedId: string | null) => void
  label?: string
  disabled?: boolean
}

export default function VenueSelector({
  selectedId,
  onChange,
  label = 'Venue',
  disabled = false,
}: VenueSelectorProps) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch venues on mount
  useEffect(() => {
    fetchVenues()
  }, [])

  async function fetchVenues() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/venues?limit=100', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch venues')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setVenues(result.data)
      } else {
        throw new Error(result.error || 'Failed to load venues')
      }
    } catch (err) {
      console.error('Venue fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load venues')
    } finally {
      setLoading(false)
    }
  }

  // Get selected venue name
  const selectedVenue = venues.find(v => v.id === selectedId)
  const displayText = selectedVenue
    ? `${selectedVenue.name}${selectedVenue.city ? `, ${selectedVenue.city}` : ''}`
    : 'No venue'

  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        <span className="text-muted ms-2">(Optional)</span>
      </label>

      {loading ? (
        <div className="form-control">
          <span className="text-muted">Loading venues...</span>
        </div>
      ) : error ? (
        <div className="alert alert-warning mb-0">
          <i className="icofont-warning me-2"></i>
          {error}
        </div>
      ) : (
        <select
          className="form-select"
          value={selectedId || ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
          disabled={disabled}
        >
          <option value="">No venue (online/TBD)</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
              {venue.city && `, ${venue.city}`}
              {venue.country && ` - ${venue.country}`}
            </option>
          ))}
        </select>
      )}

      {selectedVenue && (
        <small className="text-muted d-block mt-1">
          <i className="icofont-location-pin me-1"></i>
          Selected: {displayText}
        </small>
      )}

      {!loading && venues.length === 0 && (
        <small className="text-warning d-block mt-1">
          No venues available. Create venues first in Venues Management.
        </small>
      )}
    </div>
  )
}
