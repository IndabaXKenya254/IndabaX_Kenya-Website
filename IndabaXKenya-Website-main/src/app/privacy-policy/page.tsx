import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Privacy Policy"
          shortText="Your privacy is important to us. Learn how we collect, use, and protect your personal information."
          homePageUrl="/"
          homePageText="Home"
          activePageText="Privacy Policy"
          bgImg="/images/main-bg2.jpg"
        />

        <div className="ptb-120">
          <div className="container">
            <div className="main-textarea">
              <p className="mb-4">
                <strong>Last Updated:</strong> March 2026
              </p>

              <p>
                IndabaX Kenya is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or attend our events.
              </p>

              <h4>1. Information We Collect</h4>

              <p>
                We may collect personal information that you provide to us when you:
              </p>
              <ul>
                <li>Register for IndabaX Kenya 2026 event</li>
                <li>Submit a call for papers or workshop proposal</li>
                <li>Subscribe to our newsletter</li>
                <li>Contact us through our website</li>
                <li>Apply for volunteer or speaking opportunities</li>
              </ul>

              <p>
                The personal information we collect may include your name, email address, phone number, organization, country, dietary requirements, and professional background.
              </p>

              <h4>2. How We Use Your Information</h4>

              <p>We use the information we collect to:</p>
              <ul>
                <li>Process your event registration and send you event-related information</li>
                <li>Evaluate call for papers submissions and contact selected speakers</li>
                <li>Send you newsletters and updates about IndabaX Kenya events</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Improve our website and event experience</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h4>3. Information Sharing and Disclosure</h4>

              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your information with:
              </p>
              <ul>
                <li>Event sponsors and partners (only with your explicit consent)</li>
                <li>Service providers who assist us in operating our website and conducting our events</li>
                <li>Law enforcement or government agencies when required by law</li>
              </ul>

              <h4>4. Data Security</h4>

              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h4>5. Your Rights</h4>

              <p>You have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of marketing communications at any time</li>
                <li>Withdraw consent for data processing</li>
              </ul>

              <h4>6. Cookies and Tracking Technologies</h4>

              <p>
                Our website uses cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand where our visitors are coming from. You can control cookie preferences through your browser settings.
              </p>

              <h4>7. Third-Party Links</h4>

              <p>
                Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to read the privacy policies of any third-party sites you visit.
              </p>

              <h4>8. Children&apos;s Privacy</h4>

              <p>
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>

              <h4>9. Changes to This Privacy Policy</h4>

              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
              </p>

              <h4>10. Contact Us</h4>

              <p>
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p>
                <strong>Email:</strong> info@deeplearningindabaxkenya.com<br />
                <strong>Phone:</strong> +254 700 000 000<br />
                <strong>Address:</strong> University of Nairobi, Nairobi, Kenya
              </p>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
