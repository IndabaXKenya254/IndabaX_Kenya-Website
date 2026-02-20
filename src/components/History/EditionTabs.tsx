// ═══════════════════════════════════════════════════════════════════════
// CLIENT COMPONENT - Interactive Year Tab Selection
// ═══════════════════════════════════════════════════════════════════════
// Handles the year tab selection and displays edition content
// Receives pre-fetched data from server component
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Event, Photo } from "@/types/api";
import { getOptimizedImageUrl, getBlurDataURL } from "@/lib/image-utils";

interface EditionData {
  year: number;
  event: Event | null;
  photos: Photo[];
  highlights: {
    attendees?: number;
    speakers?: number;
    workshops?: number;
    countries?: number;
  };
}

interface EditionTabsProps {
  editions: EditionData[];
  initialYear?: number;
}

const EditionTabs: React.FC<EditionTabsProps> = ({ editions, initialYear }) => {
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear || (editions.length > 0 ? editions[0].year : 0)
  );

  const formatDate = (dateString: string, endDateString?: string) => {
    const startDate = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };

    if (endDateString) {
      const endDate = new Date(endDateString);
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString("en-US", { month: "long" })} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
      }
      return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
    }

    return startDate.toLocaleDateString("en-US", options);
  };

  const selectedEdition = editions.find(e => e.year === selectedYear);

  if (editions.length === 0) {
    return (
      <div className="no-editions text-center py-5">
        <i className="icofont-history" style={{ fontSize: '64px', color: '#ddd' }}></i>
        <h3 className="mt-3">No Previous Editions</h3>
        <p className="text-muted">
          Check back after our upcoming event for highlights and photos!
        </p>
        <Link href="/events" className="btn btn-primary mt-3">
          View Upcoming Events
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Year Tabs */}
      <div className="edition-tabs" data-aos="fade-up">
        {editions.map((edition) => (
          <button
            key={edition.year}
            className={`edition-tab ${selectedYear === edition.year ? 'active' : ''}`}
            onClick={() => setSelectedYear(edition.year)}
          >
            <span className="year">{edition.year}</span>
            {edition.event && (
              <span className="edition-name">{edition.event.edition || `Edition ${edition.year}`}</span>
            )}
          </button>
        ))}
      </div>

      {/* Selected Edition Content */}
      {selectedEdition && (
        <div className="edition-content" data-aos="fade-up">
          {/* Edition Header */}
          <div className="edition-header">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h3 className="edition-title">
                  IndabaX Kenya {selectedEdition.year}
                  {selectedEdition.event?.edition && (
                    <span className="badge bg-primary ms-2">{selectedEdition.event.edition}</span>
                  )}
                </h3>
                {selectedEdition.event && (
                  <>
                    <p className="edition-date">
                      <i className="icofont-calendar"></i>
                      {formatDate(
                        selectedEdition.event.start_date,
                        selectedEdition.event.end_date || undefined
                      )}
                    </p>
                    {selectedEdition.event.location && (
                      <p className="edition-location">
                        <i className="icofont-location-pin"></i>
                        {selectedEdition.event.location}
                        {selectedEdition.event.venue && ` - ${selectedEdition.event.venue}`}
                      </p>
                    )}
                    {selectedEdition.event.theme && (
                      <p className="edition-theme">
                        <i className="icofont-quote-left"></i>
                        <em>{selectedEdition.event.theme}</em>
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="col-lg-4 text-lg-end">
                {selectedEdition.event && (
                  <Link
                    href={`/events/${selectedEdition.event.slug}`}
                    className="btn btn-outline-primary me-2 mb-2"
                  >
                    View Full Details <i className="icofont-arrow-right"></i>
                  </Link>
                )}
                {/* External link for 2024 DKUT Awards info */}
                {selectedEdition.year === 2024 && (
                  <a
                    href="https://www.dkut.ac.ke/index.php/deep-learning-indabax-awards-2024"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary mb-2"
                  >
                    <i className="icofont-trophy me-2"></i>
                    Awards & Highlights
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Edition Description */}
          {selectedEdition.event?.description && (
            <div className="edition-description">
              <div
                dangerouslySetInnerHTML={{
                  __html: selectedEdition.event.description.substring(0, 500) +
                          (selectedEdition.event.description.length > 500 ? '...' : '')
                }}
              />
            </div>
          )}

          {/* Stats/Highlights */}
          {(selectedEdition.highlights.attendees ||
            selectedEdition.highlights.speakers ||
            selectedEdition.highlights.workshops) && (
            <div className="edition-stats">
              <div className="row">
                {selectedEdition.highlights.attendees && (
                  <div className="col-md-3 col-6">
                    <div className="stat-item">
                      <i className="icofont-users-alt-4"></i>
                      <span className="stat-number">{selectedEdition.highlights.attendees}+</span>
                      <span className="stat-label">Attendees</span>
                    </div>
                  </div>
                )}
                {selectedEdition.highlights.speakers && (
                  <div className="col-md-3 col-6">
                    <div className="stat-item">
                      <i className="icofont-microphone"></i>
                      <span className="stat-number">{selectedEdition.highlights.speakers}+</span>
                      <span className="stat-label">Speakers</span>
                    </div>
                  </div>
                )}
                {selectedEdition.highlights.workshops && (
                  <div className="col-md-3 col-6">
                    <div className="stat-item">
                      <i className="icofont-code-alt"></i>
                      <span className="stat-number">{selectedEdition.highlights.workshops}+</span>
                      <span className="stat-label">Workshops</span>
                    </div>
                  </div>
                )}
                {selectedEdition.highlights.countries && (
                  <div className="col-md-3 col-6">
                    <div className="stat-item">
                      <i className="icofont-globe"></i>
                      <span className="stat-number">{selectedEdition.highlights.countries}+</span>
                      <span className="stat-label">Countries</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {selectedEdition.photos.length > 0 && (
            <div className="edition-gallery">
              <h4>
                <i className="icofont-camera"></i> Photos from {selectedEdition.year}
              </h4>
              <div className="row">
                {selectedEdition.photos.map((photo) => (
                  <div key={photo.id} className="col-lg-4 col-md-6 col-6">
                    <div className="gallery-thumb">
                      <Image
                        src={getOptimizedImageUrl(photo.thumbnail_url || photo.image_url, { width: 400, quality: 80 })}
                        alt={photo.caption || `IndabaX Kenya ${selectedEdition.year}`}
                        width={400}
                        height={300}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={getBlurDataURL(10, 7)}
                        className="gallery-image"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <Link
                  href={`/gallery?year=${selectedEdition.year}`}
                  className="btn btn-primary"
                >
                  View All Photos from {selectedEdition.year}
                  <i className="icofont-arrow-right ms-2"></i>
                </Link>
              </div>
            </div>
          )}

          {/* No photos message */}
          {selectedEdition.photos.length === 0 && (
            <div className="no-photos text-center py-4">
              <i className="icofont-camera" style={{ fontSize: '48px', color: '#ddd' }}></i>
              <p className="text-muted mt-3">No photos available for this edition yet.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default EditionTabs;
