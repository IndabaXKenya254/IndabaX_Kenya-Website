import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import ContactForm from "@/components/ContactUs/ContactForm";
import Footer from "@/components/Layouts/Footer";

// Enable ISR: Revalidate this page every 5-10 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Contact Us"
          shortText="Send me your Message"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Contact Us"
          bgImg="/images/main-bg4.jpg"
        />

        <ContactForm />
      </main>

      <Footer />
    </>
  );
}
