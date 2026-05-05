'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { DataTable, Pagination, SearchFilter } from '@/components/admin/ui'
import { useAdminSponsors } from '@/hooks/useAdminApi'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'

export default function AdminSponsorsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')

  // Use React Query hook
  const { data: sponsors, isLoading: loading, refetch } = useAdminSponsors({
    search: searchTerm.trim() || undefined,
    tier: tierFilter !== 'all' ? tierFilter : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  const totalItems = !sponsors || sponsors.length === 0 ? 0 : sponsors.length

  const handleDelete = async (sponsor: any) => {
    const confirmed = await showDeleteConfirmation(`"${sponsor.name}"`)
    if (!confirmed) return

    showLoading('Deleting sponsor...')
    const result = await adminApi.sponsors.delete(sponsor.id)
    closeAlert()

    if (result.success) {
      showSuccess('Deleted!', 'Sponsor deleted successfully', 2000)
      refetch()
    } else {
      showError('Delete Failed', result.error || 'Failed to delete sponsor')
    }
  }

  const columns = [
    { key: 'name', label: 'Sponsor', render: (v: string, row: any) => (
      <div>
        <strong>{v}</strong>
        {row.logo_url && <img src={row.logo_url} alt="" className="d-block mt-1" style={{ width: '100px', height: '40px', objectFit: 'contain' }} />}
      </div>
    )},
    { key: 'tier', label: 'Tier', render: (v: string) => <span className="badge bg-warning">{v}</span> },
    { key: 'website_url', label: 'Website', render: (v: string) => v ? <a href={v} target="_blank">Visit</a> : '-' },
  ]

  const actions = [
    { label: 'Edit', onClick: (row: any) => router.push(`/admin/sponsors/${row.id}`), variant: 'primary' as const },
    { label: 'Delete', onClick: (row: any) => handleDelete(row), variant: 'danger' as const },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6"><h2>Sponsors</h2></div>
          <div className="col-md-6 text-md-end">
            <button className="btn btn-primary" onClick={() => router.push('/admin/sponsors/new')}>➕ Add Sponsor</button>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search sponsors by name..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
          filters={[
            {
              label: 'Tier',
              key: 'tier',
              options: [
                { label: 'All Tiers', value: 'all' },
                { label: 'Platinum', value: 'platinum' },
                { label: 'Gold', value: 'gold' },
                { label: 'Silver', value: 'silver' },
                { label: 'Bronze', value: 'bronze' }
              ],
              value: tierFilter,
              onChange: setTierFilter
            }
          ]}
        />

        <div className="card">
          <div className="card-body">
            <DataTable data={sponsors || []} columns={columns} actions={actions} loading={loading} emptyMessage="No sponsors" />

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
