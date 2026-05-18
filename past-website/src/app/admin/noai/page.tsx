// ═══════════════════════════════════════════════════════════════════════
// NOAI ADMIN DASHBOARD - Content Management
// ═══════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

interface Stats {
  sections: number
  participants: number
  faqs: number
}

export default function NOAIAdminPage() {
  const [stats, setStats] = useState<Stats>({ sections: 0, participants: 0, faqs: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load stats from API
    Promise.all([
      fetch('/api/noai/sections').then(r => r.json()),
      fetch('/api/noai/participants').then(r => r.json()),
      fetch('/api/noai/faqs').then(r => r.json()),
    ])
      .then(([sections, participants, faqs]) => {
        setStats({
          sections: sections.count || 0,
          participants: participants.count || 0,
          faqs: faqs.count || 0,
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading stats:', err)
        setLoading(false)
      })
  }, [])

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">NOAI Content Management</h1>
          <p className="text-muted">Manage the National Olympiad for AI single-page content</p>
        </div>
        <Link href="/noai" target="_blank" className="btn btn-outline-primary">
          <i className="icofont-external-link me-2"></i>
          View Live Page
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Page Sections</p>
                  <h3 className="mb-0">{loading ? '...' : stats.sections}</h3>
                </div>
                <div className="icon-box bg-primary bg-opacity-10 rounded p-3">
                  <i className="icofont-page text-primary" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Participants</p>
                  <h3 className="mb-0">{loading ? '...' : stats.participants}</h3>
                </div>
                <div className="icon-box bg-success bg-opacity-10 rounded p-3">
                  <i className="icofont-users-alt-4 text-success" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">FAQs</p>
                  <h3 className="mb-0">{loading ? '...' : stats.faqs}</h3>
                </div>
                <div className="icon-box bg-info bg-opacity-10 rounded p-3">
                  <i className="icofont-question-circle text-info" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Gallery</p>
                  <h3 className="mb-0"><Link href="/admin/gallery" className="text-decoration-none">Manage</Link></h3>
                </div>
                <div className="icon-box bg-warning bg-opacity-10 rounded p-3">
                  <i className="icofont-image text-warning" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Management Cards */}
      <div className="row g-4">
        {/* Page Sections */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="icofont-page me-2"></i>
                Page Sections
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Manage the main content sections: About NOAI, About IOAI, and Kenya&apos;s Journey.
              </p>
              <ul className="list-unstyled mb-3">
                <li><i className="icofont-check-circled text-success me-2"></i> Edit section titles</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Update content text</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Publish/unpublish sections</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Reorder sections</li>
              </ul>
              <div className="d-flex gap-2 mb-2">
                <Link href="/admin/noai/subsections/about_noai" className="btn btn-primary flex-fill">
                  <i className="icofont-pencil me-2"></i>
                  About NOAI
                </Link>
                <Link href="/admin/noai/subsections/kenya_journey" className="btn btn-success flex-fill text-white">
                  <i className="icofont-pencil me-2"></i>
                  Kenya&apos;s Journey
                </Link>
              </div>
              <Link href="/admin/noai/kenya-journey" className="btn btn-outline-primary w-100 mb-2">
                <i className="icofont-flag-alt-2 me-2"></i>
                Edit Kenya&apos;s Journey Event Card
              </Link>
              <Link href="/admin/noai/timeline" className="btn btn-outline-success w-100">
                <i className="icofont-chart-flow me-2"></i>
                Edit Timeline Milestones
              </Link>
              <p className="text-muted small mt-3 mb-0">
                <strong>Current sections:</strong> {stats.sections} sections active
              </p>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="icofont-users-alt-4 me-2"></i>
                IOAI Participants
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Manage team members who participated in IOAI, organized by year.
              </p>
              <ul className="list-unstyled mb-3">
                <li><i className="icofont-check-circled text-success me-2"></i> Add/edit participants</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Upload photos</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Assign roles & achievements</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Group by year</li>
              </ul>
              <Link href="/admin/noai/participants" className="btn btn-success w-100 text-white">
                <i className="icofont-pencil me-2"></i>
                Manage Participants
              </Link>
              <p className="text-muted small mt-3 mb-0">
                <strong>Current participants:</strong> {stats.participants} team members
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="icofont-question-circle me-2"></i>
                FAQs
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Manage frequently asked questions displayed on the NOAI page.
              </p>
              <ul className="list-unstyled mb-3">
                <li><i className="icofont-check-circled text-success me-2"></i> Add/edit/delete FAQs</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Categorize questions</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Reorder FAQs</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Publish/unpublish</li>
              </ul>
              <Link href="/admin/noai/faqs" className="btn btn-info w-100 text-white">
                <i className="icofont-pencil me-2"></i>
                Manage FAQs
              </Link>
              <p className="text-muted small mt-3 mb-0">
                <strong>Current FAQs:</strong> {stats.faqs} questions
              </p>
            </div>
          </div>
        </div>

        {/* Archives */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0">
                <i className="icofont-archive me-2"></i>
                Archives
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Manage archive pages for IOAI competitions and events. Archives are linked from Timeline Milestones.
              </p>
              <ul className="list-unstyled mb-3">
                <li><i className="icofont-check-circled text-success me-2"></i> Create archive pages for each IOAI</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Add participants &amp; photos</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Link from Timeline Milestones</li>
                <li><i className="icofont-check-circled text-success me-2"></i> Custom URL slugs</li>
              </ul>
              <Link href="/admin/noai/archives" className="btn btn-warning w-100">
                <i className="icofont-pencil me-2"></i>
                Manage Archives
              </Link>
              <p className="text-muted small mt-3 mb-0">
                <strong>Tip:</strong> Create an archive first, then link it from a Timeline Milestone
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="card mt-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Quick Actions</h5>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2 flex-wrap">
            <Link href="/noai" target="_blank" className="btn btn-success">
              <i className="icofont-eye-alt me-2"></i>
              Preview NOAI Page
            </Link>
            <Link href="/noai#gallery" target="_blank" className="btn btn-info text-white">
              <i className="icofont-image me-2"></i>
              View Gallery
            </Link>
            <Link href="/admin/gallery" className="btn btn-warning">
              <i className="icofont-upload-alt me-2"></i>
              Manage Gallery Photos
            </Link>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
