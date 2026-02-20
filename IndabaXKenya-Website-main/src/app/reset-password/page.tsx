'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [email, setEmail] = useState('')

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('No reset token provided. Please request a new password reset link.')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setTokenError(data.error?.message || 'Invalid reset link')
        } else {
          setEmail(data.data?.email || '')
        }
      } catch (err) {
        setTokenError('Failed to validate reset link. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to reset password')
      }

      setIsSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=success')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Validating reset link...</p>
        </div>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-lg border-0">
                <div className="card-body p-5 text-center">
                  <div className="mb-4">
                    <i className="bi bi-x-circle text-danger" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h2 className="mb-3">Invalid Reset Link</h2>
                  <p className="text-muted mb-4">{tokenError}</p>
                  <div className="d-grid gap-2">
                    <Link href="/forgot-password" className="btn btn-primary">
                      Request New Reset Link
                    </Link>
                    <Link href="/login" className="btn btn-outline-secondary">
                      Back to Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-lg border-0">
                <div className="card-body p-5 text-center">
                  <div className="mb-4">
                    <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h2 className="mb-3">Password Reset Successfully!</h2>
                  <p className="text-muted mb-4">
                    Your password has been changed. You will be redirected to the login page shortly.
                  </p>
                  <div className="d-grid">
                    <Link href="/login" className="btn btn-primary">
                      Go to Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold">Reset Password</h2>
                  {email && (
                    <p className="text-muted">
                      for <strong>{email}</strong>
                    </p>
                  )}
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">New Password</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control form-control-lg"
                        id="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-control-lg"
                      id="confirmPassword"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mb-4">
                    <small className="text-muted">
                      Password must contain:
                      <ul className="mb-0 mt-1">
                        <li className={password.length >= 8 ? 'text-success' : ''}>At least 8 characters</li>
                        <li className={/[A-Z]/.test(password) ? 'text-success' : ''}>One uppercase letter</li>
                        <li className={/[a-z]/.test(password) ? 'text-success' : ''}>One lowercase letter</li>
                        <li className={/[0-9]/.test(password) ? 'text-success' : ''}>One number</li>
                        <li className={/[^A-Za-z0-9]/.test(password) ? 'text-success' : ''}>One special character</li>
                      </ul>
                    </small>
                  </div>

                  <div className="d-grid mb-4">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <Link href="/login" className="text-decoration-none">
                      <i className="bi bi-arrow-left me-1"></i>
                      Back to Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
