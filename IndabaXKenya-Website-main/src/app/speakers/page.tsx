import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import SpeakersGrid from "@/components/Speakers/SpeakersGrid";
import Subscribe from "@/components/Common/Subscribe";

// Enable ISR: Revalidate this page every 5 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Conference Speakers"
          shortText="Learn from Africa's leading AI experts and innovators!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Speakers"
          bgImg="/images/main-bg5.jpg"
        />

        <SpeakersGrid />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
