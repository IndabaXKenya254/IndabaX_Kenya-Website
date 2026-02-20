'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL TEMPLATES LIST PAGE (PHASE 7)
// ═══════════════════════════════════════════════════════════════════════
// Admin page to view, create, edit, and delete email templates

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  description: string | null
  type: string | null
  category: string | null
  is_reusable: boolean
  is_system: boolean
  variables: string[]
  created_by: string
  created_at: string
  updated_at: string
  user_profiles: {
    id: string
    name: string
    email: string
  }
}

export default function EmailTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Get unique categories from templates
  const availableCategories = Array.from(
    new Set(
      templates.map(t => t.category || t.type || 'custom').filter(Boolean)
    )
  ).sort()

  // Fetch templates
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates')
      const result = await response.json()
      if (result.success) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string, is_system: boolean) => {
    if (is_system) {
      alert('Cannot delete system templates')
      return
    }

    if (!confirm(`Are you sure you want to delete template "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/email-templates/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        alert('Template deleted successfully')
        fetchTemplates()
      } else {
        alert(result.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete template')
    }
  }

  // Table columns
  const columns: ColumnDef<EmailTemplate>[] = [
    {
      accessorKey: 'name',
      header: 'Template Name',
      cell: ({ row }) => (
        <div>
          <div className="fw-bold">{row.original.name}</div>
          {row.original.description && (
            <small className="text-muted">{row.original.description}</small>
          )}
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.category || row.original.type || 'custom'
        const badgeClass = {
          application: 'bg-primary',
          survey: 'bg-info',
          ticketing: 'bg-success',
          general: 'bg-secondary',
          custom: 'bg-warning',
          admin: 'bg-danger',
          auth: 'bg-dark',
          registration: 'bg-secondary',
          notification: 'bg-info'
        }[category] || 'bg-secondary'

        return (
          <span className={`badge ${badgeClass}`}>
            {category}
          </span>
        )
      }
    },
    {
      accessorKey: 'is_system',
      header: 'Type',
      cell: ({ row }) => (
        row.original.is_system ? (
          <span className="badge bg-dark">System</span>
        ) : (
          <span className="badge bg-light text-dark">Custom</span>
        )
      )
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <div className="text-truncate" style={{ maxWidth: '300px' }}>
          {row.original.subject}
        </div>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <small className="text-muted">
          {new Date(row.original.created_at).toLocaleDateString()}
        </small>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-primary"
            onClick={() => router.push(`/admin/email-templates/${row.original.id}`)}
          >
            <i className="icofont-eye"></i>
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => router.push(`/admin/email-templates/${row.original.id}/edit`)}
            disabled={row.original.is_system}
          >
            <i className="icofont-edit"></i>
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={() => handleDelete(row.original.id, row.original.name, row.original.is_system)}
            disabled={row.original.is_system}
          >
            <i className="icofont-trash"></i>
          </button>
        </div>
      )
    }
  ]

  // Initialize table
  const table = useReactTable({
    data: templates,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 25, // Default to 25 items per page
      },
    },
  })

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading email templates...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Email Templates</h2>
            <p className="text-muted mb-0">Manage reusable email templates with variables</p>
          </div>
          <button
          className="btn btn-primary"
          onClick={() => router.push('/admin/email-templates/new')}
        >
          <i className="icofont-plus me-2"></i>
          New Template
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Search Box */}
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search templates..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>

            {/* Category Filter - Dynamic from data */}
            <div className="col-md-2">
              <select
                className="form-select"
                onChange={(e) => {
                  const value = e.target.value
                  table.getColumn('category')?.setFilterValue(value || undefined)
                }}
              >
                <option value="">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                onChange={(e) => {
                  const value = e.target.value
                  if (value === 'system') {
                    table.getColumn('is_system')?.setFilterValue(true)
                  } else if (value === 'custom') {
                    table.getColumn('is_system')?.setFilterValue(false)
                  } else {
                    table.getColumn('is_system')?.setFilterValue(undefined)
                  }
                }}
              >
                <option value="">All Types</option>
                <option value="system">System</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Filter by subject..."
                onChange={(e) => {
                  const value = e.target.value
                  table.getColumn('subject')?.setFilterValue(value || undefined)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          {templates.length === 0 ? (
            <div className="text-center py-5">
              <i className="icofont-email" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
              <h5 className="mt-3">No Email Templates</h5>
              <p className="text-muted">Create your first email template to get started</p>
              <button
                className="btn btn-primary"
                onClick={() => router.push('/admin/email-templates/new')}
              >
                <i className="icofont-plus me-2"></i>
                Create Template
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽'
                            }[header.column.getIsSorted() as string] ?? null}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="text-muted">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length
                    )}{' '}
                    of {table.getFilteredRowModel().rows.length} templates
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <label htmlFor="pageSize" className="text-muted mb-0 small">Show:</label>
                    <select
                      id="pageSize"
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => {
                        table.setPageSize(Number(e.target.value))
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={templates.length}>All</option>
                    </select>
                  </div>
                </div>
                <div className="btn-group">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <i className="icofont-rounded-left"></i> Previous
                  </button>
                  <button className="btn btn-outline-secondary" disabled>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next <i className="icofont-rounded-right"></i>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
