// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ACTIVITY LOGGING (Issue #2)
// ═══════════════════════════════════════════════════════════════════════
// Lightweight, non-blocking activity logger for API routes
// Logs are fire-and-forget to avoid impacting request performance

import { createAdminClient } from '@/lib/supabase'

interface LogEntry {
  user_id?: string
  user_email?: string
  user_role?: string
  log_action: string
  resource_type?: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  duration_ms?: number
  status_code?: number
}

/**
 * Log an activity to the activity_logs table.
 * This is fire-and-forget - errors are silently caught to avoid
 * impacting the main request flow.
 */
export function logActivity(entry: LogEntry): void {
  // Fire-and-forget - don't await, don't block
  const supabase = createAdminClient()
  supabase
    .from('activity_logs')
    .insert(entry)
    .then(() => {})
    .catch((err: any) => {
      console.error('[ActivityLog] Failed to log:', err?.message || err)
    })
}

/**
 * Create a request timer for tracking API response times.
 * Usage:
 *   const timer = startTimer()
 *   // ... process request ...
 *   logActivity({ log_action: 'get_events', duration_ms: timer() })
 */
export function startTimer(): () => number {
  const start = Date.now()
  return () => Date.now() - start
}
