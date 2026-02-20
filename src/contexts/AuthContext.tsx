'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - AUTHENTICATION CONTEXT
// ═══════════════════════════════════════════════════════════════════════
// Client-side authentication state management
// Created: Admin UI Phase 1 - Foundation
// Updated: Dec 30, 2025 - localStorage persistence for faster auth

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const AUTH_STORAGE_KEY = 'indabax_auth_user'

interface User {
  id: string
  email: string
  role: string
  mustChangePassword?: boolean
  emailVerified?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; errorCode?: string | null; verificationResent?: boolean; redirectTo?: string }>
  logout: () => Promise<void>
  checkSession: (forceRefresh?: boolean) => Promise<void>
  updateUserFlags: (flags: { mustChangePassword?: boolean; emailVerified?: boolean }) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper to get user from localStorage
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Check if stored data is still valid (less than 24 hours old)
      if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.user
      }
    }
  } catch (e) {
    console.error('Error reading stored user:', e)
  }
  return null
}

// Helper to store user in localStorage
const storeUser = (user: User | null) => {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user,
        timestamp: Date.now()
      }))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch (e) {
    console.error('Error storing user:', e)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize user from localStorage for instant load (but will be validated)
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  // CRITICAL: Always start loading=true to prevent premature redirects
  // The cached user is just a hint - must validate with server first
  const [loading, setLoading] = useState(true)
  const hasCheckedSession = useRef(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Sync user state with localStorage
  useEffect(() => {
    storeUser(user)
  }, [user])

  // Memoize checkSession to avoid recreating it
  const checkSession = useCallback(async (forceRefresh = false) => {
    try {
      const supabase = supabaseRef.current || createClient()

      // CRITICAL: Use getUser() instead of getSession() to validate with the server
      // getSession() reads from localStorage (can be stale/expired)
      // getUser() actually validates the token with Supabase servers
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()

      if (userError || !supabaseUser) {
        console.log('No valid user session, clearing user state and localStorage')
        setUser(null)
        storeUser(null) // Clear localStorage to prevent stale data

        // Also clear any stale Supabase session from localStorage
        // This prevents the loop where getSession() returns stale data
        await supabase.auth.signOut({ scope: 'local' })

        setLoading(false)
        return
      }

      // If we have a cached user and not forcing refresh, use it
      const cachedUser = getStoredUser()
      if (cachedUser && !forceRefresh && cachedUser.email === supabaseUser.email) {
        setUser(cachedUser)
        setLoading(false)
        return
      }

      // Fetch full user details with role from API
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      })

      const data = await response.json()

      // API returns: { success: true, data: { authenticated: true, user: {...}, role: "...", mustChangePassword, emailVerified } }
      if (data.success && data.data?.authenticated && data.data?.user) {
        const newUser = {
          id: data.data.user.id,
          email: data.data.user.email,
          role: data.data.role || 'applicant',
          mustChangePassword: data.data.mustChangePassword || false,
          emailVerified: data.data.emailVerified === true, // CRITICAL: Only true if explicitly true
        }
        setUser(newUser)
      } else {
        // API says not authenticated - clear everything
        console.log('API returned not authenticated, clearing session')
        setUser(null)
        storeUser(null)
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch (error) {
      console.error('Session check failed:', error)
      // Don't clear user on network error if we have cached data
      if (!getStoredUser()) {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Check session on mount and set up cross-tab sync
  useEffect(() => {
    // Prevent double-loading in React.StrictMode
    if (hasCheckedSession.current) return
    hasCheckedSession.current = true

    // Initial session check (use cached if available)
    checkSession(false)

    // Set up Supabase auth state listener for cross-tab sync
    const supabase = createClient()
    supabaseRef.current = supabase

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Re-check session when auth state changes (e.g., login in another tab)
        checkSession(true) // Force refresh on sign-in
      } else if (event === 'SIGNED_OUT') {
        // User signed out (possibly in another tab)
        setUser(null)
        storeUser(null) // Clear localStorage
      }
    })

    // Listen for localStorage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue)
            if (parsed.user) {
              setUser(parsed.user)
            }
          } catch (err) {
            console.error('Error parsing storage change:', err)
          }
        } else {
          setUser(null)
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Cleanup
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [checkSession])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser({
          id: data.data.user.id,
          email: data.data.user.email,
          role: data.data.role,
          mustChangePassword: data.data.mustChangePassword || false,
          emailVerified: data.data.emailVerified === true, // CRITICAL: Only true if explicitly true
        })
        return {
          success: true,
          redirectTo: data.data.redirectTo // Return role-based redirect URL
        }
      } else {
        return {
          success: false,
          error: data.error?.message || 'Login failed',
          errorCode: data.error?.code || null,
          verificationResent: data.error?.verificationResent || false,
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const updateUserFlags = (flags: { mustChangePassword?: boolean; emailVerified?: boolean }) => {
    if (user) {
      setUser({
        ...user,
        ...flags,
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession, updateUserFlags }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
