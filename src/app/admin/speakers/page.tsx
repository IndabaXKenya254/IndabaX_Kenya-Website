'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DataTable, Pagination, SearchFilter } from '@/components/admin/ui'
import { useAdminSpeakers } from '@/hooks/useAdminApi'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'

const STORAGE_KEY = 'admin_speakers_items_per_page'

export default function AdminSpeakersPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Load saved preference from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? parseInt(saved, 10) : 10
    }
    return 10
  })
  const [searchTerm, setSearchTerm] = useState('')

  // Persist itemsPerPage to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, itemsPerPage.toString())
    }
    // Reset to page 1 when items per page changes
    setCurrentPage(1)
  }, [itemsPerPage])

  // Use React Query hook
  const { data: speakers, isLoading: loading, refetch } = useAdminSpeakers({
    search: searchTerm.trim() || undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  const totalItems = !speakers || speakers.length === 0 ? 0 : speakers.length

  const handleDelete = async (speaker: any) => {
    const confirmed = await showDeleteConfirmation(`"${speaker.name}"`)
    if (!confirmed) return

    showLoading('Deleting speaker...')
    const result = await adminApi.speakers.delete(speaker.id)
    closeAlert()

    if (result.success) {
      showSuccess('Deleted!', 'Speaker deleted successfully', 2000)
      refetch()
    } else {
      showError('Delete Failed', result.error || 'Failed to delete speaker')
    }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (v: string, row: any) => (
      <div>
        <strong>{v}</strong>
        {row.photo_url && <img src={row.photo_url} alt="" className="d-block mt-1" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }} />}
      </div>
    )},
    { key: 'organization', label: 'Organization' },
    { key: 'linkedin_url', label: 'LinkedIn', render: (v: string) => v ? <a href={v} target="_blank">View</a> : '-' },
  ]

  const actions = [
    { label: 'Edit', onClick: (row: any) => router.push(`/admin/speakers/${row.id}`), variant: 'primary' as const, icon: '✏️' },
    { label: 'Delete', onClick: (row: any) => handleDelete(row), variant: 'danger' as const, icon: '🗑️' },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Speakers</h2>
            <p className="text-muted">Manage event speakers</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button className="btn btn-primary" onClick={() => router.push('/admin/speakers/new')}>
              <i className="icofont-plus me-2"></i>
              Add Speaker
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search speakers by name, organization..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
        />

        <div className="card">
          <div className="card-body">
            <DataTable data={speakers || []} columns={columns} actions={actions} loading={loading} emptyMessage="No speakers found" />

            {!loading && totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage)}
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
