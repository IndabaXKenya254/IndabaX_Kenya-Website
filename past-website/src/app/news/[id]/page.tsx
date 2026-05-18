// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - NEWS/POST DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════
// Dynamic route for individual news articles and blog posts
// ═══════════════════════════════════════════════════════════════════════

import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import NewsDetails from "@/components/News/NewsDetails";

interface PageProps {
  params: {
    id: string;
  };
}

// Enable ISR: Revalidate this page every 5-10 minutes
export const revalidate = 60;

export default function Page({ params }: PageProps) {
  return (
    <>
      <Navbar />
      <PageBanner
        pageTitle="News & Updates"
        shortText="Stay informed with the latest from IndabaX Kenya"
        homePageUrl="/"
        homePageText="Home"
        activePageText="News Details"
        bgImg="/images/main-bg3.jpg"
      />
      <NewsDetails postId={params.id} />
      <Footer />
    </>
  );
}
