import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import AboutUsContent from "@/components/AboutUs/AboutUsContent";
import WhyUs from "@/components/Common/WhyUs";
import Speakers from "@/components/Common/Speakers";
import Cta from "@/components/Common/Cta";
import FunFact from "@/components/Common/FunFact";
import Partner from "@/components/Common/Partner";
import BuyTicket from "@/components/Common/BuyTicket";
import Subscribe from "@/components/Common/Subscribe";
import Footer from "@/components/Layouts/Footer";

// Enable ISR: Revalidate this page every 5-10 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="About IndabaX Kenya"
          shortText="Strengthening machine learning and AI across Africa through collaboration and knowledge sharing"
          homePageUrl="/"
          homePageText="Home"
          activePageText="About Us"
          bgImg="/images/main-bg1.jpg"
        />

        <AboutUsContent />

        <WhyUs />

        <Speakers />

        <Cta />

        <FunFact />

        <Partner />

        <BuyTicket />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
