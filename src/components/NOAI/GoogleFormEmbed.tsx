// ═══════════════════════════════════════════════════════════════════════
// NOAI - GOOGLE FORM EMBED COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Responsive Google Form iframe embed for NOAI applications
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";

interface GoogleFormEmbedProps {
  formUrl?: string;
  title?: string;
  height?: number;
}

// The actual NOAI Google Form URL (resolved from forms.gle/22HsPjNM7L1wiBEF8)
const NOAI_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScsRMknEsrmc-Mgba7m67YPxw-ZkKMccJ9pPwvdU6HxDneHbA/viewform?embedded=true";

const GoogleFormEmbed: React.FC<GoogleFormEmbedProps> = ({
  formUrl = NOAI_FORM_URL,
  title = "NOAI Application Form",
  height = 800,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Convert regular Google Form URL to embeddable format if needed
  const getEmbedUrl = (url: string): string => {
    // If already has embedded=true, return as-is
    if (url.includes("embedded=true")) {
      return url;
    }

    // Extract form ID from various URL formats
    const formIdMatch = url.match(/\/forms\/d\/e\/([^/]+)/);
    if (formIdMatch) {
      return `https://docs.google.com/forms/d/e/${formIdMatch[1]}/viewform?embedded=true`;
    }

    // Add embedded parameter
    if (url.includes("viewform")) {
      return url + (url.includes("?") ? "&" : "?") + "embedded=true";
    }

    return url;
  };

  // Use provided URL or default NOAI form
  const embedUrl = getEmbedUrl(formUrl);

  return (
    <div className="google-form-embed-wrapper">
      <div className="form-container" data-aos="fade-up">
        {isLoading && (
          <div className="form-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading form...</span>
            </div>
            <p>Loading application form...</p>
          </div>
        )}

        <iframe
          src={embedUrl}
          width="100%"
          height={height}
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title={title}
          onLoad={() => setIsLoading(false)}
          className={`google-form-iframe ${isLoading ? 'loading' : 'loaded'}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        >
          Loading...
        </iframe>

        <div className="form-fallback">
          <p>
            Having trouble viewing the form?{" "}
            <a
              href="https://forms.gle/22HsPjNM7L1wiBEF8"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in a new tab <i className="icofont-external-link"></i>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleFormEmbed;
