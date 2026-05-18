'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and edit individual user details
// Admin only page

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

interface User {
  id: string
  email: string
  email_verified: boolean
  name: string | null
  phone: string | null
  organization: string | null
  role: string
  avatar: string | null
  bio: string | null
  is_new_user: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at: string | null
  banned_until: string | null
  last_sign_in_at: string | null
  email_confirmed_at: string | null
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'User', color: 'secondary' },
  { value: 'applicant', label: 'Applicant', color: 'info' },
  { value: 'reviewer', label: 'Reviewer', color: 'primary' },
  { value: 'admin', label: 'Admin', color: 'danger' },
]

const BAN_DURATION_OPTIONS = [
  { value: '1', label: '1 Day' },
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
  { value: 'permanent', label: 'Permanent' },
]

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Edit state
  const [editRole, setEditRole] = useState<string>('')
  const [showRoleModal, setShowRoleModal] = useState(false)

  // Ban state
  const [showBanModal, setShowBanModal] = useState(false)
  const [banDuration, setBanDuration] = useState<string>('7')

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteHard, setDeleteHard] = useState(false)

  // Fetch user data
  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user')
      }

      setUser(data.data)
      setEditRole(data.data.role)
    } catch (err) {
      console.error('Error fetching user:', err)
      setError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  // Update user role
  const handleUpdateRole = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUser(prev => prev ? { ...prev, role: editRole } : null)
      setShowRoleModal(false)
      setSuccessMessage('User role updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  // Toggle user active status
  const handleToggleActive = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUser(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
      setSuccessMessage(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  // Ban user
  const handleBanUser = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ban', ban_duration: banDuration }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUser(prev => prev ? { ...prev, is_active: false, banned_until: 'banned' } : null)
      setShowBanModal(false)
      setSuccessMessage('User banned successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user')
    } finally {
      setSaving(false)
    }
  }

  // Unban user
  const handleUnbanUser = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban' }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUser(prev => prev ? { ...prev, is_active: true, banned_until: null } : null)
      setSuccessMessage('User unbanned successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user')
    } finally {
      setSaving(false)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!user) return

    setSaving(true)
    try {
      const url = deleteHard
        ? `/api/users/${userId}?hard=true`
        : `/api/users/${userId}`

      const response = await fetch(url, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setShowDeleteModal(false)
      setSuccessMessage(deleteHard ? 'User permanently deleted' : 'User deactivated successfully')

      // Redirect after delete
      setTimeout(() => {
        router.push('/admin/users')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setSaving(false)
    }
  }

  // Get role badge
  const getRoleBadge = (role: string) => {
    const option = ROLE_OPTIONS.find(r => r.value === role)
    return option ? option.color : 'secondary'
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading user details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error && !user) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="alert alert-danger">
            <i className="icofont-warning me-2"></i>
            {error}
          </div>
          <Link href="/admin/users" className="btn btn-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Users
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  // User not found
  if (!user) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="alert alert-warning">
            <i className="icofont-warning me-2"></i>
            User not found
          </div>
          <Link href="/admin/users" className="btn btn-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Back to Users
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const isBanned = !!user.banned_until

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Messages */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show">
            <i className="icofont-check-circled me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
          </div>
        )}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            <i className="icofont-warning me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">
              <i className="icofont-user-alt-4 me-2"></i>
              User Details
            </h1>
            <p className="text-muted mb-0">View and manage user information</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={fetchUser} disabled={saving}>
              <i className="icofont-refresh me-2"></i>
              Refresh
            </button>
            <Link href="/admin/users" className="btn btn-secondary">
              <i className="icofont-arrow-left me-2"></i>
              Back to Users
            </Link>
          </div>
        </div>

        <div className="row">
          {/* User Profile Card */}
          <div className="col-lg-4 mb-4">
            <div className="card">
              <div className="card-body text-center py-4">
                {/* Avatar */}
                <div
                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white mx-auto mb-3"
                  style={{ width: 100, height: 100, fontSize: 36 }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="rounded-circle"
                      style={{ width: 100, height: 100, objectFit: 'cover' }}
                    />
                  ) : (
                    (user.name || user.email || '?')[0].toUpperCase()
                  )}
                </div>

                {/* Name & Email */}
                <h4 className="mb-1">{user.name || 'No Name'}</h4>
                <p className="text-muted mb-2">{user.email}</p>

                {/* Role Badge */}
                <span className={`badge bg-${getRoleBadge(user.role)} fs-6`}>
                  {user.role}
                </span>

                {/* Status Badges */}
                <div className="mt-3 d-flex justify-content-center gap-2 flex-wrap">
                  {isBanned ? (
                    <span className="badge bg-danger">Banned</span>
                  ) : user.is_active ? (
                    <span className="badge bg-success">Active</span>
                  ) : (
                    <span className="badge bg-warning text-dark">Inactive</span>
                  )}
                  {user.email_verified ? (
                    <span className="badge bg-success">
                      <i className="icofont-check me-1"></i>
                      Email Verified
                    </span>
                  ) : (
                    <span className="badge bg-secondary">
                      <i className="icofont-close me-1"></i>
                      Not Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="icofont-ui-settings me-2"></i>
                  Quick Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  {/* Edit Role */}
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => setShowRoleModal(true)}
                    disabled={saving}
                  >
                    <i className="icofont-ui-edit me-2"></i>
                    Change Role
                  </button>

                  {/* Toggle Active */}
                  <button
                    className={`btn btn-outline-${user.is_active ? 'warning' : 'success'}`}
                    onClick={handleToggleActive}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className={`icofont-${user.is_active ? 'ui-block' : 'ui-check'} me-2`}></i>
                    )}
                    {user.is_active ? 'Deactivate User' : 'Activate User'}
                  </button>

                  {/* Ban/Unban */}
                  {isBanned ? (
                    <button
                      className="btn btn-outline-success"
                      onClick={handleUnbanUser}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                      ) : (
                        <i className="icofont-unlock me-2"></i>
                      )}
                      Unban User
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => setShowBanModal(true)}
                      disabled={saving}
                    >
                      <i className="icofont-ban me-2"></i>
                      Ban User
                    </button>
                  )}

                  <hr />

                  {/* Delete */}
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={saving}
                  >
                    <i className="icofont-trash me-2"></i>
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="col-lg-8">
            {/* Contact Information */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="icofont-ui-contact me-2"></i>
                  Contact Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Email Address</label>
                    <div className="d-flex align-items-center">
                      <i className="icofont-email text-primary me-2"></i>
                      <span>{user.email}</span>
                      {user.email_verified && (
                        <i className="icofont-check-circled text-success ms-2" title="Verified"></i>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Phone Number</label>
                    <div className="d-flex align-items-center">
                      <i className="icofont-phone text-primary me-2"></i>
                      <span>{user.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Organization</label>
                    <div className="d-flex align-items-center">
                      <i className="icofont-building text-primary me-2"></i>
                      <span>{user.organization || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="card mb-4">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="icofont-file-text me-2"></i>
                    Bio
                  </h5>
                </div>
                <div className="card-body">
                  <p className="mb-0">{user.bio}</p>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="card mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">
                  <i className="icofont-ui-user me-2"></i>
                  Account Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">User ID</label>
                    <div className="text-break">
                      <code className="small">{user.id}</code>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Role</label>
                    <div>
                      <span className={`badge bg-${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Account Status</label>
                    <div>
                      {isBanned ? (
                        <span className="badge bg-danger">Banned</span>
                      ) : user.is_active ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-warning text-dark">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">New User</label>
                    <div>
                      {user.is_new_user ? (
                        <span className="badge bg-info">Yes</span>
                      ) : (
                        <span className="badge bg-secondary">No</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="card">
              <div className="card-header bg-dark text-white">
                <h5 className="mb-0">
                  <i className="icofont-clock-time me-2"></i>
                  Activity Timeline
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Account Created</label>
                    <div>
                      <i className="icofont-calendar text-primary me-2"></i>
                      {new Date(user.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Last Updated</label>
                    <div>
                      <i className="icofont-ui-edit text-primary me-2"></i>
                      {new Date(user.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Last Sign In</label>
                    <div>
                      <i className="icofont-login text-primary me-2"></i>
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : 'Never'}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Email Confirmed</label>
                    <div>
                      <i className="icofont-check-circled text-primary me-2"></i>
                      {user.email_confirmed_at
                        ? new Date(user.email_confirmed_at).toLocaleString()
                        : 'Not confirmed'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Role Modal */}
        {showRoleModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="icofont-ui-edit me-2"></i>
                    Edit User Role
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>{user.name || user.email}</strong>
                    <br />
                    <span className="text-muted">{user.email}</span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={editRole}
                      onChange={e => setEditRole(e.target.value)}
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateRole}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="icofont-check me-2"></i>
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ban User Modal */}
        {showBanModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="icofont-ban me-2"></i>
                    Ban User
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowBanModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <i className="icofont-warning me-2"></i>
                    You are about to ban <strong>{user.name || user.email}</strong>.
                    This will prevent them from logging in.
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ban Duration</label>
                    <select
                      className="form-select"
                      value={banDuration}
                      onChange={e => setBanDuration(e.target.value)}
                    >
                      {BAN_DURATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowBanModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleBanUser}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="icofont-ban me-2"></i>
                    )}
                    Ban User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="icofont-trash me-2"></i>
                    Delete User
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-danger">
                    <i className="icofont-warning me-2"></i>
                    You are about to delete <strong>{user.name || user.email}</strong>.
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="hardDelete"
                      checked={deleteHard}
                      onChange={e => setDeleteHard(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="hardDelete">
                      <strong>Permanently delete</strong>
                      <br />
                      <small className="text-muted">
                        This will completely remove the user from the database. This action cannot be undone.
                      </small>
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteUser}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="icofont-trash me-2"></i>
                    )}
                    {deleteHard ? 'Permanently Delete' : 'Deactivate User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
