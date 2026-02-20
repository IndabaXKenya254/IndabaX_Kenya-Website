'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SEARCH & FILTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Reusable search and filter controls for admin pages

import { useState } from 'react'

interface SearchFilterProps {
  searchPlaceholder?: string
  onSearchChange: (value: string) => void
  filters?: {
    label: string
    key: string
    options: { label: string; value: string }[]
    value: string
    onChange: (value: string) => void
  }[]
  itemsPerPageOptions?: number[]
  currentItemsPerPage?: number
  onItemsPerPageChange?: (value: number) => void
  totalItems?: number
}

export function SearchFilter({
  searchPlaceholder = 'Search...',
  onSearchChange,
  filters = [],
  itemsPerPageOptions = [10, 25, 50, 100],
  currentItemsPerPage = 10,
  onItemsPerPageChange,
  totalItems
}: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearchChange(value)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    onSearchChange('')
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          {/* Search Box */}
          <div className="col-md-4">
            <label className="form-label small text-muted mb-1">
              <i className="icofont-search me-1"></i>
              Search
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <i className="icofont-close"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {filters.map((filter) => (
            <div key={filter.key} className="col-md-2">
              <label className="form-label small text-muted mb-1">
                {filter.label}
              </label>
              <select
                className="form-select"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Items Per Page */}
          {onItemsPerPageChange && (
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">
                Items per page
              </label>
              <select
                className="form-select"
                value={currentItemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Total Count Badge */}
          {totalItems !== undefined && (
            <div className="col-md-auto ms-auto">
              <div className="badge bg-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                <i className="icofont-chart-histogram me-2"></i>
                {totalItems} {totalItems === 1 ? 'item' : 'items'} total
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
