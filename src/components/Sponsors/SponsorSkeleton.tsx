// ═══════════════════════════════════════════════════════════════════════
// SPONSOR SKELETON LOADER
// ═══════════════════════════════════════════════════════════════════════
// Loading placeholder for sponsors while data is being fetched

import React from "react";

const SponsorSkeleton: React.FC = () => {
  // Show 8 skeleton cards (2 rows of 4)
  const skeletonCount = 8;

  return (
    <div className="sponsors-section" data-aos="fade-up">
      <div className="partner-title mb-4">
        <div className="skeleton skeleton-title" style={{ width: '250px' }}></div>
      </div>

      <div className="row justify-content-center">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className="col-lg-3 col-md-4 col-sm-6 col-6 mb-4"
          >
            <div className="sponsor-skeleton-card">
              <div className="sponsor-link">
                <div className="sponsor-logo-wrapper d-flex justify-content-center align-items-center" style={{ minHeight: '100px' }}>
                  {/* Logo skeleton */}
                  <div
                    className="skeleton skeleton-logo"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  ></div>
                </div>
                <div className="sponsor-info mt-3">
                  {/* Name skeleton */}
                  <div
                    className="skeleton skeleton-text mx-auto"
                    style={{
                      width: '120px',
                      animationDelay: `${index * 0.1}s`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SponsorSkeleton;
