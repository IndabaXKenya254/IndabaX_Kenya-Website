// ═══════════════════════════════════════════════════════════════════════
// NOAI - DYNAMIC YEAR PAGE
// ═══════════════════════════════════════════════════════════════════════
// Dynamically loads NOAI event data for any year
// Example URLs: /noai/2026, /noai/2027, etc.
// ═══════════════════════════════════════════════════════════════════════

import { Suspense } from 'react';
import { Metadata } from 'next';
import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import NOAIYearDetails from "@/components/NOAI/NOAIYearDetails";
// Issue #40 FIX: ApplicationCTA removed per client request

interface PageProps {
  params: {
    year: string;
  };
}

// Enable ISR: Revalidate every 10 minutes
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `NOAI ${params.year} | IndabaX Kenya`,
    description: `National Olympiad in Artificial Intelligence ${params.year} - Kenya's pathway to IOAI`,
    keywords: [`NOAI ${params.year}`, `IOAI ${params.year}`, "Kenya AI Olympiad"],
  };
}

export default function NOAIYearPage({ params }: PageProps) {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle={`NOAI ${params.year}`}
        shortText={`National Olympiad in Artificial Intelligence - ${params.year}`}
        homePageUrl="/noai"
        homePageText="NOAI"
        activePageText={`NOAI ${params.year}`}
        bgImg="/images/main-bg3.jpg"
      />

      <Suspense
        fallback={
          <div className="ptb-120">
            <div className="container text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading event details...</p>
            </div>
          </div>
        }
      >
        <NOAIYearDetails year={params.year} />
      </Suspense>

      {/* Issue #40 FIX: ApplicationCTA removed per client request */}

      <Footer />
    </>
  );
}
