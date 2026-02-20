'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAGINATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Reusable pagination controls
// Created: Admin UI Phase 2 - Content Management

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show current page and neighbors
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // If only 1 page, show item count without pagination controls
  if (totalPages <= 1) {
    return (
      <div className="d-flex justify-content-between align-items-center mt-4">
        {totalItems && itemsPerPage && (
          <div className="text-muted small">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-2">
      {/* Item count info */}
      {totalItems && itemsPerPage && (
        <div className="text-muted small">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
      )}

      {/* Pagination controls */}
      <nav aria-label="Page navigation">
        <ul className="pagination mb-0">
          {/* Previous button */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              aria-label="Previous"
            >
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>

          {/* Page numbers */}
          {getPageNumbers().map((page, index) => (
            <li
              key={index}
              className={`page-item ${
                page === currentPage ? 'active' : ''
              } ${page === '...' ? 'disabled' : ''}`}
            >
              {page === '...' ? (
                <span className="page-link">...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => onPageChange(page as number)}
                >
                  {page}
                </button>
              )}
            </li>
          ))}

          {/* Next button */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              aria-label="Next"
            >
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
