// ═══════════════════════════════════════════════════════════════════════
// NOAI - IOAI 2026 DETAILS COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Abu Dhabi 2026 event information
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";
import Link from "next/link";

const IOAI2026Details: React.FC = () => {
  return (
    <div className="ioai-2026-section ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>Upcoming Event</span>
          <h2>
            IOAI <b>2026</b>
          </h2>
          <div className="bar"></div>
        </div>

        <div className="row">
          <div className="col-lg-8 col-md-12">
            <div className="event-details" data-aos="fade-right">
              <div className="event-header">
                <div className="edition-badge">3rd Edition</div>
                <h3>International Olympiad in Artificial Intelligence</h3>
              </div>

              <div className="event-info-grid">
                <div className="info-card">
                  <div className="info-icon">
                    <i className="icofont-location-pin"></i>
                  </div>
                  <div className="info-content">
                    <h4>Location</h4>
                    <p>Abu Dhabi, United Arab Emirates</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <i className="icofont-calendar"></i>
                  </div>
                  <div className="info-content">
                    <h4>Dates</h4>
                    <p>August 2-8, 2026</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <i className="icofont-users-alt-4"></i>
                  </div>
                  <div className="info-content">
                    <h4>Team Size</h4>
                    <p>4 High School Students</p>
                  </div>
                </div>
              </div>

              <div className="event-description">
                <h4>About the Event</h4>
                <p>
                  The third edition of the International Olympiad in Artificial
                  Intelligence will take place in Abu Dhabi, United Arab Emirates,
                  in 2026 from 2nd until 8th of August 2026.
                </p>
                <p>
                  <strong>Elimika Research Institute</strong> and{" "}
                  <strong>IndabaX Kenya</strong> will be participating by taking
                  Four (4) high school students to the conference to showcase their
                  AI skills.
                </p>
              </div>

              <div className="selection-process">
                <h4>Selection Process</h4>
                <p>
                  To ensure we give an equal opportunity to all students, we have
                  opened this call for students to apply for participation. Your
                  application will be screened by a board of reviewers and if you
                  qualify we will get back to you with the next steps.
                </p>
              </div>

              {/* Issue #40 FIX: Apply Now CTA and deadline removed per client request */}
            </div>
          </div>

          <div className="col-lg-4 col-md-12">
            <div className="event-sidebar" data-aos="fade-left">
              {/* Event Card */}
              <div className="sidebar-card event-summary-card">
                <div className="card-header">
                  <span className="ioai-badge">IOAI 2026</span>
                </div>
                <div className="card-body">
                  <ul className="event-list">
                    <li>
                      <i className="icofont-location-pin"></i>
                      <span>Abu Dhabi, UAE</span>
                    </li>
                    <li>
                      <i className="icofont-calendar"></i>
                      <span>Aug 2-8, 2026</span>
                    </li>
                    <li>
                      <i className="icofont-users-alt-4"></i>
                      <span>4 High School Students</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact Card */}
              <div className="sidebar-card contact-card">
                <h4>
                  <i className="icofont-question-circle"></i> Questions?
                </h4>
                <p>Have questions about the application process?</p>
                <a href="mailto:abigail@deeplearningindaba.com" className="contact-link">
                  <i className="icofont-email"></i>
                  abigail@deeplearningindaba.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOAI2026Details;
