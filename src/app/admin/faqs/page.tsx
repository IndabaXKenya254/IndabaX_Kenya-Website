'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { DataTable, Pagination, SearchFilter } from '@/components/admin/ui'
import { useAdminFAQs } from '@/hooks/useAdminApi'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'

export default function AdminFaqsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  // Use React Query hook
  const { data: faqs, isLoading: loading, refetch } = useAdminFAQs({
    search: searchTerm.trim() || undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  const totalItems = !faqs || faqs.length === 0 ? 0 : faqs.length

  const handleDelete = async (faq: any) => {
    const confirmed = await showDeleteConfirmation(`this FAQ: "${faq.question.substring(0, 50)}..."`)
    if (!confirmed) return

    showLoading('Deleting FAQ...')
    const result = await adminApi.faqs.delete(faq.id)
    closeAlert()

    if (result.success) {
      showSuccess('Deleted!', 'FAQ deleted successfully', 2000)
      refetch()
    } else {
      showError('Delete Failed', result.error || 'Failed to delete FAQ')
    }
  }

  const columns = [
    { key: 'question', label: 'Question', render: (v: string) => <strong>{v}</strong> },
    { key: 'category', label: 'Category', render: (v: string) => <span className="badge bg-info">{v}</span> },
    { key: 'order', label: 'Order' },
  ]

  const actions = [
    { label: 'Edit', onClick: (row: any) => router.push(`/admin/faqs/${row.id}`), variant: 'primary' as const },
    { label: 'Delete', onClick: (row: any) => handleDelete(row), variant: 'danger' as const },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6"><h2>FAQs</h2></div>
          <div className="col-md-6 text-md-end">
            <button className="btn btn-primary" onClick={() => router.push('/admin/faqs/new')}>
              <i className="icofont-plus me-2"></i>
              Add FAQ
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search FAQs by question or answer..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
        />

        <div className="card">
          <div className="card-body">
            <DataTable data={faqs || []} columns={columns} actions={actions} loading={loading} emptyMessage="No FAQs" />

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
