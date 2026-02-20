// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REGISTER PAGE
// ═══════════════════════════════════════════════════════════════════════
// User account creation page (replaced old event registration)
// Phase 2: Authentication Extension

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import SignupForm from "@/components/Auth/SignupForm";

export default function RegisterPage() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Create Account"
          shortText="Join the IndabaX Kenya community and register for upcoming events"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Register"
          bgImg="/images/main-bg2.jpg"
        />
        <SignupForm />
      </main>

      <Footer />
    </>
  );
}
