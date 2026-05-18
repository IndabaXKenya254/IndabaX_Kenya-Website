// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - HISTORY / PREVIOUS EDITIONS PAGE
// ═══════════════════════════════════════════════════════════════════════
// Shows past IndabaX Kenya editions organized by year
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import PreviousEditions from "@/components/History/PreviousEditions";
import Subscribe from "@/components/Common/Subscribe";

// Force dynamic rendering to avoid static generation errors
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Previous Editions | IndabaX Kenya",
  description:
    "Explore the history of IndabaX Kenya conferences. View highlights, photos, and achievements from past editions since 2022.",
  keywords: [
    "IndabaX Kenya History",
    "Previous Editions",
    "AI Conference Kenya",
    "IndabaX 2022",
    "IndabaX 2023",
    "IndabaX 2024",
    "Machine Learning Kenya",
  ],
};

export default function HistoryPage() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Previous Editions"
          shortText="Celebrating our journey in advancing AI across East Africa"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Previous Editions"
          bgImg="/images/main-bg2.jpg"
        />

        <PreviousEditions />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
