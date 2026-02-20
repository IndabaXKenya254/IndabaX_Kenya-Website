'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DataTable, Alert, Pagination } from '@/components/admin/ui'
import { useAdminSubscribers } from '@/hooks/useAdminApi'

export default function AdminSubscribersPage() {
  const [alert, setAlert] = useState<any>(null)

  // Use React Query hook (no pagination for subscribers)
  const { data: subscribers, isLoading: loading } = useAdminSubscribers()

  const totalItems = (subscribers || []).length

  const handleExport = () => {
    // Create CSV content
    const csvHeader = 'Email,Subscribed At\n'
    const csvRows = (subscribers || [])
      .map((sub) => `${sub.email},${new Date(sub.subscribed_at).toLocaleString()}`)
      .join('\n')
    const csvContent = csvHeader + csvRows

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)

    setAlert({ type: 'success', message: 'Subscribers exported to CSV' })
  }

  const columns = [
    { key: 'email', label: 'Email', render: (v: string) => <strong>{v}</strong> },
    {
      key: 'subscribed_at',
      label: 'Subscribed',
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Newsletter Subscribers</h2>
            <p className="text-muted">Total subscribers: {totalItems}</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-success"
              onClick={handleExport}
              disabled={totalItems === 0}
            >
              📥 Export to CSV
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="card">
          <div className="card-body">
            <DataTable
              data={subscribers || []}
              columns={columns}
              loading={loading}
              emptyMessage="No subscribers yet"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
