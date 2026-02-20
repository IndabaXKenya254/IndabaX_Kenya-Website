'use client'

// Issue #2 FIX: Error boundary for events page
// Catches runtime errors and displays a user-friendly fallback

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="events-grid-area ptb-120">
      <div className="container">
        <div className="text-center py-5">
          <i className="icofont-warning-alt text-warning" style={{ fontSize: '3rem' }}></i>
          <h3 className="mt-3">Something went wrong</h3>
          <p className="text-muted">
            We had trouble loading the events page. Please try again.
          </p>
          <button className="btn btn-primary me-2" onClick={reset}>
            Try Again
          </button>
          <a href="/" className="btn btn-outline-secondary">
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
