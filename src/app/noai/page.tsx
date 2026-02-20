// ═══════════════════════════════════════════════════════════════════════
// NOAI - SINGLE-PAGE LAYOUT (Database-driven)
// ═══════════════════════════════════════════════════════════════════════
// National Olympiad for Artificial Intelligence - Consolidated single-page experience
// All content is editable via admin panel (/admin/noai)
// ═══════════════════════════════════════════════════════════════════════

import '../../../styles/noai.css';

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import Subscribe from "@/components/Common/Subscribe";

// DB-driven components
import NOAIAboutSection from "@/components/NOAI/NOAIAboutSection";
import KenyaJourneyTimelineDB from "@/components/NOAI/KenyaJourneyTimelineDB";
import ParticipantsSection from "@/components/NOAI/ParticipantsSection";
import DynamicNOAIApplicationForm from "@/components/NOAI/DynamicNOAIApplicationForm";
import NOAIFAQDBSection from "@/components/NOAI/NOAIFAQDBSection";
import NOAIGalleryGrid from "@/components/NOAI/NOAIGalleryGrid";
import { Suspense } from 'react';

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "NOAI - National Olympiad for Artificial Intelligence | IndabaX Kenya",
  description:
    "Kenya's pathway to the International Olympiad in Artificial Intelligence (IOAI). Learn about NOAI, our journey, participants, and how to apply.",
  keywords: [
    "NOAI",
    "National Olympiad",
    "Artificial Intelligence",
    "IOAI",
    "Kenya",
    "AI Competition",
    "High School",
    "STEM",
    "AI Education",
    "Machine Learning",
    "Kenya IOAI Team"
  ],
};

export default function NOAIPage() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="National Olympiad for AI"
          shortText="Kenya's pathway to the International Olympiad in Artificial Intelligence"
          homePageUrl="/"
          homePageText="Home"
          activePageText="NOAI"
          bgImg="/images/main-bg3.jpg"
        />

        {/* 1. INTRO: About NOAI - What it is */}
        <NOAIAboutSection />

        {/* 2. ABOUT IOAI KENYA'S JOURNEY: Editable Timeline/Tree Map */}
        <KenyaJourneyTimelineDB />

        {/* 3. APPLY: Application Form */}
        <div id="apply">
          <Suspense
            fallback={
              <div className="ptb-120 bg-light">
                <div className="container text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading application form...</p>
                </div>
              </div>
            }
          >
            <DynamicNOAIApplicationForm />
          </Suspense>
        </div>

        {/* 4. PAST PARTICIPANTS: Participants by Year */}
        <ParticipantsSection />

        {/* 5. GALLERY: Photo Gallery */}
        <div id="gallery">
          <NOAIGalleryGrid showYearFilter={true} />
        </div>

        {/* 6. FAQs: FAQ Section */}
        <NOAIFAQDBSection />

        {/* 7. NEWSLETTER: Subscribe Section */}
        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
