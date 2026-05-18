// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SPONSOR CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Simple sponsor card matching SpeakerFlipCard pattern
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";
import type { Sponsor } from "@/types/api";

interface SponsorCardProps {
  sponsor: Sponsor;
  index: number;
}

const SponsorCard: React.FC<SponsorCardProps> = ({ sponsor, index }) => {
  return (
    <div className="col-lg-3 col-md-4 col-sm-6 mb-4">
      <div className="sponsor-card">
        <a
          href={sponsor.website_url || '#'}
          target={sponsor.website_url ? "_blank" : "_self"}
          rel={sponsor.website_url ? "noopener noreferrer" : undefined}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px',
            textDecoration: 'none',
            width: '100%'
          }}
        >
          <div className="sponsor-logo-wrapper">
            {sponsor.logo_url ? (
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="sponsor-logo"
                loading="lazy"
                style={{
                  maxWidth: '150px',
                  maxHeight: '80px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <div className="sponsor-placeholder">
                <i className="icofont-building"></i>
                <span>No Logo</span>
              </div>
            )}
          </div>
          <div className="sponsor-info">
            <h5 className="sponsor-name">{sponsor.name}</h5>
          </div>
        </a>
      </div>
    </div>
  );
};

export default SponsorCard;
