'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - DATA TABLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Reusable data table with actions
// Created: Admin UI Phase 2 - Content Management

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface Action {
  label: string
  onClick: (row: any) => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  icon?: string
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  actions?: Action[]
  loading?: boolean
  emptyMessage?: string
}

export function DataTable({ data, columns, actions, loading, emptyMessage = 'No data found' }: DataTableProps) {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading data...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {actions && actions.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td>
                  <div className="btn-group btn-group-sm" role="group">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        type="button"
                        className={`btn btn-${action.variant || 'primary'}`}
                        onClick={() => action.onClick(row)}
                        title={action.label}
                      >
                        {action.icon && <span className="me-1">{action.icon}</span>}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
