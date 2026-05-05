'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

interface KenyaJourneyMetadata {
  milestone: {
    year: string
    text: string
    icon: string
  }
  organizers: Array<{
    name: string
    icon: string
    url?: string | null
  }>
  event: {
    badge: string
    location: string
    location_icon: string
    date: {
      day: string
      month: string
      year: string
    }
    title: string
    description: string
    achievements: Array<{
      icon: string
      text: string
    }>
    quote: string
  }
  buttons: {
    gallery: {
      text: string
      url: string
      icon: string
    }
    apply: {
      text: string
      url: string
      icon: string
    }
  }
  futureGoals: Array<{
    icon: string
    title: string
    description: string
  }>
}

export default function KenyaJourneyAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [metadata, setMetadata] = useState<KenyaJourneyMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadMetadata()
  }, [])

  const loadMetadata = async () => {
    try {
      const res = await fetch('/api/noai/sections')
      const data = await res.json()
      if (data.success) {
        const kenyaSection = data.data.find((s: any) => s.section_key === 'kenya_journey')
        if (kenyaSection && kenyaSection.content && kenyaSection.content.metadata) {
          setMetadata(kenyaSection.content.metadata)
        }
      }
    } catch (err) {
      console.error('Error loading metadata:', err)
      setError('Failed to load Kenya Journey content')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!metadata) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/noai/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: 'kenya_journey',
          content: {
            metadata
          }
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess('Kenya Journey content updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error(data.error || 'Failed to update')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!metadata) {
    return (
      <DashboardLayout>
        <div className="alert alert-warning">
          <i className="icofont-warning me-2"></i>
          Kenya Journey metadata not found. Please run the migration first.
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0">Kenya&apos;s Journey - Edit Content</h1>
            <p className="text-muted">Manage all editable content for the Kenya&apos;s Journey section</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="icofont-save me-2"></i>
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            <i className="icofont-warning me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show">
            <i className="icofont-check-circled me-2"></i>
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
          </div>
        )}

        {/* Milestone Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="icofont-flag-alt-2 me-2"></i>
              Milestone Badge
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Year</label>
                  <input
                    type="text"
                    className="form-control"
                    value={metadata.milestone.year}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      milestone: { ...metadata.milestone, year: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Display Text</label>
                  <input
                    type="text"
                    className="form-control"
                    value={metadata.milestone.text}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      milestone: { ...metadata.milestone, text: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Icon Class</label>
                  <input
                    type="text"
                    className="form-control"
                    value={metadata.milestone.icon}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      milestone: { ...metadata.milestone, icon: e.target.value }
                    })}
                    placeholder="e.g., icofont-flag-alt-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organizers Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="icofont-users-alt-4 me-2"></i>
              Organizers
            </h5>
          </div>
          <div className="card-body">
            {metadata.organizers.map((org, index) => (
              <div key={index} className="card mb-3 border">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Organizer {index + 1}</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        const newOrganizers = metadata.organizers.filter((_, i) => i !== index)
                        setMetadata({ ...metadata, organizers: newOrganizers })
                      }}
                    >
                      <i className="icofont-trash"></i> Remove
                    </button>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={org.name}
                          onChange={(e) => {
                            const newOrganizers = [...metadata.organizers]
                            newOrganizers[index].name = e.target.value
                            setMetadata({ ...metadata, organizers: newOrganizers })
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Icon Class</label>
                        <input
                          type="text"
                          className="form-control"
                          value={org.icon}
                          onChange={(e) => {
                            const newOrganizers = [...metadata.organizers]
                            newOrganizers[index].icon = e.target.value
                            setMetadata({ ...metadata, organizers: newOrganizers })
                          }}
                          placeholder="e.g., icofont-building"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Website URL (optional)</label>
                        <input
                          type="url"
                          className="form-control"
                          value={org.url || ''}
                          onChange={(e) => {
                            const newOrganizers = [...metadata.organizers]
                            newOrganizers[index].url = e.target.value || null
                            setMetadata({ ...metadata, organizers: newOrganizers })
                          }}
                          placeholder="https://example.com"
                        />
                        <small className="text-muted">Leave empty for non-clickable card</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-2"
              onClick={() => {
                const newOrganizers = [
                  ...metadata.organizers,
                  { name: 'New Organizer', icon: 'icofont-building', url: null }
                ]
                setMetadata({ ...metadata, organizers: newOrganizers })
              }}
            >
              <i className="icofont-plus"></i> Add Organizer
            </button>
          </div>
        </div>

        {/* Event Card */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="icofont-calendar me-2"></i>
              Event Highlight Card
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Event Badge</label>
                  <input
                    type="text"
                    className="form-control"
                    value={metadata.event.badge}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      event: { ...metadata.event, badge: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={metadata.event.location}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      event: { ...metadata.event, location: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Day</label>
                  <input
                    type="text"
                    className="form-control"
                    value={metadata.event.date.day}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      event: {
                        ...metadata.event,
                        date: { ...metadata.event.date, day: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Month</label>
                  <input
                    type="text"
                    className="form-control"
                    value={metadata.event.date.month}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      event: {
                        ...metadata.event,
                        date: { ...metadata.event.date, month: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Year</label>
                  <input
                    type="text"
                    className="form-control"
                    value={metadata.event.date.year}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      event: {
                        ...metadata.event,
                        date: { ...metadata.event.date, year: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Event Title</label>
              <input
                type="text"
                className="form-control"
                value={metadata.event.title}
                onChange={(e) => setMetadata({
                  ...metadata,
                  event: { ...metadata.event, title: e.target.value }
                })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Event Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={metadata.event.description}
                onChange={(e) => setMetadata({
                  ...metadata,
                  event: { ...metadata.event, description: e.target.value }
                })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Footer Quote</label>
              <textarea
                className="form-control"
                rows={2}
                value={metadata.event.quote}
                onChange={(e) => setMetadata({
                  ...metadata,
                  event: { ...metadata.event, quote: e.target.value }
                })}
              />
            </div>

            {/* Achievements */}
            <h6 className="mt-4 mb-3">Achievements</h6>
            {metadata.event.achievements.map((achievement, index) => (
              <div key={index} className="card mb-3 border">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Achievement {index + 1}</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        const newAchievements = metadata.event.achievements.filter((_, i) => i !== index)
                        setMetadata({
                          ...metadata,
                          event: { ...metadata.event, achievements: newAchievements }
                        })
                      }}
                    >
                      <i className="icofont-trash"></i> Remove
                    </button>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Icon Class</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Icon class (e.g., icofont-trophy)"
                        value={achievement.icon}
                        onChange={(e) => {
                          const newAchievements = [...metadata.event.achievements]
                          newAchievements[index].icon = e.target.value
                          setMetadata({
                            ...metadata,
                            event: { ...metadata.event, achievements: newAchievements }
                          })
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Achievement Text</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Achievement text"
                        value={achievement.text}
                        onChange={(e) => {
                          const newAchievements = [...metadata.event.achievements]
                          newAchievements[index].text = e.target.value
                          setMetadata({
                            ...metadata,
                            event: { ...metadata.event, achievements: newAchievements }
                          })
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-2"
              onClick={() => {
                const newAchievements = [
                  ...metadata.event.achievements,
                  { icon: 'icofont-star', text: 'New Achievement' }
                ]
                setMetadata({
                  ...metadata,
                  event: { ...metadata.event, achievements: newAchievements }
                })
              }}
            >
              <i className="icofont-plus"></i> Add Achievement
            </button>
          </div>
        </div>

        {/* Future Goals */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="icofont-chart-growth me-2"></i>
              Future Goals
            </h5>
          </div>
          <div className="card-body">
            {metadata.futureGoals.map((goal, index) => (
              <div key={index} className="card mb-3 border">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Icon</label>
                        <input
                          type="text"
                          className="form-control"
                          value={goal.icon}
                          onChange={(e) => {
                            const newGoals = [...metadata.futureGoals]
                            newGoals[index].icon = e.target.value
                            setMetadata({ ...metadata, futureGoals: newGoals })
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={goal.title}
                          onChange={(e) => {
                            const newGoals = [...metadata.futureGoals]
                            newGoals[index].title = e.target.value
                            setMetadata({ ...metadata, futureGoals: newGoals })
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <input
                          type="text"
                          className="form-control"
                          value={goal.description}
                          onChange={(e) => {
                            const newGoals = [...metadata.futureGoals]
                            newGoals[index].description = e.target.value
                            setMetadata({ ...metadata, futureGoals: newGoals })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="text-end mb-4">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="icofont-save me-2"></i>
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
