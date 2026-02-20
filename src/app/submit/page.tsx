// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CALL FOR PAPERS PAGE
// ═══════════════════════════════════════════════════════════════════════
// Requires authentication - speakers/applicants can submit papers

'use client'

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import SubmissionForm from "@/components/CallForPapers/SubmissionForm";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { useSettings } from "@/contexts/SettingsContext";

export default function Page() {
  const { settings } = useSettings();
  const currentYear = settings.current_event_year || new Date().getFullYear();

  // Format deadline if available
  const deadlineText = settings.submission_deadline
    ? new Date(settings.submission_deadline).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  const shortText = deadlineText
    ? `Share your AI research with IndabaX Kenya ${currentYear} - Deadline: ${deadlineText}`
    : `Share your AI research with IndabaX Kenya ${currentYear}`;

  return (
    <ProtectedRoute allowedRoles={['applicant', 'speaker', 'admin', 'reviewer']}>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Call for Papers"
          shortText={shortText}
          homePageUrl="/"
          homePageText="Home"
          activePageText="Submit"
          bgImg="/images/main-bg3.jpg"
        />
        <SubmissionForm />
      </main>

      <Footer />
    </ProtectedRoute>
  );
}
