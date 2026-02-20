import { Suspense } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Layouts/Navbar";
import Footer from "@/components/Layouts/Footer";
import EventsHeroBanner from "@/components/Events/EventsHeroBanner";
import Subscribe from "@/components/Common/Subscribe";

// Dynamic import to prevent webpack chunk loading errors
const EventsGrid = dynamic(() => import("@/components/Events/EventsGrid"), {
  ssr: false,
  loading: () => (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-3 text-muted">Loading events...</p>
    </div>
  ),
});

// Enable ISR: Revalidate this page every 60 seconds
export const revalidate = 60;

// Issue #2 FIX: Fallback for EventsHeroBanner if it fails to load
function HeroBannerFallback() {
  return (
    <div className="events-hero-banner events-hero-banner--simple" style={{ backgroundImage: `url(/images/main-bg4.jpg)` }}>
      <div className="d-table">
        <div className="d-table-cell">
          <div className="container">
            <div className="events-hero-content text-center">
              <h1>Events</h1>
              <p className="event-subtitle">Explore our upcoming and past events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <Suspense fallback={<HeroBannerFallback />}>
          <EventsHeroBanner />
        </Suspense>

        <EventsGrid />

        {/* Subscribe section - linked from banner when no upcoming events */}
        <div id="subscribe">
          <Subscribe />
        </div>
      </main>

      <Footer />
    </>
  );
}
