// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT GALLERY SECTION
// ═══════════════════════════════════════════════════════════════════════
// Displays 6 spotlight images for an event with Google Drive link
// Clean image display without overlay labels
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import ImageModal from "@/components/Gallery/ImageModal";
import type { Photo, ApiSuccessResponse, EventDetail } from "@/types/api";
import { getBlurDataURL, shouldLazyLoad } from "@/lib/image-utils";

interface EventGallerySectionProps {
  eventId: string;
  galleryLink?: string; // Optional Google Drive link override
}

const EventGallerySection: React.FC<EventGallerySectionProps> = ({
  eventId,
  galleryLink: galleryLinkProp,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetail | null>(null);

  // Fetch event details and photos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch event details first
        const eventResponse = await fetch(`/api/events/${eventId}`);
        let eventData: EventDetail | null = null;

        if (eventResponse.ok) {
          const eventResult: ApiSuccessResponse<EventDetail> = await eventResponse.json();
          eventData = eventResult.data;
          setEventDetails(eventData);
        }

        // Only fetch photos if we have event data
        if (eventData?.id) {
          // Fetch photos by event UUID - limit to 6
          const url = `/api/gallery?limit=6&event_id=${eventData.id}`;
          const photosResponse = await fetch(url);

          if (photosResponse.ok) {
            const photosResult: ApiSuccessResponse<Photo[]> = await photosResponse.json();
            setPhotos(photosResult.data.slice(0, 6)); // Ensure max 6 photos
          }
        }
      } catch (err) {
        console.error("Error fetching event gallery:", err);
        setError(err instanceof Error ? err.message : "Failed to load gallery");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  // Use prop galleryLink or get from event details in database
  const galleryLink = galleryLinkProp || eventDetails?.gallery_link;

  const openModal = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  const goToNext = () => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % photos.length;
    setSelectedPhoto(photos[nextIndex]);
  };

  const goToPrev = () => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    setSelectedPhoto(photos[prevIndex]);
  };

  // Don't render if still loading or no event details
  if (loading || !eventDetails) {
    return null;
  }

  return (
    <div className="event-gallery-section ptb-80">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>Memories</span>
          <h2>
            Event <b>Gallery</b>
          </h2>
          <div className="bar"></div>
        </div>

        {/* Photo Grid - 6 Spotlight Images */}
        {photos.length > 0 && (
          <div className="row" data-aos="fade-up">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="col-lg-4 col-md-6 mb-4"
                data-aos="fade-up"
                data-aos-delay={index * 50}
              >
                <div
                  className="event-gallery-item"
                  onClick={() => openModal(photo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openModal(photo)}
                >
                  <div className="gallery-image-container">
                    {photo.media_type === "video" ? (
                      <div className="video-thumbnail">
                        <video
                          src={photo.image_url}
                          className="gallery-img"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="video-play-icon">
                          <i className="icofont-ui-play"></i>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={photo.thumbnail_url || photo.image_url}
                        alt={photo.caption || "Event photo"}
                        width={400}
                        height={300}
                        loading={shouldLazyLoad(index, 6) ? "lazy" : "eager"}
                        placeholder="blur"
                        blurDataURL={getBlurDataURL(10, 7)}
                        className="gallery-img"
                      />
                    )}
                    {/* Clean overlay - just view icon, no labels */}
                    <div className="gallery-hover-overlay">
                      <i
                        className={
                          photo.media_type === "video"
                            ? "icofont-ui-play"
                            : "icofont-eye"
                        }
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gallery Link - External (Google Drive) or Internal (/gallery) */}
        <div className="external-gallery-link mt-4" data-aos="fade-up">
          <div className="drive-link-card">
            <i className={galleryLink ? "icofont-google-drive" : "icofont-image"}></i>
            <div className="link-content">
              <h4>{galleryLink ? "More Photos on Google Drive" : "View Full Gallery"}</h4>
              <p>
                View the complete collection of photos from{" "}
                {eventDetails?.title || "this event"}.
              </p>
              {galleryLink ? (
                <a
                  href={galleryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary"
                >
                  Open Google Drive <i className="icofont-external-link"></i>
                </a>
              ) : (
                <a
                  href={`/gallery${eventDetails?.event_year ? `?year=${eventDetails.event_year}` : ''}`}
                  className="btn btn-primary"
                >
                  View All Photos <i className="icofont-arrow-right"></i>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={closeModal}
        onNext={goToNext}
        onPrev={goToPrev}
      />

      <style jsx>{`
        .event-gallery-section {
          background-color: #f8f9fa;
        }

        .event-gallery-item {
          cursor: pointer;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .event-gallery-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .gallery-image-container {
          position: relative;
          width: 100%;
          height: 250px;
          overflow: hidden;
        }

        .gallery-image-container :global(.gallery-img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .event-gallery-item:hover .gallery-image-container :global(.gallery-img) {
          transform: scale(1.05);
        }

        .video-thumbnail {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
        }

        .video-thumbnail video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .video-play-icon i {
          font-size: 24px;
          color: #fff;
          margin-left: 4px;
        }

        .gallery-hover-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .event-gallery-item:hover .gallery-hover-overlay {
          opacity: 1;
        }

        .gallery-hover-overlay i {
          font-size: 40px;
          color: #fff;
        }

        .drive-link-card {
          display: flex;
          align-items: center;
          gap: 24px;
          background: #fff;
          border-radius: 12px;
          padding: 24px 32px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          border: 1px solid #e9ecef;
        }

        .drive-link-card > i {
          font-size: 48px;
          color: #4285f4;
        }

        .link-content h4 {
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #212529;
        }

        .link-content p {
          margin: 0 0 16px 0;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .drive-link-card {
            flex-direction: column;
            text-align: center;
            padding: 20px;
          }

          .gallery-image-container {
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default EventGallerySection;
