// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - LOCK INDICATOR COMPONENT (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Displays lock status with countdown timer and actions

import React from 'react'

interface LockIndicatorProps {
  hasLock: boolean
  isLockedByOther: boolean
  lockedByName?: string | null
  lockedByEmail?: string | null
  timeUntilExpiry: number | null // Seconds
  onExtendLock?: () => void
  onReleaseLock?: () => void
  onForceUnlock?: () => void
  onAcquireLock?: () => void
  isAdmin?: boolean
  lockActionLoading?: boolean
  canReview?: boolean
}

/**
 * LockIndicator Component
 *
 * Shows lock status with countdown timer and action buttons
 *
 * Variants:
 * 1. User has lock (green) - Shows countdown, extend/release buttons
 * 2. Locked by another user (red) - Shows who locked it, force unlock (admin only)
 * 3. Unlocked (gray) - No lock active
 */
export function LockIndicator({
  hasLock,
  isLockedByOther,
  lockedByName,
  lockedByEmail,
  timeUntilExpiry,
  onExtendLock,
  onReleaseLock,
  onForceUnlock,
  onAcquireLock,
  isAdmin = false,
  lockActionLoading = false,
  canReview = true,
}: LockIndicatorProps) {
  // ═══════════════════════════════════════════════════════════════════════
  // Format time remaining
  // ═══════════════════════════════════════════════════════════════════════

  const formatTimeRemaining = (seconds: number | null): string => {
    if (seconds === null) return ''

    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Get progress bar color based on time remaining
  // ═══════════════════════════════════════════════════════════════════════

  const getProgressColor = (seconds: number | null): string => {
    if (seconds === null) return 'success'

    const minutes = Math.floor(seconds / 60)

    if (minutes > 15) return 'success' // Green (> 15 min)
    if (minutes > 5) return 'warning' // Yellow (5-15 min)
    return 'danger' // Red (< 5 min)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Calculate progress percentage
  // ═══════════════════════════════════════════════════════════════════════

  const getProgressPercentage = (seconds: number | null): number => {
    if (seconds === null) return 0

    const totalSeconds = 30 * 60 // 30 minutes
    return Math.max(0, Math.min(100, (seconds / totalSeconds) * 100))
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VARIANT 1: User has lock (green)
  // ═══════════════════════════════════════════════════════════════════════

  if (hasLock) {
    return (
      <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
        <div className="flex-grow-1">
          <div className="d-flex align-items-center mb-2">
            <i className="icofont-lock me-2" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <strong>You have the lock</strong>
              <div className="text-muted small">
                Expires in {formatTimeRemaining(timeUntilExpiry)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {timeUntilExpiry !== null && (
            <div className="progress" style={{ height: '8px' }}>
              <div
                className={`progress-bar bg-${getProgressColor(timeUntilExpiry)}`}
                role="progressbar"
                style={{ width: `${getProgressPercentage(timeUntilExpiry)}%` }}
                aria-valuenow={getProgressPercentage(timeUntilExpiry)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ms-3">
          <button
            className="btn btn-sm btn-outline-success me-2"
            onClick={onExtendLock}
            disabled={lockActionLoading}
            title="Extend lock by 30 minutes"
          >
            {lockActionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Extending...
              </>
            ) : (
              <>
                <i className="icofont-refresh"></i> Extend
              </>
            )}
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onReleaseLock}
            disabled={lockActionLoading}
            title="Release lock"
          >
            {lockActionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Releasing...
              </>
            ) : (
              <>
                <i className="icofont-unlock"></i> Release
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VARIANT 2: Locked by another user (red)
  // ═══════════════════════════════════════════════════════════════════════

  if (isLockedByOther) {
    return (
      <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
        <div className="flex-grow-1">
          <div className="d-flex align-items-center">
            <i className="icofont-lock me-2" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <strong>Application is currently being reviewed</strong>
              <div className="text-muted small">
                Locked by: {lockedByName || lockedByEmail || 'Another user'}
                {timeUntilExpiry !== null && (
                  <> · Expires in {formatTimeRemaining(timeUntilExpiry)}</>
                )}
              </div>
              <div className="text-muted small mt-1">
                <i className="icofont-info-circle"></i> You can view this application in read-only mode.
                {isAdmin && ' As an admin, you can force unlock if necessary.'}
              </div>
            </div>
          </div>
        </div>

        {/* Force unlock button (admin only) */}
        {isAdmin && onForceUnlock && (
          <div className="ms-3">
            <button
              className="btn btn-sm btn-warning"
              onClick={() => {
                if (confirm('Force unlock this application? The current reviewer will lose their lock.')) {
                  onForceUnlock()
                }
              }}
              title="Force unlock (admin only)"
            >
              <i className="icofont-warning"></i> Force Unlock
            </button>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VARIANT 3: No lock (gray) - With acquire button
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="alert alert-secondary d-flex align-items-center mb-3" role="alert">
      <div className="flex-grow-1">
        <div className="d-flex align-items-center">
          <i className="icofont-unlock me-2" style={{ fontSize: '1.5rem' }}></i>
          <div>
            <strong>Application is unlocked</strong>
            <div className="text-muted small">
              {canReview
                ? 'Click "Acquire Lock" to start reviewing and add notes'
                : 'No active review session'}
            </div>
          </div>
        </div>
      </div>

      {/* Acquire lock button */}
      {canReview && onAcquireLock && (
        <div className="ms-3">
          <button
            className="btn btn-sm btn-primary"
            onClick={onAcquireLock}
            disabled={lockActionLoading}
            title="Acquire lock to start reviewing"
          >
            {lockActionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Acquiring...
              </>
            ) : (
              <>
                <i className="icofont-lock"></i> Acquire Lock
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPACT VARIANT - For use in tables/lists
// ═══════════════════════════════════════════════════════════════════════

interface LockBadgeProps {
  hasLock: boolean
  isLockedByOther: boolean
  lockedByName?: string | null
  timeUntilExpiry: number | null
}

/**
 * LockBadge Component (Compact)
 *
 * Small badge variant for tables/lists
 */
export function LockBadge({
  hasLock,
  isLockedByOther,
  lockedByName,
  timeUntilExpiry,
}: LockBadgeProps) {
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return ''
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  if (hasLock) {
    return (
      <span className="badge bg-success" title={`You have the lock (${formatTime(timeUntilExpiry)} remaining)`}>
        <i className="icofont-lock"></i> Locked by you ({formatTime(timeUntilExpiry)})
      </span>
    )
  }

  if (isLockedByOther) {
    return (
      <span className="badge bg-danger" title={`Locked by ${lockedByName || 'another user'}`}>
        <i className="icofont-lock"></i> Locked by {lockedByName || 'other'}
      </span>
    )
  }

  return (
    <span className="badge bg-secondary" title="No active lock">
      <i className="icofont-unlock"></i> Unlocked
    </span>
  )
}
