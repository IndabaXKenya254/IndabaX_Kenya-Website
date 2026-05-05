'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Manage reviewers with granular permissions
// Phase 6: Reviewer System

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

interface ReviewerPermissions {
  canViewApplications: boolean
  canApprove: boolean
  canReject: boolean
  canViewPII: boolean
  canViewSurveyResponses: boolean
  canViewPaperSubmissions: boolean
  canShortlist: boolean
  canSendReminders: boolean
  canRevoke: boolean
  canSendEmails: boolean
  canWaitlist: boolean
  canComment: boolean
}

interface Reviewer {
  id: string
  user_id: string
  event_id: string | null
  is_active: boolean
  deactivated_at: string | null
  permissions: ReviewerPermissions
  applications_reviewed: number
  last_active_at: string | null
  created_at: string
  user_profiles: {
    id: string
    name: string
    email: string
  } | null
  events: {
    id: string
    title: string
    slug: string
  } | null
}

interface Event {
  id: string
  title: string
  slug: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  role?: string
}

const columnHelper = createColumnHelper<Reviewer>()

const DEFAULT_PERMISSIONS: ReviewerPermissions = {
  canViewApplications: true,
  canApprove: false,
  canReject: false,
  canViewPII: true,
  canViewSurveyResponses: true,
  canViewPaperSubmissions: true,
  canShortlist: false,
  canSendReminders: false,
  canRevoke: false,
  canSendEmails: false,
  canWaitlist: false,
  canComment: true,
}

const PERMISSION_LABELS: Record<keyof ReviewerPermissions, { label: string; description: string }> = {
  canViewApplications: { label: 'View Applications', description: 'Can view application list and details' },
  canApprove: { label: 'Approve', description: 'Can approve applications' },
  canReject: { label: 'Reject', description: 'Can reject and waitlist applications' },
  canViewPII: { label: 'View PII', description: 'Can see personal information (email, phone)' },
  canViewSurveyResponses: { label: 'View Form Responses', description: 'Can view shortlist form responses' },
  canViewPaperSubmissions: { label: 'View Papers', description: 'Can view paper submissions' },
  canShortlist: { label: 'Shortlist', description: 'Can shortlist applications and send surveys' },
  canSendReminders: { label: 'Send Reminders', description: 'Can send survey reminder emails' },
  canRevoke: { label: 'Revoke Approvals', description: 'Can revoke approvals and invalidate tickets' },
  canSendEmails: { label: 'Send Emails', description: 'Can send custom emails to applicants' },
  canWaitlist: { label: 'Waitlist', description: 'Can move applications to waitlist (same as canReject)' },
  canComment: { label: 'Add Comments', description: 'Can add notes/comments on applications' },
}

export default function ReviewerManagementPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [eventFilter, setEventFilter] = useState<string>('all')

  // Add Reviewer Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newReviewerUserId, setNewReviewerUserId] = useState('')
  const [newReviewerEventIds, setNewReviewerEventIds] = useState<string[]>([])
  const [isGlobalReviewer, setIsGlobalReviewer] = useState(false)
  const [newReviewerPermissions, setNewReviewerPermissions] = useState<ReviewerPermissions>(DEFAULT_PERMISSIONS)

  // Edit Permissions Modal
  const [editingReviewer, setEditingReviewer] = useState<Reviewer | null>(null)
  const [editPermissions, setEditPermissions] = useState<ReviewerPermissions>(DEFAULT_PERMISSIONS)
  // Issue #13 FIX: Allow changing reviewer event assignment
  const [editEventId, setEditEventId] = useState<string | null>(null)

  const supabase = createBrowserClient()

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // Issue #14 FIX: Fetch ALL events (not just upcoming) for reviewers management
        // Reviewers may be assigned to past events and should still be visible
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, title, slug, start_date')
          .order('start_date', { ascending: false })

        setEvents(eventsData || [])

        // Fetch users who are actual applicants (have submitted form responses)
        // Filter to ONLY show users with 'applicant' role (exclude admins and reviewers)
        const { data: usersData } = await supabase
          .from('form_responses')
          .select(`
            user_id,
            user_profiles:user_id (id, name, email, role)
          `)
          .not('user_id', 'is', null)

        // Deduplicate users and filter to only applicants
        const profiles = usersData?.map(item => item.user_profiles).filter(profile => profile !== null) || []
        const uniqueUsers = (profiles as unknown as UserProfile[])
          .filter((profile, index, self) =>
            self.findIndex(p => p.id === profile.id) === index
          )
          .filter(profile => profile.role === 'applicant') // ONLY applicants
          .sort((a, b) => a.name.localeCompare(b.name))

        setUsers(uniqueUsers)

        // Fetch reviewers from the reviewers table
        const { data: reviewersData, error: reviewersError } = await supabase
          .from('reviewers')
          .select(`
            *,
            user_profiles:user_id (id, name, email),
            events:event_id (id, title, slug)
          `)
          .order('created_at', { ascending: false })

        if (reviewersError) throw reviewersError

        // Issue #14 FIX: Also fetch users with role='reviewer' who may not have assignments
        // These are reviewers whose event assignments were deleted (CASCADE) but still have reviewer role
        const { data: unassignedReviewers } = await supabase
          .from('user_profiles')
          .select('id, name, email, role, created_at')
          .eq('role', 'reviewer')

        // Get IDs of users who have entries in reviewers table
        const assignedUserIds = new Set((reviewersData || []).map(r => r.user_id))

        // Create synthetic reviewer entries for unassigned reviewers
        const unassignedReviewerEntries: Reviewer[] = (unassignedReviewers || [])
          .filter(up => !assignedUserIds.has(up.id))
          .map(up => ({
            id: `unassigned-${up.id}`, // Synthetic ID to indicate unassigned
            user_id: up.id,
            event_id: null,
            is_active: true,
            deactivated_at: null,
            permissions: DEFAULT_PERMISSIONS,
            applications_reviewed: 0,
            last_active_at: null,
            created_at: up.created_at,
            user_profiles: {
              id: up.id,
              name: up.name,
              email: up.email,
            },
            events: null,
          }))

        // Combine both lists
        setReviewers([...(reviewersData || []), ...unassignedReviewerEntries])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load reviewers')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter reviewers by event and status
  const filteredReviewers = useMemo(() => {
    let filtered = reviewers
    if (eventFilter === 'unassigned') filtered = filtered.filter(r => r.event_id === null)
    else if (eventFilter === 'inactive') filtered = filtered.filter(r => !r.is_active)
    else if (eventFilter === 'active') filtered = filtered.filter(r => r.is_active)
    else if (eventFilter !== 'all') filtered = filtered.filter(r => r.event_id === eventFilter)
    return filtered
  }, [reviewers, eventFilter])

  // Get existing event assignments for selected user
  const existingAssignments = useMemo(() => {
    if (!newReviewerUserId) return []
    return reviewers
      .filter(r => r.user_id === newReviewerUserId)
      .map(r => ({
        eventId: r.event_id,
        eventTitle: r.events?.title || 'Unknown Event',
      }))
  }, [newReviewerUserId, reviewers])

  // Add reviewer
  const handleAddReviewer = async () => {
    if (!newReviewerUserId) {
      setError('Please select a user')
      return
    }

    if (!isGlobalReviewer && newReviewerEventIds.length === 0) {
      setError('Please select at least one event or check "Global Reviewer"')
      return
    }

    setSaving('add')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Determine which events to assign
      const eventsToAssign = isGlobalReviewer ? events : events.filter(e => newReviewerEventIds.includes(e.id))

      // Get user profile for email
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .eq('id', newReviewerUserId)
        .single()

      if (!userProfile) throw new Error('User not found')

      // Track results
      const addedReviewers: Reviewer[] = []
      const failedEvents: string[] = []

      // Add reviewer for each event
      for (const event of eventsToAssign) {
        try {
          const { data, error: insertError } = await supabase
            .from('reviewers')
            .insert({
              user_id: newReviewerUserId,
              event_id: event.id,
              permissions: newReviewerPermissions,
              added_by: user.id,
            })
            .select(`
              *,
              user_profiles:user_id (id, name, email),
              events:event_id (id, title, slug)
            `)
            .single()

          if (insertError) {
            if (insertError.message.includes('unique_reviewer_event')) {
              console.warn(`User already reviewer for ${event.title}`)
              continue // Skip if already assigned
            }
            throw insertError
          }

          addedReviewers.push(data)

          // Send email notification for this event assignment
          try {
            const permissionsList = [
              newReviewerPermissions.canViewApplications && 'View Applications',
              newReviewerPermissions.canApprove && 'Approve Applications',
              newReviewerPermissions.canReject && 'Reject Applications',
              newReviewerPermissions.canWaitlist && 'Waitlist Applications',
              newReviewerPermissions.canShortlist && 'Shortlist Applications',
              newReviewerPermissions.canRevoke && 'Revoke Approvals',
              newReviewerPermissions.canViewPII && 'View Personal Information',
              newReviewerPermissions.canViewSurveyResponses && 'View Survey Responses',
              newReviewerPermissions.canViewPaperSubmissions && 'View Paper Submissions',
              newReviewerPermissions.canSendEmails && 'Send Custom Emails',
              newReviewerPermissions.canSendReminders && 'Send Survey Reminders',
            ].filter(Boolean).join(', ')

            await fetch('/api/admin/emails/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientType: 'manual',
                recipients: [{
                  email: userProfile.email,
                  name: userProfile.name,
                  variables: {
                    name: userProfile.name,
                    email: userProfile.email,
                    event_name: event.title,
                    platform_url: window.location.origin,
                    permissions_summary: `You have been granted the following permissions: ${permissionsList}`
                  }
                }],
                eventId: event.id,
                subject: `You have been assigned as a reviewer for ${event.title}`,
                body: `<h2>Congratulations!</h2>
<p>Dear {{name}},</p>
<p>You have been assigned as a <strong>reviewer</strong> for the <strong>{{event_name}}</strong> event.</p>

<h3>What does this mean?</h3>
<p>As a reviewer, you will have access to evaluate applications submitted by other participants. You can:</p>
<ul>
  <li>View application details and responses</li>
  <li>Add review notes and feedback</li>
  <li>Approve or reject applications (based on your permissions)</li>
  <li>Access the Reviewer Portal using the links below</li>
</ul>

<h3>Getting Started</h3>
<ol>
  <li><a href="{{platform_url}}/login">Log in to the IndabaX Kenya platform</a></li>
  <li><a href="{{platform_url}}/reviewer/dashboard">Navigate to the Reviewer Dashboard</a></li>
  <li><a href="{{platform_url}}/reviewer/applications">View applications to review</a></li>
</ol>

<h3>Your Permissions</h3>
<p>{{permissions_summary}}</p>

<p>If you have any questions or need assistance, please contact the event organizers.</p>

<p>Best regards,<br/>
The IndabaX Kenya Team</p>`
              })
            })
          } catch (emailError) {
            console.warn(`Failed to send email for ${event.title}:`, emailError)
            // Don't fail the operation if email fails
          }
        } catch (eventError) {
          console.error(`Failed to add reviewer for ${event.title}:`, eventError)
          failedEvents.push(event.title)
        }
      }

      // Update state with all added reviewers
      if (addedReviewers.length > 0) {
        setReviewers(prev => [...addedReviewers, ...prev])
      }

      // Close modal and reset
      setShowAddModal(false)
      setNewReviewerUserId('')
      setNewReviewerEventIds([])
      setIsGlobalReviewer(false)
      setNewReviewerPermissions(DEFAULT_PERMISSIONS)

      // Show success/partial success message
      if (failedEvents.length === 0) {
        setSuccessMessage(`Reviewer added successfully to ${addedReviewers.length} event(s) and notification emails sent`)
      } else {
        setSuccessMessage(`Reviewer added to ${addedReviewers.length} event(s). Failed for: ${failedEvents.join(', ')}`)
      }
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: unknown) {
      console.error('Error adding reviewer:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add reviewer'
      setError(errorMessage)
    } finally {
      setSaving(null)
    }
  }

  // Update permissions
  const handleUpdatePermissions = async () => {
    if (!editingReviewer) return

    setSaving(editingReviewer.id)
    try {
      // Issue #13 FIX: Update both permissions and event assignment
      const updateData: Record<string, any> = { permissions: editPermissions }
      if (editEventId && editEventId !== editingReviewer.event_id) {
        updateData.event_id = editEventId === 'global' ? null : editEventId
      }

      const { error: updateError } = await supabase
        .from('reviewers')
        .update(updateData)
        .eq('id', editingReviewer.id)

      if (updateError) throw updateError

      // Refresh reviewer list to pick up new event title
      setReviewers(prev =>
        prev.map(r => {
          if (r.id !== editingReviewer.id) return r
          const updatedReviewer = { ...r, permissions: editPermissions }
          if (editEventId && editEventId !== editingReviewer.event_id) {
            updatedReviewer.event_id = editEventId === 'global' ? null : editEventId
            const newEvent = events.find(e => e.id === editEventId)
            updatedReviewer.events = newEvent ? { id: newEvent.id, title: newEvent.title, slug: newEvent.slug } : null
          }
          return updatedReviewer
        })
      )
      setEditingReviewer(null)
      setSuccessMessage('Permissions updated')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error updating permissions:', err)
      setError('Failed to update permissions')
    } finally {
      setSaving(null)
    }
  }

  // Issue #17 FIX: Deactivate reviewer (retain records)
  const handleDeactivateReviewer = async (reviewerId: string) => {
    if (!confirm('Deactivate this reviewer? Their records will be retained but they will lose reviewer access.')) return

    setSaving(reviewerId)
    try {
      const reviewerToDeactivate = reviewers.find(r => r.id === reviewerId)
      if (!reviewerToDeactivate) throw new Error('Reviewer not found')

      const { error: updateError } = await supabase
        .from('reviewers')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', reviewerId)

      if (updateError) throw updateError

      // Send notification email
      try {
        await fetch('/api/admin/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientType: 'manual',
            recipients: [{
              email: reviewerToDeactivate.user_profiles?.email || '',
              name: reviewerToDeactivate.user_profiles?.name || '',
              variables: {
                name: reviewerToDeactivate.user_profiles?.name || '',
                event_name: reviewerToDeactivate.events?.title || 'an event',
                platform_url: window.location.origin,
              }
            }],
            eventId: reviewerToDeactivate.event_id,
            subject: `Reviewer access deactivated for ${reviewerToDeactivate.events?.title || 'an event'}`,
            body: `<p>Dear {{name}},</p>
<p>Your reviewer access for <strong>{{event_name}}</strong> has been deactivated.</p>
<p>Your review history and contributions have been retained. If you believe this was done in error, please contact the event organizers.</p>
<p>Best regards,<br/>The IndabaX Kenya Team</p>`
          })
        })
      } catch (emailError) {
        console.warn('Failed to send deactivation email:', emailError)
      }

      // Update local state
      setReviewers(prev => prev.map(r =>
        r.id === reviewerId ? { ...r, is_active: false, deactivated_at: new Date().toISOString() } : r
      ))
      setSuccessMessage('Reviewer deactivated. Records retained.')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Error deactivating reviewer:', err)
      setError('Failed to deactivate reviewer')
    } finally {
      setSaving(null)
    }
  }

  // Reactivate reviewer
  const handleReactivateReviewer = async (reviewerId: string) => {
    setSaving(reviewerId)
    try {
      const { error: updateError } = await supabase
        .from('reviewers')
        .update({
          is_active: true,
          deactivated_at: null,
        })
        .eq('id', reviewerId)

      if (updateError) throw updateError

      setReviewers(prev => prev.map(r =>
        r.id === reviewerId ? { ...r, is_active: true, deactivated_at: null } : r
      ))
      setSuccessMessage('Reviewer reactivated')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error reactivating reviewer:', err)
      setError('Failed to reactivate reviewer')
    } finally {
      setSaving(null)
    }
  }

  // Permanently delete reviewer record
  const handleDeleteReviewer = async (reviewerId: string) => {
    if (!confirm('PERMANENTLY delete this reviewer record? This cannot be undone. All assignment history will be lost.')) return

    setSaving(reviewerId)
    try {
      const { error: deleteError } = await supabase
        .from('reviewers')
        .delete()
        .eq('id', reviewerId)

      if (deleteError) throw deleteError

      setReviewers(prev => prev.filter(r => r.id !== reviewerId))
      setSuccessMessage('Reviewer record permanently deleted')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Error deleting reviewer:', err)
      setError('Failed to delete reviewer')
    } finally {
      setSaving(null)
    }
  }

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor(row => row.user_profiles?.name || 'Unknown', {
        id: 'name',
        header: 'Reviewer',
        cell: info => (
          <div>
            <div className="fw-medium">{info.getValue()}</div>
            <div className="small text-muted">{info.row.original.user_profiles?.email}</div>
          </div>
        ),
      }),
      columnHelper.accessor(row => row.events?.title || 'Unassigned', {
        id: 'event',
        header: 'Event',
        cell: info => {
          const reviewer = info.row.original
          const hasEvent = reviewer.events !== null
          return (
            <div>
              <span className={`badge ${hasEvent ? 'bg-info' : 'bg-warning text-dark'}`}>
                {info.getValue()}
              </span>
              {!reviewer.is_active && (
                <span className="badge bg-secondary ms-1">Inactive</span>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('permissions', {
        header: 'Permissions',
        cell: info => {
          const perms = info.getValue()
          const allEnabled = Object.values(perms).filter(Boolean).length
          const totalPerms = Object.keys(perms).length

          return (
            <div className="d-flex flex-wrap gap-1">
              {perms.canViewApplications && <span className="badge bg-secondary">View</span>}
              {perms.canApprove && <span className="badge bg-success">Approve</span>}
              {perms.canReject && <span className="badge bg-danger">Reject</span>}
              {perms.canShortlist && <span className="badge bg-info">Shortlist</span>}
              {perms.canRevoke && <span className="badge bg-warning text-dark">Revoke</span>}
              {perms.canSendEmails && <span className="badge bg-primary">Email</span>}
              {allEnabled === totalPerms && <span className="badge bg-dark">Full Access</span>}
            </div>
          )
        },
      }),
      columnHelper.accessor('applications_reviewed', {
        header: 'Reviews',
        cell: info => (
          <span className="badge bg-primary">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('last_active_at', {
        header: 'Last Active',
        cell: info => {
          const date = info.getValue()
          if (!date) return <span className="text-muted">Never</span>
          return (
            <span className="small text-muted">
              {new Date(date).toLocaleDateString()}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => {
          const reviewer = info.row.original
          const isSaving = saving === reviewer.id
          return (
            <div className="d-flex gap-1">
              {/* Edit permissions */}
              <button
                className="btn btn-sm btn-outline-primary"
                title="Edit permissions"
                onClick={() => {
                  setEditingReviewer(reviewer)
                  setEditPermissions(reviewer.permissions)
                }}
              >
                <i className="icofont-settings"></i>
              </button>
              {/* Deactivate / Reactivate */}
              {reviewer.is_active ? (
                <button
                  className="btn btn-sm btn-outline-warning"
                  title="Deactivate (retain records)"
                  onClick={() => handleDeactivateReviewer(reviewer.id)}
                  disabled={isSaving}
                >
                  {isSaving ? <span className="spinner-border spinner-border-sm"></span> : <i className="icofont-ban"></i>}
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-sm btn-outline-success"
                    title="Reactivate reviewer"
                    onClick={() => handleReactivateReviewer(reviewer.id)}
                    disabled={isSaving}
                  >
                    {isSaving ? <span className="spinner-border spinner-border-sm"></span> : <i className="icofont-check"></i>}
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Permanently delete record"
                    onClick={() => handleDeleteReviewer(reviewer.id)}
                    disabled={isSaving}
                  >
                    <i className="icofont-trash"></i>
                  </button>
                </>
              )}
            </div>
          )
        },
      }),
    ],
    [saving]
  )

  const table = useReactTable({
    data: filteredReviewers,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Permission Checkbox Component
  const PermissionCheckbox = ({
    permissions,
    setPermissions,
    permKey,
  }: {
    permissions: ReviewerPermissions
    setPermissions: React.Dispatch<React.SetStateAction<ReviewerPermissions>>
    permKey: keyof ReviewerPermissions
  }) => (
    <div className="form-check mb-2">
      <input
        className="form-check-input"
        type="checkbox"
        id={`perm-${permKey}`}
        checked={permissions[permKey]}
        onChange={e => setPermissions(prev => ({ ...prev, [permKey]: e.target.checked }))}
      />
      <label className="form-check-label" htmlFor={`perm-${permKey}`}>
        <strong>{PERMISSION_LABELS[permKey].label}</strong>
        <br />
        <small className="text-muted">{PERMISSION_LABELS[permKey].description}</small>
      </label>
    </div>
  )

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
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
            <i className="icofont-users-alt-4 me-2"></i>
            Reviewer Management
          </h1>
          <p className="text-muted mb-0">Manage reviewer assignments and permissions</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/paper-assignments" className="btn btn-outline-primary">
            <i className="icofont-tasks me-2"></i>
            Paper Assignments
          </Link>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <i className="icofont-plus me-2"></i>
            Add Reviewer
          </button>
          <Link href="/admin" className="btn btn-outline-secondary">
            <i className="icofont-arrow-left me-2"></i>
            Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="icofont-search-1"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search reviewers..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={eventFilter}
                onChange={e => setEventFilter(e.target.value)}
              >
                <option value="all">All Reviewers</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="unassigned">Unassigned Reviewers</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reviewers Table */}
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
                      <i className="icofont-users-alt-4 d-block mb-2" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                      <h5>No Reviewers Found</h5>
                      <p className="mb-0">Add reviewers to start the review process.</p>
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
      </div>

      {/* Add Reviewer Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="icofont-user-alt-3 me-2"></i>
                  Add Reviewer
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info mb-3">
                  <i className="icofont-info-circle me-2"></i>
                  <strong>Multi-Event Support:</strong> You can assign the same reviewer to multiple events or make them a global reviewer for all upcoming events.
                </div>

                {/* User Selection */}
                <div className="mb-3">
                  <label className="form-label">Select User <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={newReviewerUserId}
                    onChange={e => setNewReviewerUserId(e.target.value)}
                  >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>

                  {/* Show existing event assignments for selected user */}
                  {existingAssignments.length > 0 && (
                    <div className="mt-2 alert alert-warning py-2">
                      <small>
                        <strong>⚠️ Currently assigned to:</strong>
                        <ul className="mb-0 mt-1 ps-3">
                          {existingAssignments.map((assignment, idx) => (
                            <li key={idx}>{assignment.eventTitle}</li>
                          ))}
                        </ul>
                      </small>
                    </div>
                  )}
                </div>

                {/* Global Reviewer Option */}
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="globalReviewer"
                      checked={isGlobalReviewer}
                      onChange={e => {
                        setIsGlobalReviewer(e.target.checked)
                        if (e.target.checked) {
                          setNewReviewerEventIds([]) // Clear individual event selections
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor="globalReviewer">
                      <strong>Global Reviewer (All Upcoming Events)</strong>
                      <br />
                      <small className="text-muted">
                        Assign this reviewer to all {events.length} upcoming event{events.length !== 1 ? 's' : ''}
                      </small>
                    </label>
                  </div>
                </div>

                {/* Event Selection (only shown if not global reviewer) */}
                {!isGlobalReviewer && (
                  <div className="mb-3">
                    <label className="form-label">
                      Select Events <span className="text-danger">*</span>
                      <small className="text-muted ms-2">(Choose one or more)</small>
                    </label>
                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {events.length === 0 ? (
                        <p className="text-muted mb-0">No upcoming events available</p>
                      ) : (
                        events.map(event => (
                          <div key={event.id} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`event-${event.id}`}
                              checked={newReviewerEventIds.includes(event.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setNewReviewerEventIds(prev => [...prev, event.id])
                                } else {
                                  setNewReviewerEventIds(prev => prev.filter(id => id !== event.id))
                                }
                              }}
                            />
                            <label className="form-check-label" htmlFor={`event-${event.id}`}>
                              {event.title}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {newReviewerEventIds.length > 0 && (
                      <small className="text-muted">
                        {newReviewerEventIds.length} event{newReviewerEventIds.length !== 1 ? 's' : ''} selected
                      </small>
                    )}
                  </div>
                )}

                {/* Show summary if global reviewer */}
                {isGlobalReviewer && events.length > 0 && (
                  <div className="alert alert-success py-2 mb-3">
                    <small>
                      <strong>✓ Will be assigned to {events.length} upcoming event{events.length !== 1 ? 's' : ''}:</strong>
                      <ul className="mb-0 mt-1 ps-3" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                        {events.map(event => (
                          <li key={event.id}>{event.title}</li>
                        ))}
                      </ul>
                    </small>
                  </div>
                )}

                <hr />

                <h6 className="mb-3">
                  <i className="icofont-shield me-2"></i>
                  Permissions
                </h6>
                <div className="row">
                  <div className="col-md-4">
                    <small className="text-muted fw-bold d-block mb-2">Core Permissions</small>
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canViewApplications"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canViewPII"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canViewSurveyResponses"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canViewPaperSubmissions"
                    />
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted fw-bold d-block mb-2">Decision Permissions</small>
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canApprove"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canReject"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canWaitlist"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canShortlist"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canRevoke"
                    />
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted fw-bold d-block mb-2">Communication Permissions</small>
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canSendEmails"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canSendReminders"
                    />
                    <PermissionCheckbox
                      permissions={newReviewerPermissions}
                      setPermissions={setNewReviewerPermissions}
                      permKey="canComment"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddReviewer}
                  disabled={saving === 'add'}
                >
                  {saving === 'add' ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="icofont-plus me-2"></i>
                  )}
                  Add Reviewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingReviewer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="icofont-settings me-2"></i>
                  Edit Permissions
                </h5>
                <button type="button" className="btn-close" onClick={() => setEditingReviewer(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>{editingReviewer.user_profiles?.name}</strong>
                </div>

                {/* Issue #13 FIX: Event assignment dropdown */}
                <div className="mb-3">
                  <label className="form-label">Assigned Event</label>
                  <select
                    className="form-select"
                    value={editEventId || editingReviewer.event_id || 'global'}
                    onChange={(e) => setEditEventId(e.target.value)}
                  >
                    <option value="global">Global Reviewer (all events)</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>

                <hr />

                <h6 className="mb-3">Permissions</h6>
                <div className="row">
                  <div className="col-md-4">
                    <small className="text-muted fw-bold d-block mb-2">Core</small>
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canViewApplications"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canViewPII"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canViewSurveyResponses"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canViewPaperSubmissions"
                    />
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted fw-bold d-block mb-2">Decisions</small>
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canApprove"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canReject"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canWaitlist"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canShortlist"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canRevoke"
                    />
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted fw-bold d-block mb-2">Communications</small>
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canSendEmails"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canSendReminders"
                    />
                    <PermissionCheckbox
                      permissions={editPermissions}
                      setPermissions={setEditPermissions}
                      permKey="canComment"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingReviewer(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdatePermissions}
                  disabled={saving === editingReviewer.id}
                >
                  {saving === editingReviewer.id ? (
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
      </div>
    </DashboardLayout>
  )
}
