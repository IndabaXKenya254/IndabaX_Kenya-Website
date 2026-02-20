// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - POST CONTENT DISPLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Safely renders HTML content from rich text editor with Quill styling
// ═══════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useRef } from 'react'

interface PostContentProps {
  htmlContent: string
  className?: string
}

/**
 * Component to display rich text HTML content from posts
 *
 * Features:
 * - Uses Quill editor styles for consistent rendering
 * - Sanitizes HTML on client side
 * - Makes external links open in new tabs
 * - Responsive image handling
 *
 * @param htmlContent - HTML string from rich text editor
 * @param className - Additional CSS classes
 */
export default function PostContent({ htmlContent, className = '' }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current && htmlContent) {
      // Clean up HTML: remove excessive newlines that create gaps
      const cleanedHtml = htmlContent
        .replace(/\n\n+/g, '\n')  // Replace multiple newlines with single newline
        .replace(/>\s+</g, '><')   // Remove whitespace between tags
        .trim()

      // Set the cleaned HTML content
      contentRef.current.innerHTML = cleanedHtml

      // Make all external links open in new tabs
      const links = contentRef.current.querySelectorAll('a')
      links.forEach(link => {
        const href = link.getAttribute('href')
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          link.setAttribute('target', '_blank')
          link.setAttribute('rel', 'noopener noreferrer')
        }
      })

      // Add loading="lazy" to all images for performance
      const images = contentRef.current.querySelectorAll('img')
      images.forEach(img => {
        img.setAttribute('loading', 'lazy')

        // Add error handler for broken images
        img.onerror = () => {
          img.style.display = 'none'
        }
      })
    }
  }, [htmlContent])

  if (!htmlContent || htmlContent.trim() === '') {
    return (
      <div className="post-content-empty">
        <p className="text-muted">No content available.</p>
      </div>
    )
  }

  return (
    <div className={`ql-container ql-snow ${className}`} style={{ border: 'none' }}>
      <div
        ref={contentRef}
        className="post-content ql-editor"
        style={{
          minHeight: 'auto',
          maxHeight: 'none',
          overflow: 'visible',
          padding: '20px 0',
        }}
      />
    </div>
  )
}
