// ═══════════════════════════════════════════════════════════════════════
// NOAI - KENYA'S JOURNEY PAGE
// ═══════════════════════════════════════════════════════════════════════
// Kenya's participation history in IOAI
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import KenyaParticipation from "@/components/NOAI/KenyaParticipation";
// Issue #40 FIX: ApplicationCTA removed per client request

// Enable ISR: Revalidate every 5 minutes
export const revalidate = 60;

export const metadata = {
  title: "Kenya's IOAI Journey | NOAI Kenya",
  description:
    "Kenya's participation in the International Olympiad in Artificial Intelligence. Our first participation was in 2025 in Beijing, China.",
  keywords: [
    "Kenya IOAI",
    "Kenya AI Olympiad",
    "IOAI 2025",
    "Beijing",
    "Kenya Team",
    "STEM Kenya",
  ],
};

export default function KenyaJourneyPage() {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Kenya's Journey"
        shortText="Our path in the International Olympiad in Artificial Intelligence"
        homePageUrl="/"
        homePageText="Home"
        activePageText="Kenya's Journey"
        bgImg="/images/main-bg3.jpg"
      />

      <KenyaParticipation />

      {/* Issue #40 FIX: ApplicationCTA removed per client request */}

      <Footer />
    </>
  );
}
