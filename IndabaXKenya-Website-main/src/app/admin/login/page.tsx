'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════
// Admin authentication page
// Created: Admin UI Phase 1 - Foundation

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showLoading, closeAlert } from '@/lib/sweetalert'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/admin/dashboard')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Show loading alert
    showLoading('Logging in...')

    const result = await login(email, password)

    // Close loading alert
    closeAlert()

    if (result.success) {
      router.push('/admin/dashboard')
    } else {
      setSubmitting(false)
      showError(
        'Login Failed',
        result.error || 'Invalid email or password. Please try again.'
      )
    }
  }

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return null
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <h1 className="h3 mb-2">IndabaX Kenya</h1>
                  <p className="text-muted">Admin Panel</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@deeplearningindabaxkenya.com"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Logging in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-4">
                  <small className="text-muted">
                    Forgot password? Contact system administrator
                  </small>
                </div>
              </div>
            </div>

            {/* Dev Hint */}
            <div className="text-center mt-3">
              <small className="text-muted">
                <strong>Admin Login:</strong> admin@deeplearningindabaxkenya.com
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
