'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
// Admin dashboard with stats and quick links
// Created: Admin UI Phase 1 - Foundation
// Updated: Phase 2 - Role-Based System (using unified DashboardLayout)

import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { useAdminDashboardStats } from '@/hooks/useAdminApi'

export default function AdminDashboardPage() {
  // React Query hook - automatic caching, no useRef needed
  const { data: stats, isLoading: loading } = useAdminDashboardStats()

  // Default values if no data yet
  const dashboardStats = stats || {
    totalPosts: 0,
    totalEvents: 0,
    totalSpeakers: 0,
    totalSponsors: 0,
    totalApplications: 0,
    totalSubscribers: 0,
  }

  const statCards = [
    { label: 'Posts', value: dashboardStats.totalPosts, color: 'primary', icon: '📝', href: '/admin/posts' },
    { label: 'Events', value: dashboardStats.totalEvents, color: 'success', icon: '📅', href: '/admin/events' },
    { label: 'Speakers', value: dashboardStats.totalSpeakers, color: 'info', icon: '🎤', href: '/admin/speakers' },
    { label: 'Sponsors', value: dashboardStats.totalSponsors, color: 'warning', icon: '💼', href: '/admin/sponsors' },
    { label: 'Applications', value: dashboardStats.totalApplications, color: 'danger', icon: '📋', href: '/admin/applications' },
    { label: 'Subscribers', value: dashboardStats.totalSubscribers, color: 'secondary', icon: '📧', href: '/admin/subscribers' },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-2">Dashboard</h2>
            <p className="text-muted">Welcome to the IndabaX Kenya admin panel</p>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading statistics...</p>
          </div>
        ) : (
          <div className="row g-4 mb-4">
            {statCards.map((card) => (
              <div key={card.label} className="col-md-6 col-lg-4">
                <div className={`card stat-card border-${card.color}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="stat-label">{card.label}</span>
                      <span style={{ fontSize: '2rem' }}>{card.icon}</span>
                    </div>
                    <div className={`stat-value text-${card.color}`}>{card.value}</div>
                    <a href={card.href} className={`btn btn-sm btn-${card.color} ${card.color === 'info' ? 'text-white' : ''} mt-3`}>
                      Manage {card.label} →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Quick Actions</h5>
                <div className="row g-3 mt-2">
                  <div className="col-md-3">
                    <a href="/admin/posts/new" className="btn btn-primary w-100">
                      <span className="me-2">📝</span>
                      Create Post
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="/admin/events/new" className="btn btn-success w-100">
                      <span className="me-2">📅</span>
                      Create Event
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="/admin/speakers/new" className="btn btn-info w-100 text-white">
                      <span className="me-2">🎤</span>
                      Add Speaker
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="/admin/gallery" className="btn btn-warning w-100">
                      <span className="me-2">📸</span>
                      Upload Photo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
