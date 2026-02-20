'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Main layout wrapper with sidebar for admin panel
// Created: Admin UI Phase 1 - Foundation

import { useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import Link from 'next/link'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open')
    } else {
      document.body.classList.remove('mobile-menu-open')
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open')
    }
  }, [mobileMenuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const navGroups = useMemo(() => [
    // Dashboard - always visible (no group)
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'icofont-dashboard-web',
      href: '/admin/dashboard',
      standalone: true
    },

    // Content Management
    {
      id: 'content',
      label: 'Content',
      icon: 'icofont-paper',
      items: [
        { href: '/admin/events', label: 'Events', icon: 'icofont-calendar' },
        { href: '/admin/posts', label: 'News & Updates', icon: 'icofont-paper' },
        { href: '/admin/speakers', label: 'Speakers', icon: 'icofont-user-alt-4' },
        { href: '/admin/team', label: 'Team', icon: 'icofont-users-alt-5' },
        { href: '/admin/sponsors', label: 'Sponsors', icon: 'icofont-company' },
        { href: '/admin/gallery', label: 'Gallery', icon: 'icofont-image' },
        { href: '/admin/faqs', label: 'FAQs', icon: 'icofont-question-circle' },
        { href: '/admin/venues', label: 'Venues', icon: 'icofont-building-alt' },
        { href: '/admin/schedule', label: 'Schedule', icon: 'icofont-clock-time' },
        { href: '/admin/pricing', label: 'Pricing', icon: 'icofont-price' },
        { href: '/admin/why-attend', label: 'Why Attend', icon: 'icofont-star' },
        { href: '/admin/donations', label: 'Donations', icon: 'icofont-heart' },
      ]
    },

    // NOAI Management - Issue #3 FIX: Updated to match existing pages
    {
      id: 'noai',
      label: 'NOAI',
      icon: 'icofont-brain-alt',
      items: [
        { href: '/admin/noai', label: 'Dashboard', icon: 'icofont-dashboard' },
        { href: '/admin/noai/timeline', label: 'Timeline', icon: 'icofont-clock-time' },
        { href: '/admin/noai/archives', label: 'Archives', icon: 'icofont-archive' },
        { href: '/admin/noai/participants', label: 'Participants', icon: 'icofont-people' },
        { href: '/admin/noai/faqs', label: 'FAQs', icon: 'icofont-question-circle' },
      ]
    },

    // Applications
    {
      id: 'applications',
      label: 'Applications',
      icon: 'icofont-file-document',
      items: [
        { href: '/admin/templates', label: 'Form Templates', icon: 'icofont-form' },
        { href: '/admin/applications', label: 'View Applications', icon: 'icofont-file-document' },
        { href: '/admin/responses', label: 'Application Responses', icon: 'icofont-listing-box' },
        { href: '/admin/papers', label: 'Paper Submissions', icon: 'icofont-book' },
        { href: '/admin/reviewers', label: 'Reviewers', icon: 'icofont-people' },
        { href: '/admin/paper-assignments', label: 'Paper Assignments', icon: 'icofont-tasks' },
      ]
    },

    // Tickets & Check-in
    {
      id: 'tickets',
      label: 'Tickets & Check-in',
      icon: 'icofont-ticket',
      items: [
        { href: '/admin/tickets', label: 'All Tickets', icon: 'icofont-ticket' },
        { href: '/admin/checkin', label: 'Event Check-in', icon: 'icofont-qr-code' },
        { href: '/admin/checkin/export', label: 'Check-in Reports', icon: 'icofont-listing-number' },
        { href: '/admin/tickets/regenerate-qr', label: 'Regenerate QR', icon: 'icofont-refresh' },
        { href: '/admin/survey-deadlines', label: 'Survey Deadlines', icon: 'icofont-alarm' },
      ]
    },

    // Email & Communications
    {
      id: 'email',
      label: 'Email',
      icon: 'icofont-envelope',
      items: [
        { href: '/admin/email-templates', label: 'Email Templates', icon: 'icofont-envelope-open' },
        { href: '/admin/emails/compose', label: 'Send Email', icon: 'icofont-paper-plane' },
        { href: '/admin/emails/logs', label: 'Email Logs', icon: 'icofont-history' },
        { href: '/admin/email-recipients', label: 'Email Recipients', icon: 'icofont-ui-user-group' },
        { href: '/admin/subscribers', label: 'Subscribers', icon: 'icofont-users' },
        { href: '/admin/contact-submissions', label: 'Contact Messages', icon: 'icofont-envelope' },
      ]
    },

    // Users
    {
      id: 'users',
      label: 'Users',
      icon: 'icofont-users-social',
      items: [
        { href: '/admin/users', label: 'All Users', icon: 'icofont-users-social' },
        { href: '/admin/admins', label: 'Admins', icon: 'icofont-ui-user-group' },
        { href: '/admin/tags', label: 'Tags', icon: 'icofont-tags' },
        { href: '/admin/expertise', label: 'Expertise', icon: 'icofont-brain' },
      ]
    },

    // Analytics
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'icofont-chart-line',
      items: [
        { href: '/admin/analytics', label: 'Analytics', icon: 'icofont-chart-line' },
        { href: '/admin/stats', label: 'Statistics', icon: 'icofont-chart-bar-graph' },
      ]
    },

    // System
    {
      id: 'system',
      label: 'System',
      icon: 'icofont-settings',
      items: [
        { href: '/admin/profile', label: 'My Profile', icon: 'icofont-user' },
        { href: '/admin/settings', label: 'Site Settings', icon: 'icofont-settings' },
      ]
    },
  ], [])

  // State for managing which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['dashboard'])

  // Auto-expand group containing current page
  useEffect(() => {
    const currentGroup = navGroups.find(group =>
      group.items?.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    )
    if (currentGroup && !expandedGroups.includes(currentGroup.id)) {
      setExpandedGroups(prev => [...prev, currentGroup.id])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const isGroupActive = (group: any) => {
    if (group.standalone && pathname === group.href) return true
    if (group.items) {
      return group.items.some((item: any) =>
        pathname === item.href || pathname.startsWith(item.href + '/')
      )
    }
    return false
  }

  return (
    <ProtectedRoute>
      <div className="admin-wrapper">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="mobile-backdrop"
            onClick={closeMobileMenu}
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'show' : ''}`}>
          <div className="p-4 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="text-white mb-0">IndabaX Kenya</h4>
              <small className="text-white-50">Admin Panel</small>
            </div>
            {/* Close button for mobile */}
            <button
              className="btn btn-link text-white d-md-none p-0"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <i className="icofont-close" style={{ fontSize: '1.5rem' }}></i>
            </button>
          </div>

          <nav className="nav flex-column nav-grouped">
            {navGroups.map((group) => {
              // Standalone items (like Dashboard)
              if (group.standalone) {
                const isActive = pathname === group.href || pathname.startsWith(group.href + '/')
                return (
                  <Link
                    key={group.id}
                    href={group.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <i className={`${group.icon} me-2`}></i>
                    {group.label}
                  </Link>
                )
              }

              // Grouped items with collapsible sections
              const isExpanded = expandedGroups.includes(group.id)
              const hasActive = isGroupActive(group)

              return (
                <div key={group.id} className="nav-group">
                  <button
                    className={`nav-group-toggle ${hasActive ? 'has-active' : ''}`}
                    onClick={() => toggleGroup(group.id)}
                    type="button"
                  >
                    <span className="nav-group-label">
                      <i className={`${group.icon} me-2`}></i>
                      {group.label}
                    </span>
                    <i className={`icofont-simple-${isExpanded ? 'up' : 'down'} nav-group-arrow`}></i>
                  </button>

                  <div className={`nav-group-items ${isExpanded ? 'expanded' : ''}`}>
                    {group.items?.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`nav-link nav-link-sub ${isActive ? 'active' : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <i className={`${item.icon} me-2`}></i>
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 mt-auto border-top border-secondary">
            <div className="text-white-50 small mb-2">
              <i className="icofont-user me-2"></i>
              <strong>{user?.email}</strong>
            </div>
            <div className="mb-2">
              <span className="badge bg-primary">{user?.role}</span>
            </div>
            <Link
              href="/"
              className="btn btn-outline-info btn-sm w-100 mb-2"
              target="_blank"
            >
              <i className="icofont-external-link me-2"></i>
              View Website
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm w-100"
            >
              <i className="icofont-logout me-2"></i>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-content">
          {/* Header */}
          <header className="admin-header">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                {/* Mobile Menu Toggle */}
                <button
                  className="btn btn-link text-dark d-md-none p-0 me-3"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu"
                >
                  <i className="icofont-navigation-menu" style={{ fontSize: '1.5rem' }}></i>
                </button>
                <h5 className="mb-0">
                  {(() => {
                    // Check standalone items first
                    const standalone = navGroups.find(g => g.standalone && g.href === pathname)
                    if (standalone) return standalone.label

                    // Check nested items in groups
                    for (const group of navGroups) {
                      if (group.items) {
                        const item = group.items.find(i => i.href === pathname)
                        if (item) return item.label
                      }
                    }
                    return 'Admin'
                  })()}
                </h5>
              </div>
              <div className="text-muted small d-none d-md-block">
                Welcome, {user?.email}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="admin-main">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
