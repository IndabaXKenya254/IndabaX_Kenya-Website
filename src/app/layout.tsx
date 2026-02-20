import "../../styles/bootstrap.min.css";
// IcoFont loaded from CDN in <head> for better performance
// import "../../styles/icofont.min.css";
import "../../styles/animate.min.css";
import 'react-accessible-accordion/dist/fancy-example.css';
import 'react-tabs/style/react-tabs.css';
import "swiper/css";
import "swiper/css/bundle";

// Global Styles - Import SCSS for Next.js compilation
import "../../styles/style.scss";
import "../../styles/responsive.scss";

// SweetAlert2 Custom Styles
import "../../styles/sweetalert-custom.css";

// Quill Rich Text Editor Custom Styles
// Base Quill CSS loaded from CDN in <head> for better compatibility with Next.js
import "../../styles/quill-custom.css";

// Active Navigation Styles
import "../../styles/navigation-active.css";

// Admin/Dashboard Styles
import "../styles/admin.css";
import "../styles/admin-mobile.css";

// NOAI Styles
import "../../styles/noai.css";

// Skeleton Loading Styles
import "../../styles/skeleton.css";

// Donations Page Styles
import "../../styles/donations.css";

// Global Button Visibility Fixes (MUST BE LAST - overrides all other button styles)
import "../../styles/button-fixes.css";

import type { Metadata } from "next";
import GoTop from "@/components/Layouts/GoTop";
import AOSInit from "@/components/Common/AOSInit";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { createPublicClient } from "@/lib/supabase";
import GoogleAnalytics from "@/components/Analytics/GoogleAnalytics";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/SEO/JsonLd";

// ═══════════════════════════════════════════════════════════════════════
// FONT CONFIGURATION - SYSTEM FONTS (TEMPORARY)
// ═══════════════════════════════════════════════════════════════════════
// Using system font stack instead of Google Fonts due to network issues
// TODO: Switch back to Poppins or self-host fonts when network issue resolved
// ═══════════════════════════════════════════════════════════════════════
const fontConfig = {
  className: 'font-sans',
  style: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }
};

/**
 * Generate dynamic metadata from settings and featured event
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = createPublicClient();

    // Fetch settings and featured/upcoming event in parallel
    const [settingsResult, eventResult] = await Promise.all([
      supabase
        .from('settings')
        .select('key, value')
        .in('key', ['site_name', 'site_description', 'site_keywords']),
      supabase
        .from('events')
        .select('title, start_date, end_date, location, venue')
        .eq('status', 'upcoming')
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle()
    ]);

    // Transform settings array to object
    const settings: Record<string, any> = {};
    const settingsData = (settingsResult.data || []) as { key: string; value: any }[];
    for (const setting of settingsData) {
      try {
        settings[setting.key] = typeof setting.value === 'string'
          ? JSON.parse(setting.value)
          : setting.value;
      } catch {
        settings[setting.key] = setting.value;
      }
    }

    // Format event dates for meta description
    let eventInfo = '';
    if (eventResult.data) {
      const event = eventResult.data as { start_date: string; end_date: string; venue?: string; location?: string };
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${endDate.getDate()}, ${endDate.getFullYear()}`;
      const venue = event.venue || event.location || 'Nairobi';
      eventInfo = `${dateRange} at ${venue}`;
    }

    const defaultDescription = eventInfo
      ? `IndabaX Kenya: Join Africa's leading machine learning conference. ${eventInfo}. Connect with AI researchers, practitioners, and enthusiasts.`
      : "IndabaX Kenya: Join Africa's leading machine learning conference. Connect with AI researchers, practitioners, and enthusiasts.";

    return {
      title: settings.site_name || "IndabaX Kenya - Machine Learning Conference",
      description: settings.site_description || defaultDescription,
      keywords: settings.site_keywords || "IndabaX Kenya, machine learning, AI conference, Nairobi, deep learning, artificial intelligence",
      // Icons are auto-detected from src/app/ directory (favicon.ico, icon.png, apple-icon.png)
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    // Fallback to default metadata
    return {
      title: "IndabaX Kenya - Machine Learning Conference",
      description: "IndabaX Kenya: Join Africa's leading machine learning conference. Connect with AI researchers, practitioners, and enthusiasts.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="2dQxJmgYah3tDWRrJ-SNM2ELtnFAZu2fOCuXBKDMjAk" />

        {/* Preconnect to CDN for faster resource loading */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        {/* Preload critical icon fonts for faster first paint */}
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/npm/icofont@1.0.0/dist/icofont.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
          crossOrigin="anonymous"
        />

        {/* Load IcoFont from CDN with swap display */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/icofont@1.0.0/dist/icofont.min.css"
          crossOrigin="anonymous"
        />

        {/* Load Bootstrap Icons from CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
          crossOrigin="anonymous"
        />

        {/* Load Quill Snow theme CSS from CDN (required for displaying rich text content) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css"
          crossOrigin="anonymous"
        />

        {/* Font display swap for icon fonts */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'IcoFont';
                font-display: swap;
              }
              @font-face {
                font-family: 'bootstrap-icons';
                font-display: swap;
              }
            `,
          }}
        />

      </head>
      <body className={fontConfig.className} style={fontConfig.style}>
        {/* AOS Initialization - Must be at top of body for scroll animations */}
        <AOSInit />

        {/* React Query Provider - Handles all data fetching with automatic deduplication */}
        <QueryProvider>
          <AuthProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </AuthProvider>
        </QueryProvider>

        <GoTop />

        {/* Google Analytics & Structured Data - must be in body for Next.js Script component */}
        <GoogleAnalytics />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </body>
    </html>
  );
}
