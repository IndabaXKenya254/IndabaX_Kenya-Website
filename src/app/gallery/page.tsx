import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import GalleryGrid from "@/components/Gallery/GalleryGrid";
import Subscribe from "@/components/Common/Subscribe";

// Enable ISR: Revalidate this page every 5 minutes
export const revalidate = 60;

export default function Page() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <PageBanner
          pageTitle="Photo Gallery"
          shortText="Relive the best moments from IndabaX Kenya conferences!"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Gallery"
          bgImg="/images/main-bg3.jpg"
        />

        <GalleryGrid />

        <Subscribe />
      </main>

      <Footer />
    </>
  );
}
