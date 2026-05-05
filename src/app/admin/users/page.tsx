'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage all users - view, update roles, disable, delete
// Features: Advanced filters, search, export (CSV/JSON)
// Admin only page

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
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

const columnHelper = createColumnHelper<User>()

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

const VERIFICATION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Not Verified' },
]

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Advanced Filters
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [verificationFilter, setVerificationFilter] = useState<string>('all')
  const [dateFromFilter, setDateFromFilter] = useState<string>('')
  const [dateToFilter, setDateToFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Edit Modal
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<string>('')

  // Ban Modal
  const [banningUser, setBanningUser] = useState<User | null>(null)
  const [banDuration, setBanDuration] = useState<string>('7')

  // Delete Confirmation
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleteHard, setDeleteHard] = useState(false)

  // Export state
  const [exporting, setExporting] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const exportDropdownRef = useRef<HTMLDivElement>(null)

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false)
      }
    }

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportDropdown])

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/users?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Filter users locally for additional filters
  const filteredUsers = useMemo(() => {
    let result = users

    // Search filter (name, email, organization, phone)
    if (globalFilter) {
      const search = globalFilter.toLowerCase()
      result = result.filter(user =>
        user.name?.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.organization?.toLowerCase().includes(search) ||
        user.phone?.toLowerCase().includes(search)
      )
    }

    // Verification filter
    if (verificationFilter === 'verified') {
      result = result.filter(user => user.email_verified)
    } else if (verificationFilter === 'unverified') {
      result = result.filter(user => !user.email_verified)
    }

    // Date range filter
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter)
      result = result.filter(user => new Date(user.created_at) >= fromDate)
    }
    if (dateToFilter) {
      const toDate = new Date(dateToFilter)
      toDate.setHours(23, 59, 59, 999)
      result = result.filter(user => new Date(user.created_at) <= toDate)
    }

    return result
  }, [users, globalFilter, verificationFilter, dateFromFilter, dateToFilter])

  // Clear all filters
  const clearFilters = () => {
    setGlobalFilter('')
    setRoleFilter('all')
    setStatusFilter('all')
    setVerificationFilter('all')
    setDateFromFilter('')
    setDateToFilter('')
  }

  // Check if any filter is active
  const hasActiveFilters = globalFilter || roleFilter !== 'all' || statusFilter !== 'all' ||
    verificationFilter !== 'all' || dateFromFilter || dateToFilter

  // Export functions
  const exportToCSV = useCallback(() => {
    setExporting(true)
    try {
      const headers = ['Name', 'Email', 'Role', 'Organization', 'Phone', 'Status', 'Email Verified', 'Joined Date', 'Last Login']
      const rows = filteredUsers.map(user => [
        user.name || '',
        user.email,
        user.role,
        user.organization || '',
        user.phone || '',
        user.is_active ? (user.banned_until ? 'Banned' : 'Active') : 'Inactive',
        user.email_verified ? 'Yes' : 'No',
        new Date(user.created_at).toLocaleDateString(),
        user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)

      setSuccessMessage(`Exported ${filteredUsers.length} users to CSV`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }, [filteredUsers])

  const exportToJSON = useCallback(() => {
    setExporting(true)
    try {
      const exportData = filteredUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        phone: user.phone,
        status: user.is_active ? (user.banned_until ? 'banned' : 'active') : 'inactive',
        email_verified: user.email_verified,
        joined_date: user.created_at,
        last_login: user.last_sign_in_at,
      }))

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(link.href)

      setSuccessMessage(`Exported ${filteredUsers.length} users to JSON`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to export JSON')
    } finally {
      setExporting(false)
    }
  }, [filteredUsers])

  // Update user role
  const handleUpdateRole = async () => {
    if (!editingUser) return

    setSaving(editingUser.id)
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUsers(prev =>
        prev.map(u => u.id === editingUser.id ? { ...u, role: editRole } : u)
      )
      setEditingUser(null)
      setSuccessMessage('User role updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(null)
    }
  }

  // Toggle user active status
  const handleToggleActive = async (user: User) => {
    setSaving(user.id)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u)
      )
      setSuccessMessage(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(null)
    }
  }

  // Ban user
  const handleBanUser = async () => {
    if (!banningUser) return

    setSaving(banningUser.id)
    try {
      const response = await fetch(`/api/users/${banningUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ban', ban_duration: banDuration }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUsers(prev =>
        prev.map(u => u.id === banningUser.id ? { ...u, is_active: false, banned_until: 'banned' } : u)
      )
      setBanningUser(null)
      setSuccessMessage('User banned successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user')
    } finally {
      setSaving(null)
    }
  }

  // Unban user
  const handleUnbanUser = async (user: User) => {
    setSaving(user.id)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban' }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_active: true, banned_until: null } : u)
      )
      setSuccessMessage('User unbanned successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user')
    } finally {
      setSaving(null)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setSaving(deletingUser.id)
    try {
      const url = deleteHard
        ? `/api/users/${deletingUser.id}?hard=true`
        : `/api/users/${deletingUser.id}`

      const response = await fetch(url, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUsers(prev => prev.filter(u => u.id !== deletingUser.id))
      setDeletingUser(null)
      setSuccessMessage(deleteHard ? 'User permanently deleted' : 'User deactivated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setSaving(null)
    }
  }

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const option = ROLE_OPTIONS.find(r => r.value === role)
    return option ? option.color : 'secondary'
  }

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'User',
        cell: info => (
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
              style={{ width: 40, height: 40, fontSize: 14 }}
            >
              {(info.getValue() || info.row.original.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="fw-medium">{info.getValue() || 'No Name'}</div>
              <div className="small text-muted">{info.row.original.email}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: info => (
          <span className={`badge bg-${getRoleBadge(info.getValue())}`}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: info => {
          const user = info.row.original
          if (user.banned_until) {
            return <span className="badge bg-danger">Banned</span>
          }
          return info.getValue() ? (
            <span className="badge bg-success">Active</span>
          ) : (
            <span className="badge bg-warning text-dark">Inactive</span>
          )
        },
      }),
      columnHelper.accessor('email_verified', {
        header: 'Verified',
        cell: info => (
          info.getValue() ? (
            <i className="icofont-check-circled text-success" title="Email Verified"></i>
          ) : (
            <i className="icofont-close-circled text-danger" title="Not Verified"></i>
          )
        ),
      }),
      columnHelper.accessor('organization', {
        header: 'Organization',
        cell: info => (
          <span className="text-muted small">{info.getValue() || '-'}</span>
        ),
      }),
      columnHelper.accessor('last_sign_in_at', {
        header: 'Last Login',
        cell: info => {
          const date = info.getValue()
          if (!date) return <span className="text-muted small">Never</span>
          return (
            <span className="small text-muted">
              {new Date(date).toLocaleDateString()}
            </span>
          )
        },
      }),
      columnHelper.accessor('created_at', {
        header: 'Joined',
        cell: info => (
          <span className="small text-muted">
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => {
          const user = info.row.original
          const isBanned = !!user.banned_until
          return (
            <div className="d-flex gap-1">
              {/* Edit Role */}
              <button
                className="btn btn-sm btn-outline-primary"
                title="Edit Role"
                onClick={() => {
                  setEditingUser(user)
                  setEditRole(user.role)
                }}
              >
                <i className="icofont-ui-edit"></i>
              </button>

              {/* Toggle Active */}
              <button
                className={`btn btn-sm btn-outline-${user.is_active ? 'warning' : 'success'}`}
                title={user.is_active ? 'Deactivate' : 'Activate'}
                onClick={() => handleToggleActive(user)}
                disabled={saving === user.id}
              >
                {saving === user.id ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className={`icofont-${user.is_active ? 'ui-block' : 'ui-check'}`}></i>
                )}
              </button>

              {/* Ban/Unban */}
              {isBanned ? (
                <button
                  className="btn btn-sm btn-outline-success"
                  title="Unban User"
                  onClick={() => handleUnbanUser(user)}
                  disabled={saving === user.id}
                >
                  <i className="icofont-unlock"></i>
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-outline-danger"
                  title="Ban User"
                  onClick={() => setBanningUser(user)}
                >
                  <i className="icofont-ban"></i>
                </button>
              )}

              {/* Delete */}
              <button
                className="btn btn-sm btn-outline-danger"
                title="Delete User"
                onClick={() => setDeletingUser(user)}
              >
                <i className="icofont-trash"></i>
              </button>
            </div>
          )
        },
      }),
    ],
    [saving]
  )

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  })

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    filtered: filteredUsers.length,
    active: users.filter(u => u.is_active && !u.banned_until).length,
    admins: users.filter(u => u.role === 'admin').length,
    applicants: users.filter(u => u.role === 'applicant').length,
    banned: users.filter(u => u.banned_until).length,
  }), [users, filteredUsers])

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

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
            <i className="icofont-users-alt-5 me-2"></i>
            User Management
          </h1>
          <p className="text-muted mb-0">Manage all registered users</p>
        </div>
        <div className="d-flex gap-2">
          {/* Export Dropdown - React controlled */}
          <div className="dropdown" style={{ position: 'relative' }} ref={exportDropdownRef}>
            <button
              className="btn btn-success dropdown-toggle"
              type="button"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={exporting || filteredUsers.length === 0}
              aria-expanded={showExportDropdown}
            >
              {exporting ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                <i className="icofont-download me-2"></i>
              )}
              Export ({filteredUsers.length})
            </button>
            {showExportDropdown && (
              <ul
                className="dropdown-menu show"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  zIndex: 1000,
                  minWidth: '160px'
                }}
              >
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      exportToCSV()
                      setShowExportDropdown(false)
                    }}
                  >
                    <i className="icofont-file-excel me-2"></i>
                    Export as CSV
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      exportToJSON()
                      setShowExportDropdown(false)
                    }}
                  >
                    <i className="icofont-code me-2"></i>
                    Export as JSON
                  </button>
                </li>
              </ul>
            )}
          </div>
          <button className="btn btn-outline-primary" onClick={fetchUsers}>
            <i className="icofont-refresh me-2"></i>
            Refresh
          </button>
          <Link href="/admin" className="btn btn-outline-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Dashboard
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="card bg-primary text-white h-100">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-1 opacity-75 small">Total</h6>
                  <h3 className="mb-0">{stats.total}</h3>
                </div>
                <i className="icofont-users-alt-5" style={{ fontSize: '1.8rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-success text-white h-100">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-1 opacity-75 small">Active</h6>
                  <h3 className="mb-0">{stats.active}</h3>
                </div>
                <i className="icofont-check-circled" style={{ fontSize: '1.8rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-danger text-white h-100">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-1 opacity-75 small">Admins</h6>
                  <h3 className="mb-0">{stats.admins}</h3>
                </div>
                <i className="icofont-shield" style={{ fontSize: '1.8rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-info text-white h-100">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-1 opacity-75 small">Applicants</h6>
                  <h3 className="mb-0">{stats.applicants}</h3>
                </div>
                <i className="icofont-paper" style={{ fontSize: '1.8rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-1 opacity-75 small">Banned</h6>
                  <h3 className="mb-0">{stats.banned}</h3>
                </div>
                <i className="icofont-ban" style={{ fontSize: '1.8rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-secondary text-white h-100">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-1 opacity-75 small">Filtered</h6>
                  <h3 className="mb-0">{stats.filtered}</h3>
                </div>
                <i className="icofont-filter" style={{ fontSize: '1.8rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card mb-4">
        <div className="card-body">
          {/* Search Bar */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-white">
                  <i className="icofont-search-1"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, organization, or phone..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                />
                {globalFilter && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setGlobalFilter('')}
                  >
                    <i className="icofont-close"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-6 d-flex gap-2 justify-content-end">
              <button
                className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="icofont-filter me-2"></i>
                Filters {hasActiveFilters && <span className="badge bg-danger ms-1">!</span>}
              </button>
              {hasActiveFilters && (
                <button className="btn btn-outline-danger" onClick={clearFilters}>
                  <i className="icofont-close me-2"></i>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="row g-3 pt-3 border-top">
              <div className="col-md-2">
                <label className="form-label small fw-bold">Role</label>
                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {ROLE_OPTIONS.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold">Status</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold">Email Verified</label>
                <select
                  className="form-select"
                  value={verificationFilter}
                  onChange={e => setVerificationFilter(e.target.value)}
                >
                  {VERIFICATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Joined From</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateFromFilter}
                  onChange={e => setDateFromFilter(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Joined To</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateToFilter}
                  onChange={e => setDateToFilter(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                        className="px-3"
                      >
                        <div className="d-flex align-items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() && (
                            <i className={`icofont-arrow-${header.column.getIsSorted() === 'desc' ? 'down' : 'up'}`}></i>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-5 text-muted">
                      <i className="icofont-users-alt-5 d-block mb-2" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                      <h5>No Users Found</h5>
                      <p className="mb-0">Try adjusting your filters.</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <div className="text-muted">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredUsers.length
              )}{' '}
              of {filteredUsers.length} users
            </div>
            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                style={{ width: 'auto' }}
              >
                {[10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>Show {size}</option>
                ))}
              </select>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <i className="icofont-double-left"></i>
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <i className="icofont-arrow-left"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm" disabled>
                  {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <i className="icofont-arrow-right"></i>
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <i className="icofont-double-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="icofont-ui-edit me-2"></i>
                  Edit User Role
                </h5>
                <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>{editingUser.name || editingUser.email}</strong>
                  <br />
                  <span className="text-muted">{editingUser.email}</span>
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
                <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateRole}
                  disabled={saving === editingUser.id}
                >
                  {saving === editingUser.id ? (
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
      {banningUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="icofont-ban me-2"></i>
                  Ban User
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setBanningUser(null)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="icofont-warning me-2"></i>
                  You are about to ban <strong>{banningUser.name || banningUser.email}</strong>.
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
                <button className="btn btn-secondary" onClick={() => setBanningUser(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleBanUser}
                  disabled={saving === banningUser.id}
                >
                  {saving === banningUser.id ? (
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
      {deletingUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="icofont-trash me-2"></i>
                  Delete User
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeletingUser(null)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <i className="icofont-warning me-2"></i>
                  You are about to delete <strong>{deletingUser.name || deletingUser.email}</strong>.
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
                <button className="btn btn-secondary" onClick={() => setDeletingUser(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteUser}
                  disabled={saving === deletingUser.id}
                >
                  {saving === deletingUser.id ? (
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
