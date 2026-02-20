'use client'

// ═══════════════════════════════════════════════════════════════════════
// GOOGLE ANALYTICS 4 COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Add to layout.tsx to enable Google Analytics tracking
// Set NEXT_PUBLIC_GA_MEASUREMENT_ID in .env.local
// ═══════════════════════════════════════════════════════════════════════

import Script from 'next/script'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function GoogleAnalytics() {
  // Don't render if no GA ID configured
  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM EVENT TRACKING UTILITIES
// ═══════════════════════════════════════════════════════════════════════

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

/**
 * Track a custom event in Google Analytics
 * @param action - The action name (e.g., 'click', 'submit', 'download')
 * @param category - The category (e.g., 'registration', 'contact')
 * @param label - Optional label for more context
 * @param value - Optional numeric value
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

/**
 * Track page views (useful for SPA navigation)
 * @param url - The page URL
 * @param title - The page title
 */
export function trackPageView(url: string, title?: string) {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title || document.title,
    })
  }
}

/**
 * Track form submissions
 * @param formName - Name of the form (e.g., 'registration', 'contact', 'newsletter')
 */
export function trackFormSubmission(formName: string) {
  trackEvent('form_submit', 'engagement', formName)
}

/**
 * Track outbound link clicks
 * @param url - The external URL
 * @param label - Optional label
 */
export function trackOutboundLink(url: string, label?: string) {
  trackEvent('click', 'outbound', label || url)
}

/**
 * Track file downloads
 * @param filename - Name of the downloaded file
 * @param filetype - Type of file (pdf, doc, etc.)
 */
export function trackDownload(filename: string, filetype?: string) {
  trackEvent('download', 'file', filename)
}
