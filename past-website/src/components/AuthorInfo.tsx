'use client'

// ═══════════════════════════════════════════════════════════════════════
// AUTHOR INFO COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Displays author name and avatar (handles both uploaded images and initials)

import Image from 'next/image'

interface AuthorInfoProps {
  authorName?: string | null
  authorImage?: string | null
  publishedAt?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDate?: boolean
}

export default function AuthorInfo({
  authorName,
  authorImage,
  publishedAt,
  className = '',
  size = 'md',
  showDate = true,
}: AuthorInfoProps) {
  // Don't render if no author name
  if (!authorName) return null

  // Avatar sizes
  const avatarSizes = {
    sm: 32,
    md: 40,
    lg: 56,
  }

  const avatarSize = avatarSizes[size]

  // Format date
  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return date
    }
  }

  return (
    <div className={`d-flex align-items-center ${className}`}>
      {/* Author Avatar */}
      <div className="flex-shrink-0 me-3">
        {authorImage ? (
          authorImage.startsWith('data:image/svg') ? (
            // SVG initials avatar
            <div
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              dangerouslySetInnerHTML={{
                __html: decodeURIComponent(authorImage.split(',')[1]),
              }}
            />
          ) : (
            // Uploaded image
            <Image
              src={authorImage}
              alt={authorName}
              width={avatarSize}
              height={avatarSize}
              className="rounded-circle"
              style={{ objectFit: 'cover' }}
            />
          )
        ) : (
          // Fallback to first letter
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
            style={{
              width: avatarSize,
              height: avatarSize,
              fontSize: size === 'sm' ? '14px' : size === 'md' ? '16px' : '20px',
            }}
          >
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Author Name and Date */}
      <div>
        <div
          className={`fw-semibold ${
            size === 'sm' ? 'small' : size === 'lg' ? 'h6 mb-0' : ''
          }`}
        >
          {authorName}
        </div>
        {showDate && publishedAt && (
          <div className="text-muted small">{formatDate(publishedAt)}</div>
        )}
      </div>
    </div>
  )
}
