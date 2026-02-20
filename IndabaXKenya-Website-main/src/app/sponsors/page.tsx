import Link from "next/link";
import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import { SponsorsGrid } from "@/components/Sponsors";
import Footer from "@/components/Layouts/Footer";
import Subscribe from "@/components/Common/Subscribe";

// Static generation like speakers page
// SponsorsGrid fetches data client-side in useEffect

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Our Sponsors & Partners"
          shortText="Thank you to our amazing sponsors who make IndabaX Kenya possible!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Sponsors"
          bgImg="/images/main-bg2.jpg"
        />

        <SponsorsGrid />

        {/* Issue #19 FIX: Add "Become a Sponsor" CTA section */}
        <section className="become-sponsor-section ptb-120 bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center">
                <span className="sub-title">SPONSORSHIP OPPORTUNITIES</span>
                <h2>Interested in Becoming a Sponsor?</h2>
                <p className="lead text-muted mb-4">
                  Partner with IndabaX Kenya to support Africa&apos;s growing AI community.
                  Reach 500+ attendees, researchers, and industry professionals from across the continent.
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Link
                    href="/contact?subject=Sponsorship%20Inquiry"
                    className="btn btn-primary btn-lg"
                  >
                    <i className="icofont-envelope me-2"></i>
                    Contact Us About Sponsorship
                  </Link>
                  <Link
                    href="/donate"
                    className="btn btn-outline-primary btn-lg"
                  >
                    <i className="icofont-heart me-2"></i>
                    Donate / Sponsor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
