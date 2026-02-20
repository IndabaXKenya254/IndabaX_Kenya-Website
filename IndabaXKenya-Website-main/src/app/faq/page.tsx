import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import FAQAccordion from "@/components/FAQ/FAQAccordion";
import Footer from "@/components/Layouts/Footer";
import Subscribe from "@/components/Common/Subscribe";

// Enable ISR: Revalidate this page every 5 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Frequently Asked Questions"
          shortText="Find answers to common questions about IndabaX Kenya 2026!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="FAQ"
          bgImg="/images/main-bg2.jpg"
        />

        <FAQAccordion />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
