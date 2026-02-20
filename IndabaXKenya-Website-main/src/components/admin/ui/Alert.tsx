'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ALERT COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Bootstrap alert wrapper
// Created: Admin UI Phase 2 - Content Management

interface AlertProps {
  type: 'success' | 'danger' | 'warning' | 'info'
  message: string
  onClose?: () => void
}

export function Alert({ type, message, onClose }: AlertProps) {
  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
      {message}
      {onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        />
      )}
    </div>
  )
}
