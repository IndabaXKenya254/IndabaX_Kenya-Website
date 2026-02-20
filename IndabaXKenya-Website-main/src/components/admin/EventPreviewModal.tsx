// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT PREVIEW MODAL
// ═══════════════════════════════════════════════════════════════════════
// Preview event details before publishing
// ═══════════════════════════════════════════════════════════════════════

'use client'

import { useEffect } from 'react'
import PostContent from '@/components/Common/PostContent'

interface EventPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  eventData: {
    title: string
    description: string
    start_date: string
    end_date?: string
    location: string
    event_type: string
    status: string
    banner_url?: string
    registration_url?: string
    max_attendees?: string
    slug?: string
  }
}

export default function EventPreviewModal({
  isOpen,
  onClose,
  eventData
}: EventPreviewModalProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1050 }}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" role="document" style={{ maxWidth: '95%', margin: '0.5rem auto' }}>
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="icofont-eye me-2"></i>
                Event Preview
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <div className="event-preview-container">
                {/* Preview Notice */}
                <div className="preview-notice alert alert-info mb-4">
                  <i className="icofont-eye"></i>
                  <strong>Preview Mode:</strong> Approximate preview — the live page may have minor styling differences.
                  {eventData.slug && (
                    <a href={`/events/${eventData.slug}`} target="_blank" rel="noopener noreferrer" className="ms-2">
                      View live page <i className="icofont-external-link"></i>
                    </a>
                  )}
                </div>

                {/* Event Preview */}
                <article className="event-preview-article">
                  {/* Banner Image */}
                  {eventData.banner_url && (
                    <div className="preview-banner mb-4">
                      <img
                        src={eventData.banner_url}
                        alt={eventData.title}
                        style={{
                          width: '100%',
                          maxHeight: '400px',
                          objectFit: 'cover',
                          borderRadius: '12px'
                        }}
                      />
                    </div>
                  )}

                  {/* Event Type & Status Badges */}
                  <div className="mb-3 d-flex gap-2">
                    <span className="badge bg-primary text-uppercase">
                      {eventData.event_type.replace('_', ' ')}
                    </span>
                    <span className={`badge text-uppercase ${
                      eventData.status === 'upcoming' ? 'bg-success' :
                      eventData.status === 'ongoing' ? 'bg-warning' :
                      eventData.status === 'past' ? 'bg-secondary' :
                      'bg-danger'
                    }`}>
                      {eventData.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="preview-title mb-3">{eventData.title || 'Untitled Event'}</h1>

                  {/* Event Details Grid */}
                  <div className="event-details-grid mb-4">
                    {/* Date */}
                    <div className="detail-item">
                      <div className="detail-icon">
                        <i className="icofont-calendar"></i>
                      </div>
                      <div className="detail-content">
                        <h6>Date</h6>
                        <p>
                          {formatDate(eventData.start_date)}
                          {eventData.end_date && eventData.end_date !== eventData.start_date && (
                            <> - {formatDate(eventData.end_date)}</>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="detail-item">
                      <div className="detail-icon">
                        <i className="icofont-location-pin"></i>
                      </div>
                      <div className="detail-content">
                        <h6>Location</h6>
                        <p>{eventData.location || 'TBA'}</p>
                      </div>
                    </div>

                    {/* Capacity */}
                    {eventData.max_attendees && (
                      <div className="detail-item">
                        <div className="detail-icon">
                          <i className="icofont-users"></i>
                        </div>
                        <div className="detail-content">
                          <h6>Capacity</h6>
                          <p>{eventData.max_attendees} attendees</p>
                        </div>
                      </div>
                    )}

                    {/* Registration */}
                    {eventData.registration_url && (
                      <div className="detail-item">
                        <div className="detail-icon">
                          <i className="icofont-ticket"></i>
                        </div>
                        <div className="detail-content">
                          <h6>Registration</h6>
                          <a href={eventData.registration_url} target="_blank" rel="noopener noreferrer">
                            Register Now →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Issue #46 FIX: Wrap in post-body for consistent styling with live page */}
                  <div className="preview-content post-body mt-4">
                    <h4 className="mb-3">About This Event</h4>
                    {eventData.description ? (
                      <PostContent htmlContent={eventData.description} />
                    ) : (
                      <p className="text-muted font-italic">No description yet. Add event details to see them here.</p>
                    )}
                  </div>
                </article>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                <i className="icofont-arrow-left me-2"></i>
                Back to Editing
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .event-preview-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .preview-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #cfe2ff;
          border: 1px solid #9ec5fe;
          padding: 12px 16px;
          border-radius: 8px;
        }

        .preview-notice i {
          font-size: 20px;
        }

        .event-preview-article {
          background: #ffffff;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .preview-title {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          color: #212529;
        }

        .event-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          padding: 24px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .detail-item {
          display: flex;
          gap: 12px;
        }

        .detail-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e30045;
          color: white;
          border-radius: 8px;
          font-size: 20px;
        }

        .detail-content h6 {
          font-weight: 600;
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-content p,
        .detail-content a {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #212529;
        }

        .detail-content a {
          color: #0d6efd;
          text-decoration: none;
        }

        .detail-content a:hover {
          text-decoration: underline;
        }

        .preview-content {
          font-size: 18px;
          line-height: 1.8;
          color: #333;
        }

        .preview-content h4 {
          font-weight: 600;
          color: #212529;
          border-bottom: 2px solid #e30045;
          padding-bottom: 12px;
        }

        @media (max-width: 768px) {
          .event-preview-article {
            padding: 20px;
          }

          .preview-title {
            font-size: 1.75rem;
          }

          .event-details-grid {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 16px;
          }

          .preview-content {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  )
}
