'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DataTable, Alert, Modal, Pagination } from '@/components/admin/ui'
import { useAdminApplications } from '@/hooks/useAdminApi'
import { adminApi } from '@/lib/admin/api-client'

export default function AdminApplicationsPage() {
  const router = useRouter()
  const [alert, setAlert] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Use React Query hook
  const { data: applications, isLoading: loading, refetch } = useAdminApplications({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  const totalItems = !applications || applications.length === 0 ? 0 : applications.length

  const handleStatusChange = async (id: string, status: string) => {
    const result = await adminApi.applications.update(id, { status })
    if (result.success) {
      setAlert({ type: 'success', message: `Application ${status}` })
      refetch()
    } else {
      setAlert({ type: 'danger', message: result.error })
    }
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const columns = [
    {
      key: 'name',
      label: 'Applicant',
      render: (v: string, row: any) => (
        <div>
          <strong>{v}</strong>
          <div className="text-muted small">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v: string) => {
        const variant = v === 'accepted' ? 'success' : v === 'rejected' ? 'danger' : 'warning'
        return <span className={`badge bg-${variant}`}>{v}</span>
      },
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ]

  const actions = [
    {
      label: 'View',
      onClick: (row: any) => router.push(`/admin/applications/${row.id}`),
      variant: 'primary' as const,
      icon: '👁️',
    },
    {
      label: 'Accept',
      onClick: (row: any) => handleStatusChange(row.id, 'accepted'),
      variant: 'success' as const,
      icon: '✓',
    },
    {
      label: 'Reject',
      onClick: (row: any) => handleStatusChange(row.id, 'rejected'),
      variant: 'danger' as const,
      icon: '✗',
    },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Applications</h2>
            <p className="text-muted">Review and manage event applications</p>
          </div>
          <div className="col-md-6 text-md-end">
            <select
              className="form-select w-auto d-inline-block"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="card">
          <div className="card-body">
            <DataTable
              data={applications || []}
              columns={columns}
              actions={actions}
              loading={loading}
              emptyMessage="No applications found"
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
