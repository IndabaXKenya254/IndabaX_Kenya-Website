// ═══════════════════════════════════════════════════════════════════════
// NOAI - GALLERY GRID COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Photo gallery filtered by NOAI category
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import ImageModal from "@/components/Gallery/ImageModal";
import type { Photo, ApiSuccessResponse } from "@/types/api";
import { getOptimizedImageUrl, getBlurDataURL, shouldLazyLoad } from "@/lib/image-utils";

interface NOAIGalleryGridProps {
  showYearFilter?: boolean;
}

const NOAIGalleryGrid: React.FC<NOAIGalleryGridProps> = ({
  showYearFilter = true,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch photos from API filtered by NOAI category
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch photos filtered by NOAI category
        const response = await fetch('/api/gallery?category=NOAI&limit=200');

        if (!response.ok) {
          throw new Error('Failed to fetch gallery photos');
        }

        const result: ApiSuccessResponse<Photo[]> = await response.json();
        // Already filtered by category on the backend
        setPhotos(result.data);
      } catch (err) {
        console.error('Error fetching NOAI gallery:', err);
        setError(err instanceof Error ? err.message : 'Failed to load gallery');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  // Extract unique years (year is now a number in the Photo type)
  const allYears = useMemo(() => {
    const uniqueYears = Array.from(new Set(photos.map((p) => p.year))).sort(
      (a, b) => b - a // Sort descending (newest first) - years are numbers now
    );
    return ["All", ...uniqueYears.map(String)]; // Convert to strings for display
  }, [photos]);

  // Filter photos and limit to 6
  const filteredPhotos = useMemo(() => {
    const filtered = photos.filter((photo) => {
      // Year can be string or number, compare as strings
      const matchesYear = selectedYear === "All" || String(photo.year) === selectedYear;
      return matchesYear;
    });
    // Limit to 6 images for display
    return filtered.slice(0, 6);
  }, [photos, selectedYear]);

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
    const currentIndex = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % filteredPhotos.length;
    setSelectedPhoto(filteredPhotos[nextIndex]);
  };

  const goToPrev = () => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
    const prevIndex =
      currentIndex === 0 ? filteredPhotos.length - 1 : currentIndex - 1;
    setSelectedPhoto(filteredPhotos[prevIndex]);
  };

  return (
    <div className="noai-gallery-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Memories</span>
          <h2>
            NOAI <b>Gallery</b>
          </h2>
          <div className="bar"></div>
        </div>

        {/* Filters */}
        {showYearFilter && allYears.length > 1 && (
          <div className="gallery-filters" data-aos="fade-up">
            <div className="row align-items-center">
              <div className="col-lg-6 col-md-12">
                <div className="filter-group">
                  <label htmlFor="year">
                    <i className="icofont-calendar"></i> Year
                  </label>
                  <select
                    id="year"
                    className="form-control"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {allYears.map((year) => (
                      <option key={year} value={year}>
                        {year === "All" ? "All Years" : year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="filter-results">
              <p>
                Showing <strong>{filteredPhotos.length}</strong> recent photos
                {selectedYear !== "All" && ` from ${selectedYear}`}
              </p>
              {selectedYear !== "All" && (
                <button
                  className="btn btn-text"
                  onClick={() => setSelectedYear("All")}
                >
                  <i className="icofont-close-circled"></i> Clear Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5" data-aos="fade-up">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading photos...</span>
            </div>
            <p className="mt-3">Loading NOAI gallery...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning"></i> {error}
          </div>
        )}

        {/* Photo Grid */}
        {!loading && !error && filteredPhotos.length > 0 ? (
          <div className="row">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="col-lg-4 col-md-6"
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay={index * 50}
              >
                <div
                  className="gallery-item"
                  onClick={() => openModal(photo)}
                >
                  <div className="gallery-image-wrapper">
                    {photo.media_type === 'video' ? (
                      <div className="video-thumbnail-wrapper" style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#000' }}>
                        <video
                          src={photo.image_url}
                          className="gallery-image"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="video-indicator" style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          borderRadius: '50%',
                          width: '80px',
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none'
                        }}>
                          <i className="icofont-ui-play" style={{ fontSize: '40px', color: 'white', marginLeft: '5px' }}></i>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={photo.thumbnail_url || photo.image_url}
                        alt={photo.caption || 'NOAI Gallery photo'}
                        width={600}
                        height={400}
                        loading={shouldLazyLoad(index, 6) ? "lazy" : "eager"}
                        placeholder="blur"
                        blurDataURL={getBlurDataURL(10, 7)}
                        className="gallery-image"
                      />
                    )}
                    <div className="gallery-overlay">
                      <div className="overlay-content">
                        <i className={photo.media_type === 'video' ? 'icofont-ui-play' : 'icofont-eye'}></i>
                        <h4>{photo.caption || (photo.media_type === 'video' ? 'NOAI Video' : 'NOAI Photo')}</h4>
                        <p>{photo.year}</p>
                      </div>
                    </div>
                  </div>
                  <div className="gallery-info">
                    <div className="info-left">
                      <h5>{photo.caption || 'NOAI Photo'}</h5>
                      <div className="meta">
                        <span className="year">{photo.year}</span>
                        <span className="category">NOAI</span>
                      </div>
                    </div>
                    <div className="info-right">
                      <button className="view-btn" aria-label="View photo">
                        <i className="icofont-eye"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="no-results" data-aos="fade-up">
            <div className="no-results-content">
              <i className="icofont-image"></i>
              <h3>No NOAI photos yet</h3>
              <p>
                Photos from Kenya&apos;s IOAI participation will be added soon.
                Check back later or visit our main gallery for other IndabaX photos.
              </p>
              <a href="/gallery" className="btn btn-primary">
                View Main Gallery
              </a>
            </div>
          </div>
        ) : null}

        {/* External Photos Link */}
        <div className="external-gallery-link" data-aos="fade-up">
          <div className="link-card">
            <i className="icofont-google-drive"></i>
            <div className="link-content">
              <h4>More Photos on Google Drive</h4>
              <p>View the complete collection of NOAI photos from our team&apos;s journey.</p>
              <a
                href="https://drive.google.com/drive/folders/1CIDYwzR4yUSEReegFzk-gUS0972uBMQW?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary"
              >
                Open Google Drive <i className="icofont-external-link"></i>
              </a>
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
    </div>
  );
};

export default NOAIGalleryGrid;
