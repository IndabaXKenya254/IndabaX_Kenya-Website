'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - POSTS LIST PAGE
// ═══════════════════════════════════════════════════════════════════════
// List and manage all posts with filters and actions
// Created: Admin UI Phase 2 - Content Management

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DataTable, Pagination, SearchFilter } from '@/components/admin/ui'
import { useAdminPosts } from '@/hooks/useAdminApi'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert } from '@/lib/sweetalert'

interface Post {
  id: string
  title: string
  content: string
  status: 'draft' | 'published' | 'archived'
  category: string
  featured_image_url: string | null
  author_id: string
  created_at: string
  updated_at: string
  published_at: string | null
  // Sauti Yetu fields
  post_type: 'normal' | 'sauti_yetu'
  external_url: string | null
  og_image: string | null
  source_name: string | null
}

export default function AdminPostsPage() {
  const router = useRouter()

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [postTypeFilter, setPostTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Use React Query hook
  const { data: posts, isLoading: loading, refetch } = useAdminPosts({
    search: searchTerm.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    post_type: postTypeFilter !== 'all' ? postTypeFilter : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  const totalItems = !posts || posts.length === 0 ? 0 : posts.length

  const handleDelete = async (post: Post) => {
    // Show confirmation dialog
    const confirmed = await showDeleteConfirmation(`"${post.title}"`)

    if (!confirmed) return

    // Show loading
    showLoading('Deleting post...')

    try {
      const result = await adminApi.posts.delete(post.id)

      closeAlert()

      if (result.success) {
        showSuccess('Deleted!', 'Post has been deleted successfully', 2000)
        refetch()
      } else {
        showError('Delete Failed', result.error || 'Failed to delete post')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'An unexpected error occurred while deleting the post')
    }
  }

  // Calculate total pages based on server count
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (value: string, row: Post) => (
        <div>
          <div className="d-flex align-items-center gap-2">
            <strong>{value}</strong>
            {row.post_type === 'sauti_yetu' && (
              <span className="badge bg-info" title="External link post">
                <i className="bi bi-link-45deg me-1"></i>
                Sauti Yetu
              </span>
            )}
          </div>
          {row.post_type === 'sauti_yetu' && row.source_name && (
            <small className="text-muted">
              <i className="bi bi-globe me-1"></i>
              {row.source_name}
            </small>
          )}
          {(row.featured_image_url || row.og_image) && (
            <img
              src={row.featured_image_url || row.og_image || ''}
              alt=""
              className="d-block mt-1"
              style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
            />
          )}
        </div>
      ),
    },
    {
      key: 'post_type',
      label: 'Type',
      render: (value: string) => {
        if (value === 'sauti_yetu') {
          return <span className="badge bg-info"><i className="bi bi-link-45deg me-1"></i>External</span>
        }
        return <span className="badge bg-secondary"><i className="bi bi-file-text me-1"></i>Normal</span>
      },
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: string) => (
        <span className="badge bg-secondary">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const badgeClass = value === 'published' ? 'success' : value === 'draft' ? 'warning' : 'secondary'
        return <span className={`badge bg-${badgeClass}`}>{value}</span>
      },
    },
    {
      key: 'published_at',
      label: 'Published',
      render: (value: string | null) => (
        value ? new Date(value).toLocaleDateString() : '-'
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ]

  const actions = [
    {
      label: 'Edit',
      onClick: (row: Post) => router.push(`/admin/posts/${row.id}`),
      variant: 'primary' as const,
      icon: '✏️',
    },
    {
      label: 'Delete',
      onClick: (row: Post) => handleDelete(row),
      variant: 'danger' as const,
      icon: '🗑️',
    },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Posts</h2>
            <p className="text-muted">Manage blog posts and announcements</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              className="btn btn-primary"
              onClick={() => router.push('/admin/posts/new')}
            >
              <span className="me-2">➕</span>
              Create Post
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search posts by title, content..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
          filters={[
            {
              label: 'Post Type',
              key: 'post_type',
              options: [
                { label: 'All Types', value: 'all' },
                { label: 'Normal Posts', value: 'normal' },
                { label: 'Sauti Yetu (External)', value: 'sauti_yetu' }
              ],
              value: postTypeFilter,
              onChange: setPostTypeFilter
            },
            {
              label: 'Status',
              key: 'status',
              options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Published', value: 'published' },
                { label: 'Draft', value: 'draft' },
                { label: 'Archived', value: 'archived' }
              ],
              value: statusFilter,
              onChange: setStatusFilter
            },
            {
              label: 'Category',
              key: 'category',
              options: [
                { label: 'All Categories', value: 'all' },
                { label: 'News', value: 'news' },
                { label: 'Announcement', value: 'announcement' },
                { label: 'Event', value: 'event' },
                { label: 'Blog', value: 'blog' }
              ],
              value: categoryFilter,
              onChange: setCategoryFilter
            }
          ]}
        />

        {/* Data Table */}
        <div className="card">
          <div className="card-body">
            <DataTable
              data={posts || []}
              columns={columns}
              actions={actions}
              loading={loading}
              emptyMessage="No posts found. Create your first post to get started!"
            />

            {/* Pagination */}
            {!loading && totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            )}

            {/* Search results info */}
            {searchTerm && totalItems > 0 && (
              <div className="text-muted text-center mt-3">
                Showing {totalItems} search result{totalItems !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
