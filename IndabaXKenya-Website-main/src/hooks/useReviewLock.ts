// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEW LOCK HOOK (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Custom hook for managing application review locks

import { useState, useEffect, useCallback, useRef } from 'react'

interface LockStatus {
  is_locked: boolean
  locked_by_user_id: string | null
  locked_by_email: string | null
  locked_at: string | null
  expires_at: string | null
  is_owned_by_requester: boolean
}

interface UseLockOptions {
  applicationId: string
  autoAcquire?: boolean // Auto-acquire lock on mount
  autoExtend?: boolean // Auto-extend lock every 20 minutes
  autoRelease?: boolean // Auto-release lock on unmount
  onLockAcquired?: () => void
  onLockLost?: () => void
  onLockConflict?: (lockedBy: string) => void
}

interface UseLockReturn {
  lockStatus: LockStatus | null
  isLoading: boolean
  error: string | null
  hasLock: boolean
  isLockedByOther: boolean
  timeUntilExpiry: number | null // Seconds until expiry
  acquireLock: () => Promise<boolean>
  releaseLock: () => Promise<boolean>
  extendLock: () => Promise<boolean>
  forceUnlock: () => Promise<boolean>
  checkStatus: () => Promise<void>
}

/**
 * Hook for managing application review locks
 *
 * Features:
 * - Auto-acquire lock on mount (optional)
 * - Auto-extend lock every 20 minutes (optional)
 * - Auto-release lock on unmount (optional)
 * - Countdown timer until lock expiry
 * - Lock conflict detection
 *
 * @example
 * const { hasLock, isLockedByOther, timeUntilExpiry, acquireLock, releaseLock } = useReviewLock({
 *   applicationId: 'uuid',
 *   autoAcquire: true,
 *   autoExtend: true,
 *   autoRelease: true
 * })
 */
export function useReviewLock(options: UseLockOptions): UseLockReturn {
  const {
    applicationId,
    autoAcquire = true,
    autoExtend = true,
    autoRelease = true,
    onLockAcquired,
    onLockLost,
    onLockConflict,
  } = options

  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)

  const extendIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasAcquiredRef = useRef(false)
  const isAcquiringRef = useRef(false) // Prevent double acquisition on mount

  // ═══════════════════════════════════════════════════════════════════════
  // Check lock status
  // ═══════════════════════════════════════════════════════════════════════

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/lock`)
      const result = await response.json()
      console.log('[checkStatus] API response:', result)

      if (result.success) {
        console.log('[checkStatus] Setting lockStatus to:', result.data)
        setLockStatus(result.data)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Failed to check lock status:', err)
      setError('Failed to check lock status')
    }
  }, [applicationId])

  // ═══════════════════════════════════════════════════════════════════════
  // Acquire lock
  // ═══════════════════════════════════════════════════════════════════════

  const acquireLock = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent acquisitions
    if (isAcquiringRef.current) {
      console.log('[acquireLock] Already acquiring lock, skipping...')
      return false
    }

    isAcquiringRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lock_duration_minutes: 30 })
      })

      const result = await response.json()
      console.log('[acquireLock] API response:', result)

      if (result.success) {
        // Lock acquired or extended
        console.log('[acquireLock] Using expires_at from POST response:', result.data.expires_at)

        // Update lockStatus immediately with the new expires_at from the POST response
        // This ensures the timer updates immediately without race conditions
        setLockStatus(prev => ({
          ...(prev || {}),
          expires_at: result.data.expires_at,
          locked_at: new Date().toISOString(),
          is_locked: true,
          is_owned_by_requester: true,
          locked_by_user_id: prev?.locked_by_user_id || null,
          locked_by_email: prev?.locked_by_email || null
        }))

        // Don't call checkStatus() here - it causes a race condition where stale data
        // from the database overwrites our fresh data from the POST response.
        // The POST response already has all the data we need.

        hasAcquiredRef.current = true
        onLockAcquired?.()
        setIsLoading(false)
        isAcquiringRef.current = false
        return true
      } else if (response.status === 409) {
        // Lock conflict (locked by someone else)
        await checkStatus()
        onLockConflict?.(result.error)
        setError(result.error)
        setIsLoading(false)
        isAcquiringRef.current = false
        return false
      } else {
        setError(result.error)
        setIsLoading(false)
        isAcquiringRef.current = false
        return false
      }
    } catch (err) {
      console.error('Failed to acquire lock:', err)
      setError('Failed to acquire lock')
      setIsLoading(false)
      isAcquiringRef.current = false
      return false
    }
  }, [applicationId, checkStatus, onLockAcquired, onLockConflict])

  // ═══════════════════════════════════════════════════════════════════════
  // Release lock
  // ═══════════════════════════════════════════════════════════════════════

  const releaseLock = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/lock`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await checkStatus()
        hasAcquiredRef.current = false
        setIsLoading(false)
        return true
      } else {
        setError(result.error)
        setIsLoading(false)
        return false
      }
    } catch (err) {
      console.error('Failed to release lock:', err)
      setError('Failed to release lock')
      setIsLoading(false)
      return false
    }
  }, [applicationId, checkStatus])

  // ═══════════════════════════════════════════════════════════════════════
  // Extend lock (same as acquire)
  // ═══════════════════════════════════════════════════════════════════════

  const extendLock = useCallback(async (): Promise<boolean> => {
    return acquireLock()
  }, [acquireLock])

  // ═══════════════════════════════════════════════════════════════════════
  // Force unlock (admin only)
  // ═══════════════════════════════════════════════════════════════════════

  const forceUnlock = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/applications/${applicationId}/lock?force=true`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (result.success) {
        await checkStatus()
        setIsLoading(false)
        return true
      } else {
        setError(result.error)
        setIsLoading(false)
        return false
      }
    } catch (err) {
      console.error('Failed to force unlock:', err)
      setError('Failed to force unlock')
      setIsLoading(false)
      return false
    }
  }, [applicationId, checkStatus])

  // ═══════════════════════════════════════════════════════════════════════
  // Countdown timer
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (lockStatus?.expires_at && lockStatus.is_owned_by_requester) {
      // Calculate initial time until expiry
      const calculateTimeRemaining = () => {
        const expiresAt = new Date(lockStatus.expires_at!)
        const now = new Date()
        return Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      }

      // Set initial value
      const initial = calculateTimeRemaining()
      console.log('[useReviewLock] Timer updated - expires_at:', lockStatus.expires_at, 'seconds remaining:', initial)
      setTimeUntilExpiry(initial)

      // Update countdown every second
      countdownIntervalRef.current = setInterval(() => {
        const secondsUntilExpiry = calculateTimeRemaining()
        setTimeUntilExpiry(secondsUntilExpiry)

        // Lock expired
        if (secondsUntilExpiry === 0) {
          onLockLost?.()
          checkStatus()
        }
      }, 1000)

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
      }
    } else {
      setTimeUntilExpiry(null)
    }
  }, [lockStatus?.expires_at, lockStatus?.is_owned_by_requester, checkStatus, onLockLost])

  // ═══════════════════════════════════════════════════════════════════════
  // Auto-acquire on mount
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (autoAcquire) {
      acquireLock()
    } else {
      checkStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // ═══════════════════════════════════════════════════════════════════════
  // Auto-extend every 20 minutes
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (autoExtend && lockStatus?.is_owned_by_requester) {
      // Extend lock every 20 minutes (before 30-min expiry)
      extendIntervalRef.current = setInterval(() => {
        console.log('Auto-extending lock...')
        extendLock()
      }, 20 * 60 * 1000) // 20 minutes

      return () => {
        if (extendIntervalRef.current) {
          clearInterval(extendIntervalRef.current)
        }
      }
    }
  }, [autoExtend, lockStatus, extendLock])

  // ═══════════════════════════════════════════════════════════════════════
  // Auto-release on unmount
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      if (autoRelease && hasAcquiredRef.current) {
        // Release lock when component unmounts
        fetch(`/api/admin/applications/${applicationId}/lock`, {
          method: 'DELETE',
          keepalive: true // Ensure request completes even if page unloading
        }).catch(err => console.error('Failed to auto-release lock:', err))
      }
    }
  }, [autoRelease, applicationId])

  // ═══════════════════════════════════════════════════════════════════════
  // Derived state
  // ═══════════════════════════════════════════════════════════════════════

  const hasLock = lockStatus?.is_locked === true && lockStatus?.is_owned_by_requester === true
  const isLockedByOther = lockStatus?.is_locked === true && lockStatus?.is_owned_by_requester === false

  return {
    lockStatus,
    isLoading,
    error,
    hasLock,
    isLockedByOther,
    timeUntilExpiry,
    acquireLock,
    releaseLock,
    extendLock,
    forceUnlock,
    checkStatus,
  }
}
