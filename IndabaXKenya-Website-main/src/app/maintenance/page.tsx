// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - MAINTENANCE MODE PAGE
// ═══════════════════════════════════════════════════════════════════════

import Link from "next/link";

export default function Maintenance() {
  return (
    <div className="error-area maintenance-mode">
      <div className="d-table">
        <div className="d-table-cell">
          <div className="error-content">
            <div className="maintenance-icon">
              <i className="icofont-tools-alt-2"></i>
            </div>
            <h2>Site Under Maintenance</h2>
            <p>
              We&apos;re currently performing scheduled maintenance to improve
              your experience. We&apos;ll be back online shortly!
            </p>
            <div className="maintenance-info">
              <p>
                <strong>Expected completion:</strong> Soon
              </p>
              <p>
                For urgent inquiries, please contact us at{" "}
                <a href="mailto:info@deeplearningindabaxkenya.com">info@deeplearningindabaxkenya.com</a>
              </p>
            </div>
            <div className="error-actions">
              <Link href="/" className="btn btn-primary">
                Try Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
