// ═══════════════════════════════════════════════════════════════════════
// JSON-LD STRUCTURED DATA COMPONENTS
// ═══════════════════════════════════════════════════════════════════════
// Provides structured data for better search engine indexing
// References:
// - https://schema.org/Organization
// - https://schema.org/Event
// - https://schema.org/WebSite
// - https://developers.google.com/search/docs/advanced/structured-data
// ═══════════════════════════════════════════════════════════════════════

import Script from 'next/script'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://deeplearningindabaxkenya.com'
const SITE_NAME = 'IndabaX Kenya'

// ═══════════════════════════════════════════════════════════════════════
// ORGANIZATION SCHEMA
// ═══════════════════════════════════════════════════════════════════════

interface OrganizationJsonLdProps {
  name?: string
  url?: string
  logo?: string
  description?: string
  sameAs?: string[]
}

export function OrganizationJsonLd({
  name = SITE_NAME,
  url = SITE_URL,
  logo = `${SITE_URL}/images/logo.png`,
  description = "IndabaX Kenya is a regional machine learning conference affiliated with the Deep Learning Indaba. We bring together researchers, practitioners, and enthusiasts to advance AI in Kenya and Africa.",
  sameAs = [
    'https://twitter.com/IndabaXKenya',
    'https://www.linkedin.com/company/indabax-kenya',
    'https://github.com/IndabaXKenya',
  ],
}: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@deeplearningindabaxkenya.com',
      contactType: 'customer service',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
  }

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════
// WEBSITE SCHEMA
// ═══════════════════════════════════════════════════════════════════════

interface WebSiteJsonLdProps {
  name?: string
  url?: string
  description?: string
}

export function WebSiteJsonLd({
  name = SITE_NAME,
  url = SITE_URL,
  description = "IndabaX Kenya - Africa's premier machine learning conference bringing together researchers, practitioners, and enthusiasts to advance AI.",
}: WebSiteJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <Script
      id="website-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT SCHEMA
// ═══════════════════════════════════════════════════════════════════════

interface EventJsonLdProps {
  name: string
  description: string
  startDate: string
  endDate: string
  location: {
    name: string
    address: string
  }
  image?: string
  url?: string
  organizer?: string
  eventStatus?: 'EventScheduled' | 'EventPostponed' | 'EventCancelled' | 'EventMovedOnline'
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode'
  offers?: {
    price?: number
    priceCurrency?: string
    availability?: 'InStock' | 'SoldOut' | 'PreOrder'
    validFrom?: string
    url?: string
  }
}

export function EventJsonLd({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  url,
  organizer = SITE_NAME,
  eventStatus = 'EventScheduled',
  eventAttendanceMode = 'OfflineEventAttendanceMode',
  offers,
}: EventJsonLdProps) {
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    eventStatus: `https://schema.org/${eventStatus}`,
    eventAttendanceMode: `https://schema.org/${eventAttendanceMode}`,
    location: {
      '@type': 'Place',
      name: location.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: location.address,
        addressLocality: 'Nairobi',
        addressCountry: 'KE',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: organizer,
      url: SITE_URL,
    },
  }

  if (image) {
    jsonLd.image = image
  }

  if (url) {
    jsonLd.url = url
  }

  if (offers) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: offers.price || 0,
      priceCurrency: offers.priceCurrency || 'KES',
      availability: `https://schema.org/${offers.availability || 'InStock'}`,
      validFrom: offers.validFrom,
      url: offers.url || url,
    }
  }

  return (
    <Script
      id="event-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════
// BREADCRUMB SCHEMA
// ═══════════════════════════════════════════════════════════════════════

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ARTICLE/BLOG POST SCHEMA
// ═══════════════════════════════════════════════════════════════════════

interface ArticleJsonLdProps {
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  authorName?: string
  url: string
}

export function ArticleJsonLd({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName = SITE_NAME,
  url,
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: image || `${SITE_URL}/images/og-image.png`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <Script
      id="article-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════
// FAQ SCHEMA
// ═══════════════════════════════════════════════════════════════════════

interface FAQItem {
  question: string
  answer: string
}

interface FAQJsonLdProps {
  items: FAQItem[]
}

export function FAQJsonLd({ items }: FAQJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <Script
      id="faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
