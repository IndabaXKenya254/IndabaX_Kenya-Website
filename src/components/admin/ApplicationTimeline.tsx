// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPLICATION TIMELINE COMPONENT (PHASE 5 - DAY 7)
// ═══════════════════════════════════════════════════════════════════════
// Displays activity log for an application

import React from 'react'

interface TimelineEvent {
  id: string
  type: 'submitted' | 'reviewed' | 'status_change' | 'note_added' | 'lock_acquired' | 'lock_released' | 'email_sent'
  timestamp: string
  user_email?: string
  details?: string
  status?: string
}

interface ApplicationTimelineProps {
  events: TimelineEvent[]
  loading?: boolean
}

/**
 * ApplicationTimeline Component
 *
 * Shows chronological activity log for an application
 */
export function ApplicationTimeline({ events, loading }: ApplicationTimelineProps) {
  // ═══════════════════════════════════════════════════════════════════════
  // Format timestamp
  // ═══════════════════════════════════════════════════════════════════════

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now'
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }

    // Fallback to full date
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Get event icon and color
  // ═══════════════════════════════════════════════════════════════════════

  const getEventIcon = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'submitted':
        return 'icofont-paper-plane'
      case 'reviewed':
        return 'icofont-eye'
      case 'status_change':
        return 'icofont-refresh'
      case 'note_added':
        return 'icofont-pencil-alt-2'
      case 'lock_acquired':
        return 'icofont-lock'
      case 'lock_released':
        return 'icofont-unlock'
      case 'email_sent':
        return 'icofont-envelope'
      default:
        return 'icofont-info-circle'
    }
  }

  const getEventColor = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'submitted':
        return 'primary'
      case 'reviewed':
        return 'info'
      case 'status_change':
        return 'warning'
      case 'note_added':
        return 'secondary'
      case 'lock_acquired':
        return 'success'
      case 'lock_released':
        return 'secondary'
      case 'email_sent':
        return 'primary'
      default:
        return 'secondary'
    }
  }

  const getEventTitle = (event: TimelineEvent): string => {
    switch (event.type) {
      case 'submitted':
        return 'Application Submitted'
      case 'reviewed':
        return 'Application Reviewed'
      case 'status_change':
        return `Status Changed to ${event.status || 'Unknown'}`
      case 'note_added':
        return 'Admin Notes Updated'
      case 'lock_acquired':
        return 'Review Lock Acquired'
      case 'lock_released':
        return 'Review Lock Released'
      case 'email_sent':
        return 'Email Notification Sent'
      default:
        return 'Activity'
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Loading state
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading timeline...</span>
        </div>
        <p className="text-muted small mt-2">Loading activity...</p>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Empty state
  // ═══════════════════════════════════════════════════════════════════════

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="icofont-clock-time" style={{ fontSize: '2rem', color: '#ccc' }}></i>
        <p className="text-muted small mt-2">No activity recorded yet</p>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Timeline rendering
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="timeline">
      {events.map((event, index) => (
        <div key={event.id || index} className="timeline-item">
          <div className="timeline-marker">
            <div className={`timeline-icon bg-${getEventColor(event.type)}`}>
              <i className={getEventIcon(event.type)}></i>
            </div>
            {index < events.length - 1 && <div className="timeline-line"></div>}
          </div>
          <div className="timeline-content">
            <div className="timeline-header">
              <strong>{getEventTitle(event)}</strong>
              <span className="text-muted small ms-2">{formatTimestamp(event.timestamp)}</span>
            </div>
            {event.user_email && (
              <div className="text-muted small">
                by {event.user_email}
              </div>
            )}
            {event.details && (
              <div className="timeline-details mt-1 small">
                {event.details}
              </div>
            )}
          </div>
        </div>
      ))}

      <style jsx>{`
        .timeline {
          position: relative;
          padding: 0;
        }

        .timeline-item {
          display: flex;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .timeline-marker {
          position: relative;
          flex-shrink: 0;
          width: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .timeline-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          z-index: 1;
        }

        .timeline-line {
          width: 2px;
          flex-grow: 1;
          background: #e0e0e0;
          margin-top: 4px;
          min-height: 20px;
        }

        .timeline-content {
          flex-grow: 1;
          padding-left: 1rem;
          padding-top: 0.25rem;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .timeline-details {
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 4px;
          border-left: 3px solid #dee2e6;
        }
      `}</style>
    </div>
  )
}

/**
 * Compact timeline variant for sidebar
 */
export function CompactTimeline({ events, loading }: ApplicationTimelineProps) {
  if (loading) {
    return <div className="text-center py-2"><div className="spinner-border spinner-border-sm"></div></div>
  }

  if (!events || events.length === 0) {
    return <p className="text-muted small">No activity</p>
  }

  return (
    <div className="compact-timeline">
      {events.slice(0, 5).map((event, index) => (
        <div key={event.id || index} className="compact-timeline-item mb-2">
          <i className={`${getEventIcon(event.type)} me-2`}></i>
          <span className="small">{getEventTitle(event)}</span>
          <div className="text-muted small ms-4">{formatTimestamp(event.timestamp)}</div>
        </div>
      ))}
      {events.length > 5 && (
        <div className="text-muted small">
          + {events.length - 5} more activities
        </div>
      )}
    </div>
  )

  function getEventIcon(type: TimelineEvent['type']): string {
    switch (type) {
      case 'submitted': return 'icofont-paper-plane'
      case 'reviewed': return 'icofont-eye'
      case 'status_change': return 'icofont-refresh'
      case 'note_added': return 'icofont-pencil-alt-2'
      case 'lock_acquired': return 'icofont-lock'
      case 'lock_released': return 'icofont-unlock'
      case 'email_sent': return 'icofont-envelope'
      default: return 'icofont-info-circle'
    }
  }

  function getEventTitle(event: TimelineEvent): string {
    switch (event.type) {
      case 'submitted': return 'Submitted'
      case 'reviewed': return 'Reviewed'
      case 'status_change': return `Status: ${event.status}`
      case 'note_added': return 'Notes updated'
      case 'lock_acquired': return 'Lock acquired'
      case 'lock_released': return 'Lock released'
      case 'email_sent': return 'Email sent'
      default: return 'Activity'
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`
    }
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`
    }
    return date.toLocaleDateString()
  }
}
