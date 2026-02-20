// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - POST PREVIEW MODAL
// ═══════════════════════════════════════════════════════════════════════
// Preview post content before publishing
// ═══════════════════════════════════════════════════════════════════════

'use client'

import { useEffect } from 'react'
import PostContent from '@/components/Common/PostContent'

interface PostPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  postData: {
    title: string
    content: string
    category: string
    featured_image_url?: string
  }
}

export default function PostPreviewModal({
  isOpen,
  onClose,
  postData
}: PostPreviewModalProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

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
                Post Preview
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
      <div className="post-preview-container">
        {/* Preview Header */}
        <div className="preview-notice alert alert-info mb-4">
          <i className="icofont-eye"></i>
          <strong>Preview Mode:</strong> Approximate preview — the live page may have minor styling differences.
        </div>

        {/* Post Preview */}
        <article className="post-preview-article">
          {/* Featured Image */}
          {postData.featured_image_url && (
            <div className="preview-featured-image mb-4">
              <img
                src={postData.featured_image_url}
                alt={postData.title}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />
            </div>
          )}

          {/* Category Badge */}
          <div className="mb-3">
            <span className="badge bg-primary text-uppercase">
              {postData.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="preview-title mb-3">{postData.title || 'Untitled Post'}</h1>

          {/* Meta Info */}
          <div className="preview-meta mb-4 text-muted">
            <span>
              <i className="icofont-calendar"></i> {currentDate}
            </span>
            <span className="mx-2">•</span>
            <span>
              <i className="icofont-user"></i> Admin
            </span>
          </div>

          {/* Issue #46 FIX: Wrap content in post-body class for consistent styling with live page */}
          <div className="preview-content post-body">
            {postData.content ? (
              <PostContent htmlContent={postData.content} />
            ) : (
              <p className="text-muted font-italic">No content yet. Start writing to see it here.</p>
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
        .post-preview-container {
          max-width: 800px;
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

        .post-preview-article {
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

        .preview-meta {
          font-size: 14px;
          display: flex;
          align-items: center;
        }

        .preview-meta i {
          margin-right: 4px;
        }

        .preview-content {
          font-size: 18px;
          line-height: 1.8;
          color: #333;
        }

        @media (max-width: 768px) {
          .post-preview-article {
            padding: 20px;
          }

          .preview-title {
            font-size: 1.75rem;
          }

          .preview-content {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  )
}
