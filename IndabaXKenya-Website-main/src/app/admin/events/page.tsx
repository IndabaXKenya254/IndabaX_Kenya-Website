'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENTS LIST PAGE
// ═══════════════════════════════════════════════════════════════════════
// List and manage all events
// Created: Admin UI Phase 2 - Content Management

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DataTable, Pagination, SearchFilter } from '@/components/admin/ui'
import { useAdminEvents } from '@/hooks/useAdminApi'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  event_type: string
  status: 'draft' | 'published' | 'upcoming' | 'ongoing' | 'past' | 'archived' | 'cancelled'
  featured_image: string | null
  registration_url: string | null
  max_attendees: number | null
  created_at: string
}

export default function AdminEventsPage() {
  const router = useRouter()

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Use React Query hook
  const { data: events, isLoading: loading, refetch } = useAdminEvents({
    search: searchTerm.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    event_type: typeFilter !== 'all' ? typeFilter : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  const totalItems = !events || events.length === 0 ? 0 : events.length

  // Issue #17, #19 FIX: Soft delete (archive) events to preserve applications and reviewer records
  const handleDelete = async (event: Event) => {
    const confirmed = await showDeleteConfirmation(`"${event.title}"`, {
      text: 'This will archive the event. Applications and reviewer assignments will be preserved.'
    })
    if (!confirmed) return

    showLoading('Archiving event...')

    try {
      const result = await adminApi.events.delete(event.id)
      closeAlert()

      if (result.success) {
        showSuccess('Archived!', 'Event has been archived. Applications and reviewer records are preserved.', 3000)
        refetch()
      } else {
        showError('Archive Failed', result.error || 'Failed to archive event')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'An unexpected error occurred while archiving the event')
    }
  }

  // Calculate total pages based on server count
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const columns = [
    {
      key: 'title',
      label: 'Event',
      render: (value: string, row: Event) => (
        <div>
          <strong>{value}</strong>
          <div className="text-muted small">{row.location}</div>
        </div>
      ),
    },
    {
      key: 'start_date',
      label: 'Date',
      render: (value: string, row: Event) => (
        <div>
          <div>{new Date(value).toLocaleDateString()}</div>
          {row.end_date && row.end_date !== value && (
            <div className="text-muted small">to {new Date(row.end_date).toLocaleDateString()}</div>
          )}
        </div>
      ),
    },
    {
      key: 'event_type',
      label: 'Type',
      render: (value: string) => (
        <span className="badge bg-info">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const badgeClass =
          value === 'upcoming' ? 'primary' :
          value === 'ongoing' ? 'success' :
          value === 'past' ? 'secondary' :
          value === 'archived' ? 'dark' :  // Issue #17, #19: Show archived events distinctly
          value === 'cancelled' ? 'danger' : 'warning'
        return <span className={`badge bg-${badgeClass}`}>{value}</span>
      },
    },
    {
      key: 'max_attendees',
      label: 'Capacity',
      render: (value: number | null) => value || '-',
    },
  ]

  const actions = [
    {
      label: 'Edit',
      onClick: (row: Event) => router.push(`/admin/events/${row.id}`),
      variant: 'primary' as const,
      icon: '✏️',
    },
    {
      // Issue #17, #19: Changed to "Archive" to clarify soft-delete behavior
      label: 'Archive',
      onClick: (row: Event) => handleDelete(row),
      variant: 'secondary' as const,
      icon: '📦',
    },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Events</h2>
            <p className="text-muted">Manage conference events and workshops</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-primary"
              onClick={() => router.push('/admin/events/new')}
            >
              <span className="me-2">➕</span>
              Create Event
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search events by title, description, location..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
          filters={[
            {
              label: 'Status',
              key: 'status',
              options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Upcoming', value: 'upcoming' },
                { label: 'Ongoing', value: 'ongoing' },
                { label: 'Past', value: 'past' },
                { label: 'Archived', value: 'archived' },  // Issue #17, #19: View archived events
                { label: 'Cancelled', value: 'cancelled' }
              ],
              value: statusFilter,
              onChange: setStatusFilter
            },
            {
              label: 'Type',
              key: 'type',
              options: [
                { label: 'All Types', value: 'all' },
                { label: 'Conference', value: 'conference' },
                { label: 'Workshop', value: 'workshop' },
                { label: 'Meetup', value: 'meetup' }
              ],
              value: typeFilter,
              onChange: setTypeFilter
            }
          ]}
        />

        {/* Data Table */}
        <div className="card">
          <div className="card-body">
            <DataTable
              data={events || []}
              columns={columns}
              actions={actions}
              loading={loading}
              emptyMessage="No events found. Create your first event to get started!"
            />

            {!loading && totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
