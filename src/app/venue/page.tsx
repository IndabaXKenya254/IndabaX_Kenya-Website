// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - VENUE PAGE
// ═══════════════════════════════════════════════════════════════════════
// Venue location, getting there information, and amenities
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import VenueInfo from "@/components/Venue/VenueInfo";
import Subscribe from "@/components/Common/Subscribe";

// Enable ISR: Revalidate this page every 5-10 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Conference Venue"
          shortText="Join us at the iconic Kenyatta International Convention Centre in the heart of Nairobi!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Venue"
          bgImg="/images/main-bg1.jpg"
        />
        <VenueInfo />
        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
