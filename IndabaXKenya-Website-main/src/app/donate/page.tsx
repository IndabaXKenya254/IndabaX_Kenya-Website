// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - DONATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════
// Issue #20: Public donations page with admin-editable content
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import DonationsContent from "@/components/Donations/DonationsContent";
import Footer from "@/components/Layouts/Footer";
import Subscribe from "@/components/Common/Subscribe";

export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Support IndabaX Kenya"
          shortText="Help us build the AI community in Kenya through your generous contributions"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Donate"
          bgImg="/images/main-bg3.jpg"
        />

        <DonationsContent />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
