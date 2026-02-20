// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ERROR PAGE (500)
// ═══════════════════════════════════════════════════════════════════════

"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-area">
      <div className="d-table">
        <div className="d-table-cell">
          <div className="error-content">
            <h1>
              5<span>0</span>
              <b>0</b>
            </h1>
            <h2>Server Error</h2>
            <p>Something went wrong on our end. We&apos;re working to fix it!</p>
            {error.message && (
              <p className="error-message">Error: {error.message}</p>
            )}
            <div className="error-actions">
              <button onClick={reset} className="btn btn-secondary">
                Try Again
              </button>
              <Link href="/" className="btn btn-primary">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
