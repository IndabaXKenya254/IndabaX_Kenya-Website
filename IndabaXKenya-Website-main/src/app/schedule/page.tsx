import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import EventSchedules from "@/components/HomeDefault/EventSchedules";
import Subscribe from "@/components/Common/Subscribe";

// Enable ISR: Revalidate this page every 5 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Event Schedule"
          shortText="Full program with keynotes, workshops, panels, and networking sessions!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Schedule"
          bgImg="/images/main-bg1.jpg"
        />

        <EventSchedules />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
