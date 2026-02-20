// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SPEAKER DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════
// Detailed speaker profile with full biography and social links
// ═══════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import type { Speaker, ApiSuccessResponse } from "@/types/api";

export default function SpeakerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpeaker = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all speakers and find the one with matching ID
        const response = await fetch('/api/speakers');

        if (!response.ok) {
          throw new Error('Failed to fetch speaker');
        }

        const result: ApiSuccessResponse<Speaker[]> = await response.json();
        const foundSpeaker = result.data.find((s) => s.id === params.id);

        if (!foundSpeaker) {
          setError('Speaker not found');
          return;
        }

        setSpeaker(foundSpeaker);
      } catch (err) {
        console.error('Error fetching speaker:', err);
        setError(err instanceof Error ? err.message : 'Failed to load speaker');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSpeaker();
    }
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <PageBanner
          pageTitle="Speaker Profile"
          shortText="Loading speaker information..."
          homePageUrl="/"
          homePageText="Home"
          activePageText="Speaker"
          bgImg="/images/main-bg3.jpg"
        />
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading speaker details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !speaker) {
    return (
      <>
        <Navbar />
        <PageBanner
          pageTitle="Speaker Not Found"
          shortText="The speaker you're looking for doesn't exist"
          homePageUrl="/"
          homePageText="Home"
          activePageText="Speaker"
          bgImg="/images/main-bg3.jpg"
        />
        <div className="container py-5">
          <div className="alert alert-warning text-center">
            <i className="icofont-warning icofont-2x mb-3"></i>
            <h4>{error || "Speaker not found"}</h4>
            <p>The speaker you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link href="/speakers" className="btn btn-primary mt-3">
              <i className="icofont-arrow-left me-2"></i>
              Back to Speakers
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageBanner
        pageTitle={speaker.name}
        shortText={speaker.title || "Conference Speaker"}
        homePageUrl="/"
        homePageText="Home"
        activePageText="Speaker Profile"
        bgImg="/images/main-bg3.jpg"
      />

      <div className="speaker-detail-area ptb-120">
        <div className="container">
          <div className="row">
            {/* Speaker Profile Card */}
            <div className="col-lg-4 col-md-5">
              <div className="speaker-profile-card" data-aos="fade-up">
                {/* Profile Image */}
                <div className="profile-image-wrapper">
                  {speaker.photo_url ? (
                    <Image
                      src={speaker.photo_url}
                      alt={speaker.name}
                      width={400}
                      height={400}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '15px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '400px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className="icofont-user-alt-4" style={{ fontSize: '6rem', color: '#ccc' }}></i>
                    </div>
                  )}
                </div>

                {/* Speaker Info */}
                <div className="profile-info mt-4">
                  <h2 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>{speaker.name}</h2>
                  {speaker.title && (
                    <p className="text-primary" style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                      {speaker.title}
                    </p>
                  )}
                  {speaker.organization && (
                    <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                      <i className="icofont-building-alt me-2"></i>
                      {speaker.organization}
                    </p>
                  )}
                  {speaker.country && (
                    <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                      <i className="icofont-location-pin me-2"></i>
                      {speaker.country}
                    </p>
                  )}

                  {/* Social Links */}
                  <div className="social-links d-flex gap-2 flex-wrap">
                    {speaker.linkedin_url && (
                      <a
                        href={speaker.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ borderRadius: '25px', flex: '1' }}
                      >
                        <i className="icofont-linkedin"></i> LinkedIn
                      </a>
                    )}
                    {speaker.twitter_url && (
                      <a
                        href={speaker.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-info"
                        style={{ borderRadius: '25px', flex: '1', color: 'white' }}
                      >
                        <i className="icofont-twitter"></i> Twitter
                      </a>
                    )}
                    {speaker.website_url && (
                      <a
                        href={speaker.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ borderRadius: '25px', flex: '1' }}
                      >
                        <i className="icofont-globe"></i> Website
                      </a>
                    )}
                  </div>
                </div>

                {/* Back Button */}
                <div className="mt-4">
                  <Link href="/speakers" className="btn btn-light w-100" style={{ borderRadius: '25px' }}>
                    <i className="icofont-arrow-left me-2"></i>
                    Back to All Speakers
                  </Link>
                </div>
              </div>
            </div>

            {/* Speaker Biography */}
            <div className="col-lg-8 col-md-7">
              <div className="speaker-bio-section" data-aos="fade-up" data-aos-delay="100">
                {/* Short Bio */}
                {speaker.bio_short && (
                  <div className="bio-highlight mb-4">
                    <div
                      className="highlight-content"
                      dangerouslySetInnerHTML={{ __html: speaker.bio_short }}
                      style={{
                        fontSize: '1.2rem',
                        lineHeight: '1.8',
                        color: '#555',
                        padding: '2rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px',
                        borderLeft: '4px solid #007bff',
                      }}
                    />
                  </div>
                )}

                {/* Full Biography */}
                {speaker.bio_full && (
                  <div className="full-bio">
                    <h3
                      style={{
                        fontWeight: '600',
                        marginBottom: '1.5rem',
                        color: '#333',
                        borderBottom: '2px solid #007bff',
                        paddingBottom: '0.5rem',
                      }}
                    >
                      <i className="icofont-info-circle me-2"></i>
                      About {speaker.name.split(' ')[0]}
                    </h3>
                    <div
                      className="bio-content"
                      dangerouslySetInnerHTML={{ __html: speaker.bio_full }}
                      style={{
                        fontSize: '1rem',
                        lineHeight: '1.9',
                        color: '#666',
                        textAlign: 'justify',
                      }}
                    />
                  </div>
                )}

                {/* Featured Badge */}
                {speaker.is_featured && (
                  <div className="mt-4">
                    <span
                      className="badge bg-warning text-dark"
                      style={{
                        fontSize: '1rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '25px',
                      }}
                    >
                      <i className="icofont-star me-2"></i>
                      Featured Speaker
                    </span>
                  </div>
                )}

                {/* Contact CTA */}
                <div className="speaker-cta mt-5">
                  <div
                    className="cta-card"
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      padding: '2rem',
                      borderRadius: '15px',
                      textAlign: 'center',
                    }}
                  >
                    <i className="icofont-email" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                    <h4 style={{ color: 'white', marginBottom: '1rem' }}>Interested in connecting?</h4>
                    <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1.5rem' }}>
                      Reach out to {speaker.name.split(' ')[0]} through their social media profiles above.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .speaker-profile-card {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 100px;
        }

        .profile-image-wrapper {
          position: relative;
          overflow: hidden;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .speaker-bio-section {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .bio-content :global(p) {
          margin-bottom: 1.2rem;
        }

        .bio-content :global(strong) {
          color: #333;
          font-weight: 600;
        }

        .bio-content :global(ul),
        .bio-content :global(ol) {
          padding-left: 2rem;
          margin-bottom: 1.2rem;
        }

        .bio-content :global(li) {
          margin-bottom: 0.5rem;
        }

        @media (max-width: 991px) {
          .speaker-profile-card {
            position: static;
            margin-bottom: 2rem;
          }
        }

        @media (max-width: 768px) {
          .speaker-profile-card,
          .speaker-bio-section {
            padding: 1.5rem;
          }

          .social-links {
            flex-direction: column;
          }

          .social-links a {
            flex: 1 1 100% !important;
          }
        }
      `}</style>
    </>
  );
}
