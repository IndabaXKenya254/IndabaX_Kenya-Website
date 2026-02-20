// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TEAM PAGE
// ═══════════════════════════════════════════════════════════════════════
// Meet the organizing team behind IndabaX Kenya 2026
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import TeamGrid from "@/components/Team/TeamGrid";
import Subscribe from "@/components/Common/Subscribe";

// Enable ISR: Revalidate this page every 5 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Our Organizers"
          shortText="Meet the passionate individuals organizing IndabaX Kenya and building Africa's AI community!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Organizers"
          bgImg="/images/main-bg3.jpg"
        />
        <TeamGrid />
        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
