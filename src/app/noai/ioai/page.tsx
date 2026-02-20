// ═══════════════════════════════════════════════════════════════════════
// NOAI - ABOUT IOAI PAGE
// ═══════════════════════════════════════════════════════════════════════
// Information about the International Olympiad in Artificial Intelligence
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import IOAIIntro from "@/components/NOAI/IOAIIntro";
import CompetitionAreas from "@/components/NOAI/CompetitionAreas";
import GAITESection from "@/components/NOAI/GAITESection";
import IOAIHistory from "@/components/NOAI/IOAIHistory";
import FoundingCountries from "@/components/NOAI/FoundingCountries";
// Issue #40 FIX: ApplicationCTA removed per client request

// Enable ISR: Revalidate every 5 minutes
export const revalidate = 60;

export const metadata = {
  title: "About IOAI - International Olympiad in Artificial Intelligence | NOAI Kenya",
  description:
    "Learn about the International Olympiad in Artificial Intelligence (IOAI), its mission, vision, competition format, and history. Join the global AI community.",
  keywords: [
    "IOAI",
    "International Olympiad",
    "Artificial Intelligence",
    "AI Competition",
    "Machine Learning",
    "Computer Vision",
    "NLP",
    "GAITE",
  ],
};

export default function AboutIOAIPage() {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="About IOAI"
        shortText="International Olympiad in Artificial Intelligence"
        homePageUrl="/"
        homePageText="Home"
        activePageText="About IOAI"
        bgImg="/images/main-bg3.jpg"
      />

      <IOAIIntro />

      <CompetitionAreas />

      <GAITESection />

      <IOAIHistory />

      <FoundingCountries />

      {/* Issue #40 FIX: ApplicationCTA removed per client request */}

      <Footer />
    </>
  );
}
