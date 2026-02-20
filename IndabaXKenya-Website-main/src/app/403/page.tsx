// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - 403 UNAUTHORIZED PAGE
// ═══════════════════════════════════════════════════════════════════════

import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="error-area">
      <div className="d-table">
        <div className="d-table-cell">
          <div className="error-content">
            <h1>
              4<span>0</span>
              <b>3</b>
            </h1>
            <h2>Access Denied</h2>
            <p>
              You don&apos;t have permission to access this page. Please contact
              the administrator if you believe this is an error.
            </p>
            <div className="error-actions">
              <Link href="/" className="btn btn-primary">
                Return Home
              </Link>
              <Link href="/contact-us" className="btn btn-secondary">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
