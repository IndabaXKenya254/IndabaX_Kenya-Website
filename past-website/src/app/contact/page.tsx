// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CONTACT PAGE
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import ContactForm from "@/components/ContactUs/ContactForm";
import SponsorCTA from "@/components/ContactUs/SponsorCTA";
import Footer from "@/components/Layouts/Footer";
import Subscribe from "@/components/Common/Subscribe";

// Enable ISR: Revalidate this page every 5-10 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Get In Touch"
          shortText="Have questions about IndabaX Kenya 2026? We'd love to hear from you!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Contact"
          bgImg="/images/main-bg4.jpg"
        />

        <ContactForm />

        {/* Issue #19: Sponsor outreach section */}
        <SponsorCTA />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
