// ═══════════════════════════════════════════════════════════════════════
// NOAI FAQ PAGE
// ═══════════════════════════════════════════════════════════════════════
// Frequently Asked Questions specific to NOAI

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import NOAIFAQAccordion from "@/components/NOAI/NOAIFAQAccordion";

export const metadata = {
  title: "NOAI FAQ | IndabaX Kenya",
  description:
    "Frequently asked questions about the National Olympiad in Artificial Intelligence (NOAI)",
};

export default function NOAIFAQPage() {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="NOAI FAQ"
        shortText="Frequently Asked Questions about the National Olympiad in Artificial Intelligence"
        homePageUrl="/noai"
        homePageText="NOAI"
        activePageText="FAQ"
        bgImg="/images/main-bg3.jpg"
      />

      <NOAIFAQAccordion />

      <Footer />
    </>
  );
}
