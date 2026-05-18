import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import Subscribe from "@/components/Common/Subscribe";

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Terms & Conditions"
          shortText="Please read these terms and conditions carefully before using our services or attending our events."
          homePageUrl="/"
          homePageText="Home"
          activePageText="Terms & Conditions"
          bgImg="/images/main-bg2.jpg"
        />

        <div className="ptb-120">
          <div className="container">
            <div className="main-textarea">
              <p className="mb-4">
                <strong>Last Updated:</strong> March 2026
              </p>

              <p>
                Welcome to IndabaX Kenya. By accessing our website, registering for our event, or using our services, you agree to be bound by these Terms and Conditions. Please read them carefully.
              </p>

              <h4>1. Acceptance of Terms</h4>

              <p>
                By using this website and participating in IndabaX Kenya 2026, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, as well as our Privacy Policy. If you do not agree with any part of these terms, you may not use our services.
              </p>

              <h4>2. Event Registration</h4>

              <p>
                <strong>2.1 Registration Requirements:</strong> To register for IndabaX Kenya 2026, you must provide accurate, current, and complete information as requested in the registration form.
              </p>

              <p>
                <strong>2.2 Free Admission:</strong> Attendance to IndabaX Kenya 2026 is free. However, registration is required, and spaces are limited. Registration does not guarantee admission if capacity is reached.
              </p>

              <p>
                <strong>2.3 Registration Confirmation:</strong> You will receive a confirmation email upon successful registration. Please retain this confirmation for event check-in.
              </p>

              <p>
                <strong>2.4 Cancellation:</strong> If you can no longer attend, please notify us at info@deeplearningindabaxkenya.com to allow others to register. We reserve the right to cancel or reschedule the event due to unforeseen circumstances.
              </p>

              <h4>3. Code of Conduct</h4>

              <p>
                All attendees, speakers, sponsors, and volunteers at IndabaX Kenya are required to agree with the following code of conduct:
              </p>

              <ul>
                <li>Treat all participants with respect and consideration</li>
                <li>Refrain from demeaning, discriminatory, or harassing behavior and speech</li>
                <li>Be mindful of your surroundings and fellow participants</li>
                <li>Alert event organizers if you notice a dangerous situation or someone in distress</li>
                <li>Respect the venue and equipment provided</li>
              </ul>

              <p>
                Harassment of any kind will not be tolerated. Participants violating these rules may be expelled from the event without refund (if applicable) at the discretion of the organizers.
              </p>

              <h4>4. Call for Papers & Presentations</h4>

              <p>
                <strong>4.1 Submission:</strong> By submitting a proposal for talks, workshops, or posters, you grant IndabaX Kenya the right to review and select submissions for presentation at the event.
              </p>

              <p>
                <strong>4.2 Intellectual Property:</strong> You retain all rights to your work. However, by presenting at IndabaX Kenya, you grant us permission to record, photograph, and share your presentation for educational and promotional purposes.
              </p>

              <p>
                <strong>4.3 Content Responsibility:</strong> Presenters are solely responsible for the content of their presentations and must ensure they have the necessary rights to use any materials included.
              </p>

              <h4>5. Photography and Recording</h4>

              <p>
                By attending IndabaX Kenya 2026, you consent to being photographed, filmed, or recorded during the event. These materials may be used for promotional purposes on our website, social media, and marketing materials. If you do not wish to be photographed or recorded, please inform the event staff.
              </p>

              <h4>6. Intellectual Property Rights</h4>

              <p>
                The content on this website, including text, graphics, logos, images, and software, is the property of IndabaX Kenya or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>

              <h4>7. Limitation of Liability</h4>

              <p>
                IndabaX Kenya and its organizers, sponsors, and partners shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:
              </p>

              <ul>
                <li>Your use of or inability to use our website or services</li>
                <li>Any injury, loss, or damage to person or property during the event</li>
                <li>Unauthorized access to or alteration of your data</li>
                <li>Any other matter relating to the event or services</li>
              </ul>

              <p>
                Attendees participate at their own risk and are responsible for their personal belongings.
              </p>

              <h4>8. Force Majeure</h4>

              <p>
                IndabaX Kenya shall not be liable for any failure to perform its obligations due to circumstances beyond its reasonable control, including but not limited to natural disasters, acts of government, terrorism, civil unrest, pandemics, or technical failures.
              </p>

              <h4>9. Personal Belongings</h4>

              <p>
                IndabaX Kenya is not responsible for any loss, theft, or damage to personal belongings during the event. Attendees are advised to keep their valuables secure at all times.
              </p>

              <h4>10. Health and Safety</h4>

              <p>
                Attendees are expected to follow all health and safety guidelines provided by the venue and event organizers. This may include, but is not limited to, emergency evacuation procedures and health protocols.
              </p>

              <h4>11. Modifications to Terms</h4>

              <p>
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on this page. Your continued use of our services after changes are posted constitutes your acceptance of the revised terms.
              </p>

              <h4>12. Governing Law</h4>

              <p>
                These Terms and Conditions shall be governed by and construed in accordance with the laws of Kenya. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Kenya.
              </p>

              <h4>13. Contact Information</h4>

              <p>
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <p>
                <strong>Email:</strong> info@deeplearningindabaxkenya.com<br />
                <strong>Phone:</strong> +254 700 000 000<br />
                <strong>Address:</strong> University of Nairobi, Nairobi, Kenya
              </p>

              <p className="mt-4">
                <em>
                  By registering for or attending IndabaX Kenya 2026, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
                </em>
              </p>

            </div>
          </div>
        </div>

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
