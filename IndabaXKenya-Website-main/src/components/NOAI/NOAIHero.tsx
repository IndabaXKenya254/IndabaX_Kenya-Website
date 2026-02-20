// ═══════════════════════════════════════════════════════════════════════
// NOAI - HERO SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Landing page hero with key stats and call-to-action
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";
import Link from "next/link";

const NOAIHero: React.FC = () => {
  return (
    <div className="noai-hero-section ptb-120">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7 col-md-12">
            <div className="hero-content" data-aos="fade-right">
              <span className="hero-badge">
                <i className="icofont-award"></i> Kenya&apos;s AI Olympiad
              </span>
              <h1>
                National Olympiad for{" "}
                <b>Artificial Intelligence</b>
              </h1>
              <p className="hero-description">
                NOAI is Kenya&apos;s pathway to the International Olympiad in Artificial
                Intelligence (IOAI). We select and prepare the brightest high school
                students to represent Kenya on the global AI stage.
              </p>

              <div className="hero-stats">
                <div className="stat-item" data-aos="fade-up" data-aos-delay="100">
                  <div className="stat-icon">
                    <i className="icofont-users-alt-4"></i>
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">4</span>
                    <span className="stat-label">Students Selected</span>
                  </div>
                </div>
                <div className="stat-item" data-aos="fade-up" data-aos-delay="200">
                  <div className="stat-icon">
                    <i className="icofont-calendar"></i>
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">Aug 2026</span>
                    <span className="stat-label">Next Competition</span>
                  </div>
                </div>
                <div className="stat-item" data-aos="fade-up" data-aos-delay="300">
                  <div className="stat-icon">
                    <i className="icofont-globe"></i>
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">Abu Dhabi</span>
                    <span className="stat-label">IOAI 2026 Location</span>
                  </div>
                </div>
              </div>

              {/* Issue #40 FIX: Apply Now CTA removed per client request */}
              <div className="hero-buttons" data-aos="fade-up" data-aos-delay="400">
                <Link href="/noai/ioai" className="btn btn-primary btn-lg">
                  Learn About IOAI <i className="icofont-arrow-right"></i>
                </Link>
                <Link href="/noai/kenya" className="btn btn-outline-primary btn-lg">
                  Kenya&apos;s Journey
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-5 col-md-12">
            <div className="hero-visual" data-aos="fade-left">
              <div className="visual-card main-card">
                <div className="card-header">
                  <span className="ioai-badge">IOAI</span>
                  <span className="year">2026</span>
                </div>
                <div className="card-body">
                  <h3>International Olympiad in AI</h3>
                  <ul className="feature-list">
                    <li>
                      <i className="icofont-check-circled"></i>
                      Machine Learning
                    </li>
                    <li>
                      <i className="icofont-check-circled"></i>
                      Computer Vision
                    </li>
                    <li>
                      <i className="icofont-check-circled"></i>
                      Natural Language Processing
                    </li>
                    <li>
                      <i className="icofont-check-circled"></i>
                      Robotic Motion Planning
                    </li>
                  </ul>
                </div>
                <div className="card-footer">
                  <span>
                    <i className="icofont-location-pin"></i> Abu Dhabi, UAE
                  </span>
                  <span>
                    <i className="icofont-calendar"></i> Aug 2-8, 2026
                  </span>
                </div>
              </div>

              <div className="floating-badge badge-1" data-aos="zoom-in" data-aos-delay="600">
                <i className="icofont-brain-alt"></i>
                <span>AI</span>
              </div>
              <div className="floating-badge badge-2" data-aos="zoom-in" data-aos-delay="700">
                <i className="icofont-code"></i>
                <span>ML</span>
              </div>
              <div className="floating-badge badge-3" data-aos="zoom-in" data-aos-delay="800">
                <i className="icofont-eye"></i>
                <span>CV</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links-section" data-aos="fade-up">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-sm-6">
              <Link href="/noai/ioai" className="quick-link-card">
                <i className="icofont-info-circle"></i>
                <h4>About IOAI</h4>
                <p>Learn about the international olympiad</p>
              </Link>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6">
              <Link href="/noai/kenya" className="quick-link-card">
                <i className="icofont-flag-alt-2"></i>
                <h4>Kenya&apos;s Journey</h4>
                <p>Our participation history</p>
              </Link>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6">
              <Link href="/noai/2026" className="quick-link-card">
                <i className="icofont-calendar"></i>
                <h4>IOAI 2026</h4>
                <p>Upcoming event details</p>
              </Link>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6">
              <Link href="/noai/gallery" className="quick-link-card">
                <i className="icofont-image"></i>
                <h4>Gallery</h4>
                <p>Photos from past events</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NOAIHero;
