// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════
// Unified login page for both admin and regular users
// Phase 2: Authentication Extension

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import LoginForm from "@/components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Sign In"
          shortText="Welcome back! Sign in to access your account"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Login"
          bgImg="/images/main-bg2.jpg"
        />
        <LoginForm />
      </main>

      <Footer />
    </>
  );
}
