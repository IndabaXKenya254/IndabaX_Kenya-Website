// ═══════════════════════════════════════════════════════════════════════
// HOMEPAGE - FULLY OPTIMIZED WITH SSR/SSG (November 29, 2025)
// ═══════════════════════════════════════════════════════════════════════
// PERFORMANCE OPTIMIZATIONS:
// 1. Static Site Generation (SSG) with 1-minute revalidation
// 2. All data-fetching components are Server Components
// 3. Client components only for interactivity (countdown, modals)
// 4. Parallel data fetching (all server components fetch simultaneously)
// 5. Optimized images with blur placeholders
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import MainBanner from "@/components/HomeDefault/MainBanner";
import AboutUsContent from "@/components/HomeDefault/AboutUsContent";
import FunFact from "@/components/Common/FunFact";
import UpcomingEvents from "@/components/HomeDefault/UpcomingEvents";
import WhyUs from "@/components/Common/WhyUs";
import BuyTicket from "@/components/Common/BuyTicket";
import Subscribe from "@/components/Common/Subscribe";
import RegistrationPopup from "@/components/Common/RegistrationPopup";
import Footer from "@/components/Layouts/Footer";

// ═══════════════════════════════════════════════════════════════════════
// CACHING STRATEGY FOR PUBLIC PAGE
// ═══════════════════════════════════════════════════════════════════════
// NO CACHING - Always fetch fresh data (especially for sponsors)
// This ensures sponsors data is always live and up-to-date
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Registration Popup - Shows after delay */}
      <RegistrationPopup />

      {/* Main content landmark for accessibility */}
      <main id="main-content">
        {/* Section 1: Hero/Banner */}
        <MainBanner />

        {/* Section 2: About IndabaX */}
        <AboutUsContent />

        {/* Section 3: Quick Stats */}
        <FunFact />

        {/* Section 4: Upcoming Events */}
        <UpcomingEvents />

        {/* Section 5: Why IndabaX */}
        <WhyUs />

        {/* Section 6: Registration CTA */}
        <BuyTicket />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
