// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - AUTO-SAVE HOOK
// ═══════════════════════════════════════════════════════════════════════
// Automatically save form responses as user types (with debouncing)
// Phase 4: Registration Flow

import { useEffect, useRef, useState, useCallback } from 'react'

interface AutoSaveOptions {
  delay?: number // Delay in milliseconds before saving (default: 2000ms)
  enabled?: boolean // Whether auto-save is enabled (default: true)
  onSave?: (data: any) => Promise<void> // Callback function to save data
  onError?: (error: Error) => void // Callback for error handling
}

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
}

/**
 * Auto-save hook with debouncing
 *
 * Usage:
 * ```tsx
 * const { isSaving, lastSaved, error, triggerSave } = useAutoSave(formData, {
 *   delay: 2000,
 *   onSave: async (data) => {
 *     await fetch('/api/save', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     })
 *   },
 * })
 * ```
 */
export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions = {}
): AutoSaveState & { triggerSave: () => void } {
  const {
    delay = 2000,
    enabled = true,
    onSave,
    onError,
  } = options

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<T>(data)
  const isMountedRef = useRef(true)

  // Manual trigger function
  const triggerSave = useCallback(async () => {
    if (!onSave || !enabled) return

    try {
      setIsSaving(true)
      setError(null)
      await onSave(data)
      if (isMountedRef.current) {
        setLastSaved(new Date())
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Auto-save failed')
      if (isMountedRef.current) {
        setError(error)
      }
      onError?.(error)
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }, [data, onSave, enabled, onError])

  // Auto-save effect
  useEffect(() => {
    // Skip if auto-save is disabled or no save function provided
    if (!enabled || !onSave) return

    // Skip if data hasn't changed (deep comparison would be better, but this is a simple check)
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return
    }

    // Update previous data
    previousDataRef.current = data

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerSave()
    }, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, enabled, onSave, triggerSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isSaving,
    lastSaved,
    error,
    triggerSave,
  }
}

/**
 * Formats the last saved time for display
 *
 * Usage:
 * ```tsx
 * const { lastSaved } = useAutoSave(data, options)
 * const timeAgo = formatLastSaved(lastSaved)
 * ```
 */
export function formatLastSaved(lastSaved: Date | null): string {
  if (!lastSaved) return 'Never'

  const now = new Date()
  const diff = now.getTime() - lastSaved.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`

  return lastSaved.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
