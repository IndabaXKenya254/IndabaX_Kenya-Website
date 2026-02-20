// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - VENUE DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════
// Individual venue details with enhanced modern UI
// ═══════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Layouts/Navbar";
import PageBanner from "@/components/Common/PageBanner";
import Footer from "@/components/Layouts/Footer";
import Image from "next/image";

interface Venue {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  city?: string | null;
  country: string;
  description?: string | null;
  facilities?: string | null;
  getting_there?: string | null;
  nearby_amenities?: string | null;
  capacity?: number | null;
  image_url?: string | null;
  map_embed_url?: string | null;
  map_latitude?: number | null;
  map_longitude?: number | null;
  website_url?: string | null;
  phone?: string | null;
  email?: string | null;
  display_order: number;
}

export default function VenueDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (slug) {
      fetchVenue();
    }
  }, [slug]);

  async function fetchVenue() {
    try {
      const response = await fetch(`/api/venues/${slug}`);
      const result = await response.json();

      if (result.success) {
        setVenue(result.data);
      } else {
        setError(result.error || 'Venue not found');
      }
    } catch (err) {
      console.error('Error fetching venue:', err);
      setError('An error occurred while loading venue details');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="ptb-120">
          <div className="container text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading venue details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !venue) {
    return (
      <>
        <Navbar />
        <PageBanner
          pageTitle="Venue Not Found"
          shortText={error || "The venue you are looking for could not be found."}
          homePageUrl="/"
          homePageText="Home"
          activePageText="Venue"
          bgImg="/images/main-bg1.jpg"
        />
        <div className="ptb-120">
          <div className="container text-center">
            <h3 className="mb-4">Venue Not Found</h3>
            <p className="text-muted mb-4">{error || 'The venue you are looking for does not exist.'}</p>
            <a href="/venue" className="btn btn-primary">
              <i className="icofont-arrow-left me-2"></i>
              Back to Venues
            </a>
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
        pageTitle={venue.name}
        shortText={`${venue.city}, ${venue.country}`}
        homePageUrl="/"
        homePageText="Home"
        activePageText="Venue"
        bgImg={venue.image_url || "/images/main-bg1.jpg"}
      />

      <div className="venue-details-area ptb-120 bg-f9f9f9">
        <div className="container">
          {/* Venue Hero Section */}
          <div className="row mb-5">
            <div className="col-lg-8">
              <div className="venue-hero-image" data-aos="fade-up">
                {venue.image_url ? (
                  <Image
                    src={venue.image_url}
                    alt={venue.name}
                    width={1200}
                    height={600}
                    className="rounded shadow-lg"
                    style={{ width: '100%', height: 'auto', objectFit: 'cover', maxHeight: '500px' }}
                  />
                ) : (
                  <div
                    className="venue-placeholder rounded shadow-lg d-flex align-items-center justify-content-center bg-light"
                    style={{ height: '400px' }}
                  >
                    <i className="icofont-building-alt" style={{ fontSize: '5rem', color: '#ddd' }}></i>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              {/* Quick Info Card */}
              <div className="card shadow-sm border-0 mb-4" data-aos="fade-up" data-aos-delay="100">
                <div className="card-body p-4">
                  <h5 className="card-title mb-4 fw-bold">
                    <i className="icofont-info-circle text-primary me-2"></i>
                    Quick Info
                  </h5>

                  {venue.address && (
                    <div className="info-item mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <i className="icofont-location-pin text-primary me-3 mt-1" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                          <small className="text-muted d-block">Location</small>
                          <strong>{venue.address}</strong>
                          <div className="text-muted small">{venue.city}, {venue.country}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {venue.capacity && (
                    <div className="info-item mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <i className="icofont-users-alt-4 text-primary me-3 mt-1" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                          <small className="text-muted d-block">Capacity</small>
                          <strong>{venue.capacity}+ attendees</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {venue.phone && (
                    <div className="info-item mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <i className="icofont-phone text-primary me-3 mt-1" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                          <small className="text-muted d-block">Phone</small>
                          <strong>{venue.phone}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {venue.email && (
                    <div className="info-item mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <i className="icofont-email text-primary me-3 mt-1" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                          <small className="text-muted d-block">Email</small>
                          <strong className="text-break">{venue.email}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {venue.website_url && (
                    <div className="info-item">
                      <a
                        href={venue.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary w-100"
                      >
                        <i className="icofont-external-link me-2"></i>
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About Section - Full Width */}
          {venue.description && (
            <div className="row mb-5">
              <div className="col-12">
                <div className="card shadow-sm border-0" data-aos="fade-up">
                  <div className="card-body p-4">
                    <h3 className="mb-3 fw-bold" style={{ fontSize: '1.25rem', color: '#2d3748' }}>
                      <i className="icofont-building-alt text-primary me-2"></i>
                      About the Venue
                    </h3>
                    <div
                      className="venue-content"
                      dangerouslySetInnerHTML={{ __html: venue.description }}
                      style={{ fontSize: '0.95rem', lineHeight: '1.4' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Facilities, Nearby Amenities, and Getting There - Flex Row */}
          <div className="venue-info-cards mb-5" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Facilities Section */}
            {venue.facilities && (
              <div className="venue-info-card" style={{ flex: '1 1 calc(33.333% - 1rem)', minWidth: '300px' }} data-aos="fade-up">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body p-4">
                    <h3 className="mb-3 fw-bold" style={{ fontSize: '1.25rem', color: '#2d3748' }}>
                      <i className="icofont-check-circled text-primary me-2"></i>
                      Facilities & Amenities
                    </h3>
                    <div
                      className="venue-content facilities-list"
                      dangerouslySetInnerHTML={{ __html: venue.facilities }}
                      style={{ fontSize: '0.95rem', lineHeight: '1.4' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nearby Amenities Section */}
            {venue.nearby_amenities && (
              <div className="venue-info-card" style={{ flex: '1 1 calc(33.333% - 1rem)', minWidth: '300px' }} data-aos="fade-up" data-aos-delay="100">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body p-4">
                    <h3 className="mb-3 fw-bold" style={{ fontSize: '1.25rem', color: '#2d3748' }}>
                      <i className="icofont-map-pins text-primary me-2"></i>
                      Nearby Amenities
                    </h3>
                    <div
                      className="venue-content amenities-grid"
                      dangerouslySetInnerHTML={{ __html: venue.nearby_amenities }}
                      style={{ fontSize: '0.95rem', lineHeight: '1.4' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Getting There Section */}
            {venue.getting_there && (
              <div className="venue-info-card" style={{ flex: '1 1 calc(33.333% - 1rem)', minWidth: '300px' }} data-aos="fade-up" data-aos-delay="200">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body p-4">
                    <h3 className="mb-3 fw-bold" style={{ fontSize: '1.25rem', color: '#2d3748' }}>
                      <i className="icofont-direction-sign text-primary me-2"></i>
                      How to Get There
                    </h3>
                    <div
                      className="venue-content getting-there-content"
                      dangerouslySetInnerHTML={{ __html: venue.getting_there }}
                      style={{ fontSize: '0.95rem', lineHeight: '1.4' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Section */}
          {venue.map_embed_url && (
            <div className="row">
              <div className="col-12">
                <div className="card shadow-sm border-0" data-aos="fade-up">
                  <div className="card-body p-0">
                    <div className="p-4 pb-0">
                      <h3 className="mb-3 fw-bold">
                        <i className="icofont-map text-primary me-2"></i>
                        Location Map
                      </h3>
                      <p className="text-muted mb-4">
                        <i className="icofont-info-circle me-2"></i>
                        Click the map to open in Google Maps for directions
                      </p>
                    </div>
                    <div className="map-wrapper" style={{ height: '500px', width: '100%' }}>
                      <iframe
                        src={venue.map_embed_url}
                        width="100%"
                        height="500"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="row mt-5">
            <div className="col-12 text-center" data-aos="fade-up">
              <a href="/venue" className="btn btn-outline-primary btn-lg">
                <i className="icofont-arrow-left me-2"></i>
                View All Venues
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        /* Venue info cards layout */
        .venue-info-cards {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .venue-info-card {
          flex: 1 1 calc(33.333% - 1rem);
          min-width: 300px;
        }
        @media (max-width: 992px) {
          .venue-info-card {
            flex: 1 1 100%;
          }
        }

        /* Lists in narrow cards - single column */
        .venue-info-card .venue-content :global(ul) {
          list-style: none;
          padding-left: 0;
        }
        .venue-info-card .venue-content :global(ul li) {
          padding: 0.3rem 0;
          padding-left: 1.75rem;
          position: relative;
          line-height: 1.4;
        }
        .venue-info-card .venue-content :global(ul li:before) {
          content: "✓";
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
          font-size: 1rem;
        }

        /* General venue content styles */
        .venue-content :global(h3) {
          color: #1a202c;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.3;
        }
        .venue-content :global(h4) {
          color: #2d3748;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.3;
        }
        .venue-content :global(strong) {
          font-weight: 700;
          color: #1a202c;
        }
        .venue-content :global(p) {
          margin-bottom: 0.65rem;
          color: #2d3748;
          line-height: 1.4;
        }

        /* Getting There section - 2 column layout */
        .getting-there-content :global(ul) {
          list-style: none;
          padding-left: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem 2rem;
        }
        .getting-there-content :global(ul li) {
          padding: 0.3rem 0;
          padding-left: 2rem;
          position: relative;
          flex: 0 0 calc(50% - 1rem);
          min-width: 250px;
          line-height: 1.4;
        }
        @media (max-width: 768px) {
          .getting-there-content :global(ul li) {
            flex: 0 0 100%;
          }
        }
        .getting-there-content :global(ul li:before) {
          content: "✓";
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
          font-size: 1.1rem;
        }
      `}</style>
    </>
  );
}
