// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - VENUE INFORMATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Venue details, location, and getting there information
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

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

const VenueInfo: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  async function fetchVenues() {
    try {
      const response = await fetch('/api/venues');
      const result = await response.json();

      if (result.success) {
        setVenues(result.data || []);
      } else {
        setError('Failed to load venues');
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('An error occurred while loading venues');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="venue-area ptb-120">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading venues...</p>
        </div>
      </div>
    );
  }

  if (error || venues.length === 0) {
    return (
      <div className="venue-area ptb-120">
        <div className="container">
          <div className="section-title">
            <span>Location</span>
            <h2>
              Conference <b>Venues</b>
            </h2>
            <div className="bar"></div>
          </div>

          <div className="text-center text-muted">
            <p>{error || 'No venues available at this time.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="venue-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Location</span>
          <h2>
            Conference <b>Venues</b>
          </h2>
          <div className="bar"></div>
          </div>

        {venues.map((venue, index) => (
          <div key={venue.id} className="mb-5">
            {/* Main Venue Section */}
            <div className="row align-items-center mb-4" data-aos="fade-up">
              <div className="col-lg-6">
                <div className="venue-image-wrapper">
                  {venue.image_url ? (
                    <Image
                      src={venue.image_url}
                      alt={venue.name}
                      width={800}
                      height={600}
                      className="venue-image"
                    />
                  ) : (
                    <div
                      className="venue-placeholder"
                      style={{
                        width: '100%',
                        height: '400px',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i
                        className="icofont-building-alt"
                        style={{ fontSize: '4rem', color: '#ccc' }}
                      ></i>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-lg-6">
                <div className="venue-content">
                  <h3>{venue.name}</h3>
                  <div className="venue-details">
                    {venue.address && (
                      <div className="detail-item">
                        <i className="icofont-location-pin"></i>
                        <div>
                          <strong>Address</strong>
                          <p>{venue.address}</p>
                          {venue.city && <p className="text-muted">{venue.city}, {venue.country}</p>}
                        </div>
                      </div>
                    )}
                    {venue.capacity && (
                      <div className="detail-item">
                        <i className="icofont-users-alt-4"></i>
                        <div>
                          <strong>Capacity</strong>
                          <p>{venue.capacity}+ attendees</p>
                        </div>
                      </div>
                    )}
                    {venue.phone && (
                      <div className="detail-item">
                        <i className="icofont-phone"></i>
                        <div>
                          <strong>Phone</strong>
                          <p>{venue.phone}</p>
                        </div>
                      </div>
                    )}
                    {venue.website_url && (
                      <div className="detail-item">
                        <i className="icofont-link"></i>
                        <div>
                          <strong>Website</strong>
                          <p>
                            <a
                              href={venue.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              Visit website <i className="icofont-external-link"></i>
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/venue/${venue.slug}`}
                    className="btn btn-primary mt-3"
                  >
                    View Full Details <i className="icofont-double-right"></i>
                  </Link>
                </div>
              </div>
            </div>

            {/* Description */}
            {venue.description && (
              <div className="mb-4" data-aos="fade-up">
                <div
                  className="venue-description"
                  dangerouslySetInnerHTML={{ __html: venue.description }}
                />
              </div>
            )}

            {index < venues.length - 1 && <hr className="my-5" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueInfo;
