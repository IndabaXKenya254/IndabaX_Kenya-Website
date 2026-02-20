import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import NewsGrid from "@/components/News/NewsGrid";
import Subscribe from "@/components/Common/Subscribe";

// Enable ISR: Revalidate this page every 5 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="News & Blog"
          shortText="Stay updated with latest announcements, research highlights, and stories from IndabaX Kenya!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="News"
          bgImg="/images/main-bg2.jpg"
        />

        <NewsGrid />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
