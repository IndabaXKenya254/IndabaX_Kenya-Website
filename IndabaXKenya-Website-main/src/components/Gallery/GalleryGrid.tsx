// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - GALLERY GRID WITH INFINITE SCROLL
// ═══════════════════════════════════════════════════════════════════════
// Photo gallery with year filters, infinite scroll pagination, lightbox view
// Phase 4 Optimization (November 29, 2025):
// - Infinite scroll pagination (20 photos per page)
// - Lazy loading of images
// - Optimized API calls with pagination
// Expected Impact: 80-90% faster initial load for large galleries
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import ImageModal from "./ImageModal";
import type { Photo, ApiSuccessResponse } from "@/types/api";
import { getOptimizedImageUrl, getBlurDataURL, shouldLazyLoad, getCacheBustedUrl } from "@/lib/image-utils";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const GalleryGrid: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(""); // Will be set to latest year on load
  const [selectedEvent, setSelectedEvent] = useState<string>("All"); // Event filter
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch photos from API (excluding NOAI category)
  const fetchPhotos = useCallback(async (page: number, year?: string, event?: string, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const yearParam = year && year !== "All" ? `&year=${year}` : "";
      const eventParam = event && event !== "All" ? `&event_name=${encodeURIComponent(event)}` : "";
      // Exclude NOAI category photos from general gallery
      const response = await fetch(`/api/gallery?limit=20&page=${page}${yearParam}${eventParam}&exclude_category=NOAI`);

      if (!response.ok) {
        throw new Error('Failed to fetch gallery photos');
      }

      const result: ApiSuccessResponse<Photo[]> & { pagination: PaginationMeta; availableYears: number[]; availableEvents: string[] } = await response.json();

      if (append) {
        setPhotos(prev => [...prev, ...result.data]);
      } else {
        setPhotos(result.data);
      }

      setPagination(result.pagination);

      // Update available years from API (sorted descending - latest first)
      if (result.availableYears && result.availableYears.length > 0) {
        setAvailableYears(result.availableYears);
      }

      // Update available events from API
      if (result.availableEvents && result.availableEvents.length > 0) {
        setAvailableEvents(result.availableEvents);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch - load with latest year by default
  useEffect(() => {
    const initializeGallery = async () => {
      // First fetch to get available years and events
      const response = await fetch('/api/gallery?limit=1&exclude_category=NOAI');
      const result = await response.json();

      if (result.availableYears && result.availableYears.length > 0) {
        setAvailableYears(result.availableYears);
        // Default to latest year (first in sorted array)
        const latestYear = String(result.availableYears[0]);
        setSelectedYear(latestYear);
      } else {
        setSelectedYear("All");
      }

      if (result.availableEvents && result.availableEvents.length > 0) {
        setAvailableEvents(result.availableEvents);
      }

      setInitialized(true);
    };

    if (!initialized) {
      initializeGallery();
    }
  }, [initialized]);

  // Fetch photos when year or event changes (after initialization)
  useEffect(() => {
    if (initialized && selectedYear) {
      setCurrentPage(1);
      fetchPhotos(1, selectedYear, selectedEvent);
    }
  }, [selectedYear, selectedEvent, fetchPhotos, initialized]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && pagination?.hasNextPage && !loadingMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchPhotos(nextPage, selectedYear, selectedEvent, true);
        }
      },
      {
        root: null,
        rootMargin: '200px', // Load before user reaches bottom
        threshold: 0.1,
      }
    );

    const target = observerTarget.current; // Copy ref to variable
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [pagination, loadingMore, currentPage, selectedYear, selectedEvent, fetchPhotos]);

  // Year options for filter dropdown (from API)
  const yearOptions = useMemo(() => {
    return ["All", ...availableYears.map(String)];
  }, [availableYears]);

  // Event options for filter dropdown (from API)
  const eventOptions = useMemo(() => {
    return ["All", ...availableEvents];
  }, [availableEvents]);

  // Check if any filter is active
  const hasActiveFilters = selectedYear !== "All" || selectedEvent !== "All";

  // Clear all filters
  const clearFilters = () => {
    setSelectedYear("All");
    setSelectedEvent("All");
  };

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
    const prevIndex =
      currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    setSelectedPhoto(photos[prevIndex]);
  };

  return (
    <div className="gallery-grid-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Memories</span>
          <h2>
            Photo <b>Gallery</b>
          </h2>
          <div className="bar"></div>
          </div>

        {/* Filters */}
        <div className="gallery-filters" data-aos="fade-up">
          <div className="row align-items-center">
            <div className="col-lg-4 col-md-6 mb-3 mb-lg-0">
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
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year === "All" ? "All Years" : year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="filter-group">
                <label htmlFor="event">
                  <i className="icofont-ui-calendar"></i> Event
                </label>
                <select
                  id="event"
                  className="form-control"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  {eventOptions.map((event) => (
                    <option key={event} value={event}>
                      {event === "All" ? "All Events" : event}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results count */}
          {pagination && (
            <div className="filter-results">
              <p>
                Showing <strong>{photos.length}</strong> of{" "}
                <strong>{pagination.total}</strong> photos
                {pagination.hasNextPage && " (scroll for more)"}
              </p>
              {hasActiveFilters && (
                <button
                  className="btn btn-text"
                  onClick={clearFilters}
                >
                  <i className="icofont-close-circled"></i> Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading State (initial load only) */}
        {loading && (
          <div className="text-center py-5" data-aos="fade-up">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading photos...</span>
            </div>
            <p className="mt-3">Loading gallery...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning"></i> {error}
          </div>
        )}

        {/* Photo Grid */}
        {!loading && !error && photos.length > 0 ? (
          <>
            <div className="row">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="col-lg-4 col-md-6"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay={Math.min(index * 50, 500)} // Cap delay at 500ms
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
                          src={getCacheBustedUrl(photo.thumbnail_url || photo.image_url, photo.created_at)}
                          alt={photo.caption || 'Gallery photo'}
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
                          <h4>{photo.caption || (photo.media_type === 'video' ? 'Video' : 'Untitled')}</h4>
                          <p>{photo.year}</p>
                          {photo.event_name && (
                            <p className="event-label">
                              <i className="icofont-calendar"></i> {photo.event_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="gallery-info gallery-info-minimal">
                      <div className="info-left">
                        <span className="year">{photo.year}</span>
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

            {/* Infinite Scroll Observer Target */}
            <div ref={observerTarget} className="infinite-scroll-trigger" style={{ height: '20px' }} />

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading more photos...</span>
                </div>
                <p className="mt-2 text-muted">Loading more photos...</p>
              </div>
            )}

            {/* End of Results */}
            {!pagination?.hasNextPage && !loadingMore && photos.length > 0 && (
              <div className="text-center py-4">
                <p className="text-muted">
                  <i className="icofont-check-circled"></i> You&apos;ve reached the end of the gallery
                </p>
              </div>
            )}
          </>
        ) : !loading && !error && photos.length === 0 ? (
          <div className="text-center py-5" data-aos="fade-up">
            <h3>No photos found</h3>
            <p>Try adjusting your filter to find more photos.</p>
          </div>
        ) : null}
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={closeModal}
        photo={selectedPhoto}
        onNext={goToNext}
        onPrev={goToPrev}
      />
    </div>
  );
};

export default GalleryGrid;
