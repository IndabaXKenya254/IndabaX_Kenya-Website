// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ZOD HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════════════
// Helper functions for working with Zod validation
// Created: Day 4 Phase 2 - Content Management

import { ZodError } from 'zod'

/**
 * Get the first error message from a Zod validation error
 * Works with Zod v4 API (uses .issues instead of .errors)
 */
export function getFirstZodError(error: ZodError<any>): string {
  const firstIssue = error.issues[0]
  if (!firstIssue) return 'Validation error'

  const path = firstIssue.path.join('.')
  const message = firstIssue.message

  return path ? `${path}: ${message}` : message
}
