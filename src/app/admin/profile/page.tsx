'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════
// Admin profile with change password functionality
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { getSwal } from '@/lib/sweetalert'

export default function AdminProfilePage() {
  const { user, updateUserFlags } = useAuth()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [emailVerificationPending, setEmailVerificationPending] = useState(false)

  // Check user status (use AuthContext data first, no extra API call needed)
  useEffect(() => {
    if (!user?.id) return

    // Use cached user data from AuthContext - instant, no API call
    if (user.mustChangePassword) {
      setMustChangePassword(true)
      setIsChangingPassword(true)
    }
    // Check if email verification is pending (password changed but not verified)
    if (!user.mustChangePassword && user.emailVerified === false) {
      setEmailVerificationPending(true)
    }
  }, [user?.id, user?.mustChangePassword, user?.emailVerified])

  const validatePassword = () => {
    if (newPassword.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(newPassword)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(newPassword)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(newPassword)) {
      return 'Password must contain at least one number'
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return 'Password must contain at least one special character'
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match'
    }
    return null
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const Swal = await getSwal()

    const validationError = validatePassword()
    if (validationError) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: validationError,
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to change password')
      }

      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsChangingPassword(false)
      setMustChangePassword(false)

      // Update AuthContext flags
      updateUserFlags({
        mustChangePassword: false,
        emailVerified: !data.requiresVerification // Not verified if verification required
      })

      // Check if verification is required (invited admin flow)
      if (data.requiresVerification) {
        setEmailVerificationPending(true)
        Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          html: `
            <p>Your password has been updated successfully.</p>
            <p><strong>Important:</strong> A verification email has been sent to your email address.</p>
            <p>Please check your inbox and click the verification link to complete your account setup.</p>
          `,
          confirmButtonText: 'I understand',
        })
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Password Changed',
          text: 'Your password has been updated successfully.',
        })
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to change password',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']} allowPasswordChange={true} allowUnverified={true}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-2">Profile Settings</h2>
            <p className="text-muted">Manage your account settings and security</p>
          </div>
        </div>

        {/* Must Change Password Alert */}
        {mustChangePassword && (
          <div className="alert alert-warning mb-4">
            <strong><i className="bi bi-exclamation-triangle me-2"></i>Action Required:</strong> You must change your password before continuing to use the admin panel.
          </div>
        )}

        {/* Email Verification Pending Alert */}
        {emailVerificationPending && !mustChangePassword && (
          <div className="alert alert-info mb-4">
            <strong><i className="bi bi-envelope-exclamation me-2"></i>Email Verification Required:</strong> A verification email has been sent to your inbox. Please click the link in the email to verify your account and gain full access to the admin panel.
          </div>
        )}

        <div className="row">
          {/* Profile Info Card */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <div className="mb-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                    style={{ width: '80px', height: '80px', fontSize: '32px' }}
                  >
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
                <h5 className="card-title mb-1">{user?.email?.split('@')[0] || 'Admin'}</h5>
                <p className="text-muted mb-2">{user?.email}</p>
                <span className="badge bg-primary">{user?.role || 'Admin'}</span>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="col-lg-8 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-shield-lock me-2"></i>Security
                </h5>
                {!isChangingPassword && !mustChangePassword && (
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    <i className="bi bi-key me-1"></i>Change Password
                  </button>
                )}
              </div>
              <div className="card-body">
                {isChangingPassword ? (
                  <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                      <label htmlFor="currentPassword" className="form-label">
                        Current Password
                      </label>
                      <div className="input-group">
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          className="form-control"
                          id="currentPassword"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          disabled={isSubmitting}
                          placeholder="Enter your current password"
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          <i className={`bi bi-eye${showPasswords ? '-slash' : ''}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">
                        New Password
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        className="form-control"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm New Password
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        className="form-control"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="mb-4">
                      <small className="text-muted">
                        Password requirements:
                        <ul className="mb-0 mt-1">
                          <li className={newPassword.length >= 8 ? 'text-success' : ''}>
                            At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(newPassword) ? 'text-success' : ''}>
                            One uppercase letter
                          </li>
                          <li className={/[a-z]/.test(newPassword) ? 'text-success' : ''}>
                            One lowercase letter
                          </li>
                          <li className={/[0-9]/.test(newPassword) ? 'text-success' : ''}>
                            One number
                          </li>
                          <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-success' : ''}>
                            One special character
                          </li>
                        </ul>
                      </small>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Changing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-1"></i>
                            Update Password
                          </>
                        )}
                      </button>
                      {!mustChangePassword && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setIsChangingPassword(false)
                            setCurrentPassword('')
                            setNewPassword('')
                            setConfirmPassword('')
                          }}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="text-muted">
                    <p className="mb-2">
                      <i className="bi bi-lock me-2"></i>
                      Your password is securely stored. We recommend changing it periodically.
                    </p>
                    <p className="mb-0">
                      <small>Last updated: Never (Change your password to track this)</small>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Security Info */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>Security Tips
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Use a unique password for this account
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Never share your password with others
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Change your password every 90 days
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Log out when using shared computers
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Be cautious of phishing emails
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Report suspicious activity immediately
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
