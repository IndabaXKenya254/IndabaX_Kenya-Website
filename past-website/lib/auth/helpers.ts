// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - AUTH HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════
// Utility functions for authentication and authorization
// Phase 2: Authentication Extension

import { createServerClient } from '@/lib/supabase'

/**
 * Get the currently authenticated user
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get current user's profile from database
 * @returns User profile or null
 */
export async function getCurrentUserProfile() {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

/**
 * Check if current user has admin role
 * @returns Boolean indicating if user is admin
 */
export async function isAdmin() {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return false
  }

  // Check if user has admin role in admin_roles table
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  return !!adminRole
}

/**
 * Check if current user is a reviewer for a specific event
 * @param eventId - Event ID to check
 * @returns Boolean indicating if user is reviewer for the event
 */
export async function isReviewer(eventId?: string) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return false
  }

  let query = supabase
    .from('reviewers')
    .select('id')
    .eq('user_id', user.id)

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { data } = await query.maybeSingle()

  return !!data
}

/**
 * Require authentication - throw error if not authenticated
 * Use in API routes to enforce authentication
 * @throws Error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Require admin role - throw error if not admin
 * Use in API routes to enforce admin access
 * @throws Error if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth()
  const isUserAdmin = await isAdmin()

  if (!isUserAdmin) {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * Require reviewer role - throw error if not reviewer
 * @param eventId - Optional event ID to check specific event reviewer
 * @throws Error if not reviewer
 */
export async function requireReviewer(eventId?: string) {
  const user = await requireAuth()
  const isUserReviewer = await isReviewer(eventId)

  if (!isUserReviewer) {
    throw new Error('Reviewer access required')
  }

  return user
}

/**
 * Check if user has permission for a specific action
 * @param permission - Permission to check
 * @returns Boolean indicating if user has permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return false
  }

  // Admins have all permissions
  if (await isAdmin()) {
    return true
  }

  // Check reviewer permissions if applicable
  if (permission.startsWith('reviewer:')) {
    return await isReviewer()
  }

  // Default: no permission
  return false
}
