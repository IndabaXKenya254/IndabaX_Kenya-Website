'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PROTECTED ROUTE WRAPPER
// ═══════════════════════════════════════════════════════════════════════
// Wrapper component to protect routes with role-based access control
// Created: Admin UI Phase 1 - Foundation
// Updated: Phase 2 - Role-Based System with Password & Email Verification

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('applicant' | 'speaker' | 'reviewer' | 'admin')[]
  /** Allow access even if mustChangePassword is true (for profile page) */
  allowPasswordChange?: boolean
  /** Allow access even if email is not verified (for profile page) */
  allowUnverified?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowPasswordChange = false,
  allowUnverified = false
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // Not authenticated - redirect to login
    if (!user) {
      router.push('/login')
      return
    }

    // Check role access
    if (allowedRoles && !allowedRoles.includes(user.role as any)) {
      const redirectMap: Record<string, string> = {
        'applicant': '/dashboard',
        'speaker': '/dashboard',
        'reviewer': '/reviewer/dashboard',
        'admin': '/admin/dashboard'
      }
      router.push(redirectMap[user.role] || '/dashboard')
      return
    }

    // For admins: Check if must change password
    if (user.role === 'admin' && user.mustChangePassword && !allowPasswordChange) {
      // Redirect to profile page to change password
      if (pathname !== '/admin/profile') {
        router.push('/admin/profile')
      }
      return
    }

    // Check if email is verified for ALL users (not just admins)
    // This prevents unverified users from accessing any protected content
    // IMPORTANT: Use !== true to catch both false AND undefined cases
    if (user.emailVerified !== true && !allowUnverified) {
      // Redirect to email verification page
      if (!pathname.startsWith('/verify-email')) {
        router.push(`/verify-email?email=${encodeURIComponent(user.email)}`)
      }
      return
    }
  }, [user, loading, router, allowedRoles, allowPasswordChange, allowUnverified, pathname])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (!user) {
    return null
  }

  // Block access if must change password (except for allowed pages)
  if (user.role === 'admin' && user.mustChangePassword && !allowPasswordChange) {
    return null
  }

  // Block access if email not verified for ALL users (except for allowed pages)
  // IMPORTANT: Use !== true to catch both false AND undefined cases
  if (user.emailVerified !== true && !allowUnverified) {
    return null
  }

  // Render protected content
  return <>{children}</>
}
