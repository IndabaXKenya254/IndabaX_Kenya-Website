// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - IMAGE MODAL (LIGHTBOX) COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Full-screen image viewer with download functionality
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import type { Photo } from "@/types/api";
import { getCacheBustedUrl } from "@/lib/image-utils";

interface ImageModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  photo,
  isOpen,
  onClose,
  onNext,
  onPrev,
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Navigation with arrow keys
  useEffect(() => {
    const handleArrows = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && onNext) {
        onNext();
      } else if (e.key === "ArrowLeft" && onPrev) {
        onPrev();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleArrows);
    }

    return () => {
      document.removeEventListener("keydown", handleArrows);
    };
  }, [isOpen, onNext, onPrev]);

  if (!isOpen || !photo) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(photo.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = photo.media_type === 'video' ? 'mp4' : 'jpg';
      link.download = `indabax-kenya-${photo.year}-${photo.id}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div
        className="image-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="icofont-close"></i>
        </button>

        {/* Previous Button */}
        {onPrev && (
          <button
            className="modal-nav-btn modal-prev-btn"
            onClick={onPrev}
            aria-label="Previous image"
          >
            <i className="icofont-rounded-left"></i>
          </button>
        )}

        {/* Next Button */}
        {onNext && (
          <button
            className="modal-nav-btn modal-next-btn"
            onClick={onNext}
            aria-label="Next image"
          >
            <i className="icofont-rounded-right"></i>
          </button>
        )}

        {/* Image/Video Container */}
        <div className="modal-image-wrapper">
          {photo.media_type === 'video' ? (
            <video
              src={photo.image_url}
              className="modal-image"
              controls
              autoPlay
              playsInline
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
            />
          ) : (
            <Image
              src={getCacheBustedUrl(photo.image_url, photo.created_at)}
              alt={photo.caption || 'Gallery photo'}
              width={1920}
              height={1080}
              className="modal-image"
              priority
            />
          )}
        </div>

        {/* Image Info */}
        <div className="modal-info">
          <div className="info-content">
            <div className="info-main">
              <h3>{photo.caption || (photo.media_type === 'video' ? 'Video' : 'Untitled')}</h3>
              {photo.photographer && <p className="photographer">{photo.media_type === 'video' ? 'Video' : 'Photo'} by {photo.photographer}</p>}
              <div className="meta">
                <span className="year">
                  <i className="icofont-calendar"></i> {photo.year}
                </span>
                {photo.event_name && (
                  <span className="event">
                    <i className="icofont-calendar"></i> {photo.event_name}
                  </span>
                )}
                {photo.media_type === 'video' && (
                  <span className="media-type">
                    <i className="icofont-ui-movie"></i> Video
                  </span>
                )}
              </div>
            </div>

            <div className="info-actions">
              <button
                className="btn btn-primary btn-download"
                onClick={handleDownload}
              >
                <i className="icofont-download"></i> Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
