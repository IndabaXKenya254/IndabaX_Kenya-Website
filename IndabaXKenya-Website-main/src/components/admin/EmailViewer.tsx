// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PROFESSIONAL EMAIL VIEWER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Displays email content with professional, consistent styling

import React from 'react'
import styles from '@/styles/EmailViewer.module.css'

interface EmailViewerProps {
  htmlContent: string
  className?: string
}

export const EmailViewer: React.FC<EmailViewerProps> = ({ htmlContent, className = '' }) => {
  return (
    <div className={`${styles.emailViewerWrapper} ${className}`}>
      <div
        className={styles.emailViewer}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}
