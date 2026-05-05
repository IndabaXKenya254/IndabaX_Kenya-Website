'use client'

// ═══════════════════════════════════════════════════════════════════════
// ADMIN USERS MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage admin users and roles

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { Alert } from '@/components/admin/ui'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert'

interface AdminUser {
  id: string
  user_id: string
  role: string
  email?: string
  created_at: string
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', role: 'admin' })

  useEffect(() => {
    loadAdmins()
  }, [])

  async function loadAdmins() {
    setLoading(true)
    try {
      const result = await adminApi.admins.list()

      if (result.success) {
        setAdmins((result.data as AdminUser[]) || [])
      } else {
        setAlert({ type: 'danger', message: result.error || 'Failed to load admin users' })
      }
    } catch (error: any) {
      console.error('Error loading admins:', error)
      setAlert({ type: 'danger', message: 'Failed to load admin users' })
    } finally {
      setLoading(false)
    }
  }

  async function handleInviteAdmin(e: React.FormEvent) {
    e.preventDefault()

    if (!inviteData.email.trim()) {
      setAlert({ type: 'danger', message: 'Email is required' })
      return
    }

    setLoading(true)
    try {
      const result = await adminApi.admins.invite(inviteData)

      if (result.success) {
        showSuccess(
          'Admin Invited!',
          `An invitation email has been sent to ${inviteData.email}`
        )

        setShowInviteModal(false)
        setInviteData({ email: '', role: 'admin' })
        loadAdmins()
      } else {
        showError('Invitation Failed', result.error || 'Failed to invite admin user')
      }
    } catch (error: any) {
      console.error('Error inviting admin:', error)
      showError('Invitation Failed', 'An error occurred while inviting admin user')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAdmin(admin: AdminUser) {
    const confirmed = await showConfirm(
      'Delete Admin?',
      `Are you sure you want to remove admin access for ${admin.email}? This will also delete their user account.`,
      'warning'
    )

    if (!confirmed) return

    setLoading(true)
    try {
      const result = await adminApi.admins.delete(admin.user_id, true)

      if (result.success) {
        showSuccess('Admin Removed!', `Admin access for ${admin.email} has been removed`)
        loadAdmins()
      } else {
        showError('Delete Failed', result.error || 'Failed to remove admin')
      }
    } catch (error: any) {
      console.error('Error deleting admin:', error)
      showError('Delete Failed', 'An error occurred while removing admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Admin Users</h2>
            <p className="text-muted">Manage admin users and their roles</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-primary"
              onClick={() => setShowInviteModal(true)}
              disabled={loading}
            >
              <i className="icofont-plus me-2"></i>
              Invite Admin
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Admins List */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading admin users...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="icofont-users" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">No admin users found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Added On</th>
                      <th style={{ width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td>
                          <i className="icofont-email me-2"></i>
                          {admin.email}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              admin.role === 'super_admin' ? 'bg-danger' : 'bg-primary'
                            }`}
                          >
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteAdmin(admin)}
                            title="Remove admin access"
                          >
                            <i className="icofont-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="card mt-4 border-info">
          <div className="card-body">
            <h5 className="card-title">
              <i className="icofont-info-circle me-2"></i>
              About Admin Roles
            </h5>
            <ul className="mb-0">
              <li><strong>Admin:</strong> Can manage content (events, posts, speakers, etc.)</li>
              <li><strong>Super Admin:</strong> Can manage content AND other admin users</li>
              <li>Invited users will receive an email with setup instructions</li>
              <li>Users must verify their email before accessing the admin panel</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleInviteAdmin}>
                <div className="modal-header">
                  <h5 className="modal-title">Invite New Admin</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowInviteModal(false)}
                    disabled={loading}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      placeholder="admin@example.com"
                      required
                      disabled={loading}
                      autoFocus
                    />
                    <small className="text-muted">
                      An invitation email will be sent to this address
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={inviteData.role}
                      onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                      disabled={loading}
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <small className="text-muted">
                      Super Admins can manage other admin users
                    </small>
                  </div>

                  <div className="alert alert-warning">
                    <i className="icofont-warning me-2"></i>
                    The user will receive an email and must verify their account before accessing the admin panel.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowInviteModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="icofont-email me-2"></i>
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
