// ═══════════════════════════════════════════════════════════════════════
// ROBOTS.TXT GENERATOR
// ═══════════════════════════════════════════════════════════════════════
// Controls search engine crawling behavior
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
// ═══════════════════════════════════════════════════════════════════════

import { MetadataRoute } from 'next'

// Hardcode the site URL to prevent line-break issues in generated robots.txt
const SITE_URL = 'https://deeplearningindabaxkenya.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',           // Admin panel
          '/api/',             // API routes
          '/dashboard/',       // User dashboard
          '/reviewer/',        // Reviewer panel
          '/survey/',          // Private survey pages
          '/_next/',           // Next.js internals
          '/403',              // Error pages
          '/maintenance',      // Maintenance page
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/reviewer/',
          '/survey/',
        ],
      },
    ],
    // Use full URL string to prevent line-break issues
    sitemap: 'https://deeplearningindabaxkenya.com/sitemap.xml',
    // Note: 'host' directive is deprecated and removed - not needed for modern crawlers
  }
}
