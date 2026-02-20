'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - UNIFIED DASHBOARD LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Unified layout with role-based navigation for applicants, reviewers, and admins
// Phase 2: Role-Based System with Grouped Navigation

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import Link from 'next/link'

interface NavItem {
  href: string
  label: string
  icon: string
  roles: ('applicant' | 'speaker' | 'reviewer' | 'admin')[]
  group?: string // Optional group for admin navigation
}

interface NavGroup {
  id: string
  label: string
  icon: string
  items: NavItem[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles?: ('applicant' | 'speaker' | 'reviewer' | 'admin')[]
  /** Allow access even if mustChangePassword is true (for profile page) */
  allowPasswordChange?: boolean
  /** Allow access even if email is not verified (for profile page) */
  allowUnverified?: boolean
}

// Applicant/Speaker navigation (ungrouped)
const applicantNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'icofont-dashboard-web', roles: ['applicant', 'speaker'] },
  { href: '/dashboard/applications', label: 'My Applications', icon: 'icofont-file-document', roles: ['applicant', 'speaker'] },
  { href: '/dashboard/submissions', label: 'My Submissions', icon: 'icofont-paper', roles: ['applicant', 'speaker'] },
  { href: '/dashboard/tickets', label: 'My Tickets', icon: 'icofont-ticket', roles: ['applicant', 'speaker'] },
  { href: '/dashboard/profile', label: 'My Profile', icon: 'icofont-user-alt-4', roles: ['applicant', 'speaker'] },
]

// Reviewer navigation (ungrouped)
const reviewerNavItems: NavItem[] = [
  { href: '/reviewer/dashboard', label: 'Dashboard', icon: 'icofont-dashboard-web', roles: ['reviewer'] },
  { href: '/reviewer/applications', label: 'Review Applications', icon: 'icofont-file-document', roles: ['reviewer'] },
  { href: '/reviewer/papers', label: 'Review Papers', icon: 'icofont-paper', roles: ['reviewer'] },
  { href: '/reviewer/profile', label: 'My Profile', icon: 'icofont-user-alt-4', roles: ['reviewer'] },
]

// Admin navigation - grouped for better organization
const adminNavGroups: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'icofont-dashboard-web',
    items: [
      { href: '/admin/dashboard', label: 'Overview', icon: 'icofont-dashboard-web', roles: ['admin'] },
      { href: '/admin/stats', label: 'Statistics', icon: 'icofont-chart-bar-graph', roles: ['admin'] },
      { href: '/admin/analytics', label: 'Analytics', icon: 'icofont-chart-line-alt', roles: ['admin'] },
    ]
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'icofont-paper',
    items: [
      { href: '/admin/posts', label: 'Posts', icon: 'icofont-paper', roles: ['admin'] },
      { href: '/admin/events', label: 'Events', icon: 'icofont-calendar', roles: ['admin'] },
      { href: '/admin/speakers', label: 'Speakers', icon: 'icofont-user-alt-4', roles: ['admin'] },
      { href: '/admin/team', label: 'Team', icon: 'icofont-users-alt-5', roles: ['admin'] },
      { href: '/admin/venues', label: 'Venues', icon: 'icofont-building-alt', roles: ['admin'] },
      { href: '/admin/schedule', label: 'Schedule', icon: 'icofont-clock-time', roles: ['admin'] },
      { href: '/admin/sponsors', label: 'Sponsors', icon: 'icofont-company', roles: ['admin'] },
      { href: '/admin/pricing', label: 'Pricing Tiers', icon: 'icofont-price', roles: ['admin'] },
      { href: '/admin/faqs', label: 'FAQs', icon: 'icofont-question-circle', roles: ['admin'] },
      { href: '/admin/gallery', label: 'Gallery', icon: 'icofont-image', roles: ['admin'] },
      { href: '/admin/why-attend', label: 'Why Attend', icon: 'icofont-star', roles: ['admin'] },
      { href: '/admin/cta-section', label: 'CTA Section', icon: 'icofont-megaphone', roles: ['admin'] },
      { href: '/admin/donations', label: 'Donations', icon: 'icofont-heart', roles: ['admin'] },
    ]
  },
  {
    id: 'noai',
    label: 'NOAI',
    icon: 'icofont-brain-alt',
    items: [
      { href: '/admin/noai', label: 'NOAI Dashboard', icon: 'icofont-brain-alt', roles: ['admin'] },
      { href: '/admin/noai/timeline', label: 'Timeline', icon: 'icofont-chart-flow', roles: ['admin'] },
      { href: '/admin/noai/archives', label: 'Archives', icon: 'icofont-archive', roles: ['admin'] },
      { href: '/admin/noai/participants', label: 'Participants', icon: 'icofont-users-alt-4', roles: ['admin'] },
      { href: '/admin/noai/faqs', label: 'NOAI FAQs', icon: 'icofont-question-circle', roles: ['admin'] },
    ]
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: 'icofont-file-document',
    items: [
      { href: '/admin/templates', label: 'Form Templates', icon: 'icofont-ui-copy', roles: ['admin'] },
      { href: '/admin/applications', label: 'All Applications', icon: 'icofont-file-document', roles: ['admin'] },
      { href: '/admin/applications/responses', label: 'Shortlist Tracking', icon: 'icofont-chart-line', roles: ['admin'] },
      { href: '/admin/papers', label: 'Paper Submissions', icon: 'icofont-book', roles: ['admin'] },
      { href: '/admin/reviewers', label: 'Reviewers', icon: 'icofont-people', roles: ['admin'] },
    ]
  },
  {
    id: 'tickets',
    label: 'Tickets & Check-in',
    icon: 'icofont-ticket',
    items: [
      { href: '/admin/tickets', label: 'All Tickets', icon: 'icofont-ticket', roles: ['admin'] },
      { href: '/admin/checkin', label: 'Event Check-in', icon: 'icofont-qr-code', roles: ['admin'] },
      { href: '/admin/checkin/export', label: 'Check-in Reports', icon: 'icofont-listing-number', roles: ['admin'] },
      { href: '/admin/tickets/regenerate-qr', label: 'Regenerate QR', icon: 'icofont-refresh', roles: ['admin'] },
      { href: '/admin/survey-deadlines', label: 'Survey Deadlines', icon: 'icofont-alarm', roles: ['admin'] },
    ]
  },
  {
    id: 'email',
    label: 'Email',
    icon: 'icofont-email',
    items: [
      { href: '/admin/email-templates', label: 'Templates', icon: 'icofont-email', roles: ['admin'] },
      { href: '/admin/emails/compose', label: 'Compose', icon: 'icofont-envelope-open', roles: ['admin'] },
      { href: '/admin/emails/logs', label: 'Logs', icon: 'icofont-history', roles: ['admin'] },
      { href: '/admin/email-recipients', label: 'CC/BCC Recipients', icon: 'icofont-ui-user-group', roles: ['admin'] },
    ]
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'icofont-users-alt-4',
    items: [
      { href: '/admin/users', label: 'User Management', icon: 'icofont-users-social', roles: ['admin'] },
      { href: '/admin/subscribers', label: 'Subscribers', icon: 'icofont-email', roles: ['admin'] },
      { href: '/admin/contact-submissions', label: 'Contact Messages', icon: 'icofont-envelope', roles: ['admin'] },
      { href: '/admin/admins', label: 'Admin Users', icon: 'icofont-users-alt-4', roles: ['admin'] },
      { href: '/admin/reviewers', label: 'Reviewers', icon: 'icofont-people', roles: ['admin'] },
      { href: '/admin/tags', label: 'Tags', icon: 'icofont-tags', roles: ['admin'] },
      { href: '/admin/expertise', label: 'Expertise', icon: 'icofont-brain', roles: ['admin'] },
    ]
  },
  {
    id: 'system',
    label: 'System',
    icon: 'icofont-settings',
    items: [
      { href: '/admin/profile', label: 'My Profile', icon: 'icofont-user-alt-3', roles: ['admin'] },
      { href: '/admin/settings', label: 'Settings', icon: 'icofont-settings', roles: ['admin'] },
    ]
  },
]

// Flatten admin items for finding labels
const allAdminNavItems: NavItem[] = adminNavGroups.flatMap(group => group.items)

export function DashboardLayout({ children, allowedRoles, allowPasswordChange, allowUnverified }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [hasReviewerAccess, setHasReviewerAccess] = useState(false)
  const [hasApplicantData, setHasApplicantData] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Auto-expand group containing current page
  useEffect(() => {
    if (user?.role === 'admin') {
      const currentGroup = adminNavGroups.find(group =>
        group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
      )
      if (currentGroup) {
        setExpandedGroups(prev => new Set([...Array.from(prev), currentGroup.id]))
      }
    }
  }, [pathname, user?.role])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open')
    } else {
      document.body.classList.remove('mobile-menu-open')
    }

    return () => {
      document.body.classList.remove('mobile-menu-open')
    }
  }, [mobileMenuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Issue #21 FIX: Check if user has dual roles (reviewer/applicant)
  // This determines whether to show the portal switch buttons
  useEffect(() => {
    if (user?.role === 'applicant' || user?.role === 'reviewer') {
      fetch('/api/user/reviewer-status')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // For applicants: check if they also have reviewer access
            if (data.isReviewer) {
              setHasReviewerAccess(true)
            }
            // For reviewers: check if they have applicant data (form_responses)
            if (data.hasApplicantData) {
              setHasApplicantData(true)
            }
          }
        })
        .catch(() => {}) // Silent fail
    }
  }, [user?.role])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Issue #21 FIX: Path-aware navigation - reviewers see applicant nav on /dashboard/*
  const isOnApplicantPages = pathname.startsWith('/dashboard')
  const isOnReviewerPages = pathname.startsWith('/reviewer')

  // Get navigation items for non-admin roles
  const getSimpleNavItems = () => {
    if (user?.role === 'admin') return []
    // Show applicant nav when reviewer is on applicant dashboard pages
    if (isOnApplicantPages) return applicantNavItems
    if (isOnReviewerPages) return reviewerNavItems
    if (user?.role === 'reviewer') return reviewerNavItems
    return applicantNavItems
  }

  // Get panel title based on current section
  const getPanelTitle = () => {
    if (user?.role === 'admin') return 'Admin Panel'
    if (isOnReviewerPages) return 'Reviewer Portal'
    if (isOnApplicantPages) return 'Applicant Portal'
    switch (user?.role) {
      case 'reviewer': return 'Reviewer Portal'
      case 'speaker': return 'Speaker Portal'
      default: return 'Applicant Portal'
    }
  }

  // Get current page label
  const getCurrentPageLabel = () => {
    if (user?.role === 'admin') {
      const item = allAdminNavItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))
      return item?.label || 'Dashboard'
    }
    const items = getSimpleNavItems()
    const item = items.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    return item?.label || 'Dashboard'
  }

  // Render simple navigation (for applicant/speaker/reviewer)
  const renderSimpleNav = () => {
    const items = getSimpleNavItems()
    return (
      <nav className="nav flex-column">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  // Render grouped navigation (for admin)
  const renderGroupedNav = () => {
    return (
      <nav className="nav flex-column nav-grouped">
        {adminNavGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.id)
          const hasActiveItem = group.items.some(
            item => pathname === item.href || pathname.startsWith(item.href + '/')
          )

          return (
            <div key={group.id} className="nav-group">
              <button
                className={`nav-group-toggle ${hasActiveItem ? 'has-active' : ''}`}
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isExpanded}
              >
                <span className="nav-group-label">
                  <i className={`${group.icon} me-2`}></i>
                  {group.label}
                </span>
                <i className={`icofont-simple-${isExpanded ? 'up' : 'down'} nav-group-arrow`}></i>
              </button>

              <div className={`nav-group-items ${isExpanded ? 'expanded' : ''}`}>
                {group.items.map((item) => {
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
    )
  }

  return (
    <ProtectedRoute allowedRoles={allowedRoles} allowPasswordChange={allowPasswordChange} allowUnverified={allowUnverified}>
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
              <small className="text-white-50">{getPanelTitle()}</small>
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

          {/* Issue #34 FIX: Navigation with scroll container */}
          <div className="sidebar-nav">
            {user?.role === 'admin' ? renderGroupedNav() : renderSimpleNav()}
          </div>

          {/* User Info & Logout */}
          <div className="sidebar-footer p-4 border-top border-secondary">
            <div className="text-white-50 small mb-2">
              <i className="icofont-user me-2"></i>
              <strong>{user?.email}</strong>
            </div>
            <div className="mb-2">
              <span className="badge bg-primary text-capitalize">{user?.role}</span>
            </div>
            {/* Issue #21 FIX: Portal switch for users with dual roles */}
            {/* Show "Switch to Reviewer" when on applicant pages and user has reviewer access */}
            {hasReviewerAccess && isOnApplicantPages && (
              <Link
                href="/reviewer/dashboard"
                className="btn btn-outline-warning btn-sm w-100 mb-2"
              >
                <i className="icofont-exchange me-2"></i>
                Switch to Reviewer
              </Link>
            )}
            {/* Show "Switch to Applicant" when on reviewer pages and user has applicant data */}
            {hasApplicantData && isOnReviewerPages && (
              <Link
                href="/dashboard"
                className="btn btn-outline-warning btn-sm w-100 mb-2"
              >
                <i className="icofont-exchange me-2"></i>
                Switch to Applicant
              </Link>
            )}
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
                <h5 className="mb-0">{getCurrentPageLabel()}</h5>
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
