// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════
// Dynamic route for individual event details
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import EventDetails from "@/components/Events/EventDetails";
import EventGallerySection from "@/components/Events/EventGallerySection";
import EventScheduleSection from "@/components/Events/EventScheduleSection";

interface PageProps {
  params: {
    slug: string;
  };
}

// Enable ISR: Revalidate this page every 5-10 minutes
export const revalidate = 60;

export default function Page({ params }: PageProps) {
  return (
    <>
      <Navbar />
      <PageBanner
        pageTitle="Event Details"
        shortText="Learn more about this event"
        homePageUrl="/"
        homePageText="Home"
        activePageText="Event Details"
        bgImg="/images/main-bg2.jpg"
        compact={true}
      />
      <EventDetails eventId={params.slug} />
      <EventGallerySection eventId={params.slug} />
      <EventScheduleSection eventSlug={params.slug} />
      <Footer />
    </>
  );
}
