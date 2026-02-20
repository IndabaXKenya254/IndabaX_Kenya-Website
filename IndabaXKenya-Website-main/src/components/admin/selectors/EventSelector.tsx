'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * EVENT SELECTOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Multi-select dropdown for selecting events
 *
 * Features:
 * - Fetches events from API
 * - Multi-select with checkboxes
 * - Search/filter events
 * - Displays selected events with badges
 * - Works inside modals (uses React Portal with click-outside detection)
 * - Allows modal to remain scrollable when dropdown is open
 *
 * Usage:
 *   <EventSelector
 *     selectedIds={formData.event_ids}
 *     onChange={(ids) => setFormData({...formData, event_ids: ids})}
 *   />
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Event {
  id: string
  title: string
  start_date: string
  end_date?: string
  location?: string
}

interface EventSelectorProps {
  selectedIds?: string[]
  onChange: (selectedIds: string[]) => void
  label?: string
  disabled?: boolean
  excludeEventId?: string // Exclude specific event from list (useful in edit forms)
}

/**
 * Custom hook for detecting clicks outside of a referenced element
 */
function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void,
  excludeRefs: React.RefObject<HTMLElement>[] = []
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(target)) {
        return
      }

      // Do nothing if clicking excluded elements (like the trigger button)
      for (const excludeRef of excludeRefs) {
        if (excludeRef.current?.contains(target)) {
          return
        }
      }

      handler()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler, excludeRefs])
}

export default function EventSelector({
  selectedIds = [],
  onChange,
  label = 'Link Events',
  disabled = false,
  excludeEventId,
}: EventSelectorProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Track mount state for portal rendering
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Use click outside hook to close dropdown
  useClickOutside(
    dropdownRef,
    () => setShowDropdown(false),
    [buttonRef]
  )

  // Calculate dropdown position based on button
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 300 // max-height of dropdown

      // Check if dropdown would go below viewport
      const spaceBelow = viewportHeight - rect.bottom
      const shouldOpenUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight

      setDropdownPosition({
        top: shouldOpenUpward ? rect.top - dropdownHeight : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [])

  // Update position when dropdown opens or window resizes/scrolls
  useEffect(() => {
    if (showDropdown) {
      updateDropdownPosition()

      // Listen to resize and scroll events to reposition dropdown
      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition, true)

      return () => {
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition, true)
      }
    }
  }, [showDropdown, updateDropdownPosition])

  // Close dropdown on escape key
  useEffect(() => {
    if (!showDropdown) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showDropdown])

  // Fetch events on mount
  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/events?limit=100', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Filter out excluded event if provided
        const filteredEvents = excludeEventId
          ? result.data.filter((e: Event) => e.id !== excludeEventId)
          : result.data
        setEvents(filteredEvents)
      } else {
        throw new Error(result.error || 'Failed to load events')
      }
    } catch (err) {
      console.error('Event fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events

    const query = searchQuery.toLowerCase()
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
    )
  }, [events, searchQuery])

  // Get selected events
  const selectedEvents = events.filter((e) => selectedIds.includes(e.id))

  // Toggle event selection
  const toggleEvent = (eventId: string) => {
    if (selectedIds.includes(eventId)) {
      onChange(selectedIds.filter((id) => id !== eventId))
    } else {
      onChange([...selectedIds, eventId])
    }
  }

  // Remove event badge
  const removeEvent = (eventId: string) => {
    onChange(selectedIds.filter((id) => id !== eventId))
  }

  // Format date range
  const formatDateRange = (event: Event) => {
    const startDate = new Date(event.start_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    if (event.end_date && event.end_date !== event.start_date) {
      const endDate = new Date(event.end_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      return `${startDate} - ${endDate}`
    }

    return startDate
  }

  // Handle toggle with mousedown to prevent event order issues
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setShowDropdown(!showDropdown)
    }
  }

  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        <span className="text-muted ms-2">(Optional)</span>
      </label>
      <small className="d-block text-muted mb-2">
        Select events that will be held at this venue
      </small>

      {/* Selected Events Display */}
      {selectedEvents.length > 0 && (
        <div className="mb-2">
          {selectedEvents.map((event) => {
            // Extract just the event name (remove theme text after colon)
            const titleParts = event.title.split(':');
            const eventNameOnly = titleParts[0].trim();

            return (
              <span key={event.id} className="badge bg-primary me-2 mb-2 py-2 px-3">
                {eventNameOnly}
                {!disabled && (
                  <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    style={{ fontSize: '0.6rem' }}
                    onClick={() => removeEvent(event.id)}
                    aria-label="Remove"
                  ></button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="form-control">
          <span className="text-muted">Loading events...</span>
        </div>
      ) : error ? (
        <div className="alert alert-warning mb-0">
          <i className="icofont-warning me-2"></i>
          {error}
        </div>
      ) : (
        <div className="dropdown" style={{ position: 'relative' }}>
          {/* Dropdown Toggle Button */}
          <button
            ref={buttonRef}
            type="button"
            className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center"
            onMouseDown={handleToggle}
            disabled={disabled}
          >
            <span>
              {selectedIds.length > 0
                ? `${selectedIds.length} event${selectedIds.length > 1 ? 's' : ''} selected`
                : 'Select events...'}
            </span>
            <i className={`icofont-simple-${showDropdown ? 'up' : 'down'}`}></i>
          </button>

        </div>
      )}

      {/* Dropdown Menu - Rendered via Portal for proper stacking in modals */}
      {showDropdown && isMounted && createPortal(
        <div
          ref={dropdownRef}
          className="dropdown-menu show"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 10051,
            maxHeight: '300px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
          }}
        >
          {/* Search Input */}
          <div className="px-3 py-2 border-bottom bg-light">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* Event List */}
          {filteredEvents.length === 0 ? (
            <div className="px-3 py-3 text-muted text-center">
              <i className="icofont-calendar me-2"></i>
              {searchQuery ? 'No events found' : 'No events available'}
            </div>
          ) : (
            filteredEvents.map((event) => {
              // Extract just the event name (remove theme text after colon)
              const titleParts = event.title.split(':');
              const eventNameOnly = titleParts[0].trim();

              return (
                <div
                  key={event.id}
                  className="dropdown-item py-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="form-check mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedIds.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="form-check-label w-100" style={{ cursor: 'pointer' }}>
                      <div className="fw-semibold">{eventNameOnly}</div>
                      <small className="text-muted d-block">
                        {formatDateRange(event)}
                        {event.location && ` • ${event.location}`}
                      </small>
                    </label>
                  </div>
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}

      {!loading && events.length === 0 && (
        <small className="text-warning d-block mt-1">
          No events available. Create events first in Events Management.
        </small>
      )}
    </div>
  )
}
