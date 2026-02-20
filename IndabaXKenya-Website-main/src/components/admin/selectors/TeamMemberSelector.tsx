'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * TEAM MEMBER SELECTOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Multi-select component for selecting team members for events
 *
 * Features:
 * - Fetches team members from API
 * - Multi-select with checkboxes
 * - Search/filter team members
 * - Drag-and-drop to reorder (preserves display_order)
 * - Selected team members displayed as cards
 *
 * Usage:
 *   <TeamMemberSelector
 *     selectedIds={formData.team_member_ids}
 *     onChange={(ids) => setFormData({...formData, team_member_ids: ids})}
 *   />
 */

import { useState, useEffect } from 'react'

interface TeamMember {
  id: string
  name: string
  role?: string
  photo_url?: string
}

interface TeamMemberSelectorProps {
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function TeamMemberSelector({
  selectedIds = [],
  onChange,
  label = 'Event Team/Organizers',
  placeholder = 'Search team members...',
  disabled = false,
}: TeamMemberSelectorProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch team members on mount
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  async function fetchTeamMembers() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/team', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }

      const data = await response.json()
      setTeamMembers(data.data || [])
    } catch (err: any) {
      console.error('Error fetching team members:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle team member selection
  function toggleTeamMember(memberId: string) {
    if (disabled) return

    const newSelectedIds = selectedIds.includes(memberId)
      ? selectedIds.filter(id => id !== memberId)
      : [...selectedIds, memberId]

    onChange(newSelectedIds)
  }

  // Remove team member from selection
  function removeTeamMember(memberId: string) {
    if (disabled) return
    onChange(selectedIds.filter(id => id !== memberId))
  }

  // Move team member up in order
  function moveTeamMemberUp(index: number) {
    if (disabled || index === 0) return
    const newSelectedIds = [...selectedIds]
    const temp = newSelectedIds[index]
    newSelectedIds[index] = newSelectedIds[index - 1]
    newSelectedIds[index - 1] = temp
    onChange(newSelectedIds)
  }

  // Move team member down in order
  function moveTeamMemberDown(index: number) {
    if (disabled || index === selectedIds.length - 1) return
    const newSelectedIds = [...selectedIds]
    const temp = newSelectedIds[index]
    newSelectedIds[index] = newSelectedIds[index + 1]
    newSelectedIds[index + 1] = temp
    onChange(newSelectedIds)
  }

  // Filter team members by search query
  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected team member objects (in order)
  const selectedTeamMembers = selectedIds
    .map(id => teamMembers.find(m => m.id === id))
    .filter(Boolean) as TeamMember[]

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

      {/* Selected Team Members (Cards) */}
      {selectedTeamMembers.length > 0 && (
        <div className="mb-3">
          {selectedTeamMembers.map((member, index) => (
            <div
              key={member.id}
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

                {/* Team Member Photo */}
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="rounded-circle"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                    style={{ width: '40px', height: '40px', fontSize: '1rem' }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Team Member Info */}
                <div className="flex-grow-1">
                  <div className="fw-bold">{member.name}</div>
                  {member.role && (
                    <small className="text-muted">{member.role}</small>
                  )}
                </div>

                {/* Reorder Buttons */}
                {!disabled && (
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => moveTeamMemberUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => moveTeamMemberDown(index)}
                      disabled={index === selectedTeamMembers.length - 1}
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
                    onClick={() => removeTeamMember(member.id)}
                    title="Remove team member"
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
            {filteredTeamMembers.length === 0 ? (
              <div className="dropdown-item text-muted">
                No team members found
              </div>
            ) : (
              filteredTeamMembers.map(member => (
                <div
                  key={member.id}
                  className="dropdown-item d-flex align-items-center gap-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleTeamMember(member.id)}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.includes(member.id)}
                    onChange={() => {}} // Handled by parent div onClick
                    style={{ cursor: 'pointer' }}
                  />

                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="rounded-circle"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                      style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="fw-bold">{member.name}</div>
                    {member.role && (
                      <small className="text-muted d-block">{member.role}</small>
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
          Loading team members...
        </small>
      )}

      {/* Error State */}
      {error && (
        <small className="text-danger d-block mt-1">
          Error loading team members: {error}
        </small>
      )}

      {/* Help Text */}
      {!loading && !error && (
        <small className="text-muted d-block mt-1">
          Click to select team members/organizers for this event. Use ↑↓ buttons to reorder.
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
