// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SPEAKER FLIP CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// 3D flip card effect for speakers with front (photo) and back (bio)
// Shows year badge for previous year speakers
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Speaker } from "@/types/api";
import { getOptimizedImageUrl, getBlurDataURL, shouldLazyLoad } from "@/lib/image-utils";

const CURRENT_YEAR = new Date().getFullYear();

interface SpeakerFlipCardProps {
  speaker: Speaker;
  index: number;
}

const SpeakerFlipCard: React.FC<SpeakerFlipCardProps> = ({ speaker, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Check if speaker is "previous" (force_previous=true OR year < current)
  const isPreviousSpeaker = speaker.force_previous === true ||
    (speaker.speaker_year !== null && speaker.speaker_year < CURRENT_YEAR);

  return (
    <div
      className="col-lg-3 col-md-4 col-sm-6"
      data-aos="fade-up"
      data-aos-duration="1000"
      data-aos-delay={index * 50}
    >
      <div
        className={`speaker-flip-card ${isFlipped ? "flipped" : ""}`}
        onClick={handleFlip}
      >
        <div className="flip-card-inner">
          {/* Front of card */}
          <div className="flip-card-front">
            <div className="speaker-image-wrapper">
              {speaker.photo_url && (
                <Image
                  src={getOptimizedImageUrl(speaker.photo_url, { width: 400, height: 400, quality: 85 })}
                  alt={speaker.name}
                  width={400}
                  height={400}
                  loading={shouldLazyLoad(index, 8) ? "lazy" : "eager"}
                  placeholder="blur"
                  blurDataURL={getBlurDataURL(10, 10)}
                  className="speaker-image"
                />
              )}
              {/* Year Badge - REMOVED per client feedback #7 */}
              {/* Client wants NO year badges on speaker cards */}
              <div className="speaker-overlay">
                <div className="flip-hint">
                  <i className="icofont-info-circle"></i>
                  <span>Click to learn more</span>
                </div>
              </div>
            </div>
            <div className="speaker-info">
              <h3 className="speaker-name">{speaker.name}</h3>
              {speaker.title && <p className="speaker-title">{speaker.title}</p>}
              {speaker.organization && <p className="speaker-org">{speaker.organization}</p>}
            </div>
          </div>

          {/* Back of card */}
          <div className="flip-card-back">
            <div className="back-content">
              <div className="back-header">
                <h3 className="speaker-name">{speaker.name}</h3>
                <button
                  className="flip-back-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFlip();
                  }}
                  aria-label="Flip back"
                >
                  <i className="icofont-close"></i>
                </button>
              </div>

              {speaker.bio_short && (
                <div
                  className="speaker-bio"
                  dangerouslySetInnerHTML={{ __html: speaker.bio_short }}
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: '#333',
                    marginBottom: '1rem',
                  }}
                />
              )}

              <div className="speaker-actions">
                {speaker.linkedin_url && (
                  <Link
                    href={speaker.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkedin-btn"
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginBottom: '0.75rem', display: 'block' }}
                  >
                    <i className="icofont-linkedin"></i>
                    Connect on LinkedIn
                  </Link>
                )}
                <Link
                  href={`/speakers/${speaker.id}`}
                  className="detail-btn"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    borderRadius: '25px',
                    textDecoration: 'none',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <i className="icofont-info-circle"></i>
                  View Full Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerFlipCard;
