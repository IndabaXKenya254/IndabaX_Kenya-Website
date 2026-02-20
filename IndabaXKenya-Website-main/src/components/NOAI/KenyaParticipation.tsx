// ═══════════════════════════════════════════════════════════════════════
// NOAI - KENYA PARTICIPATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Kenya's IOAI journey and 2025 Beijing participation
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";
import Link from "next/link";

const KenyaParticipation: React.FC = () => {
  return (
    <div className="kenya-participation-section ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>Our Journey</span>
          <h2>
            Kenya&apos;s <b>IOAI Participation</b>
          </h2>
          <div className="bar"></div>
        </div>

        <div className="row align-items-center">
          <div className="col-lg-6 col-md-12">
            <div className="participation-content" data-aos="fade-right">
              <div className="milestone-badge">
                <i className="icofont-flag-alt-2"></i>
                <span>First Participation: 2025</span>
              </div>

              <h3>Making History in Beijing</h3>
              <p className="lead">
                Kenya actively participated in the IOAI for the first time in 2025,
                sending a national team to compete on the international stage on
                August 2nd, 2025 in Beijing, China.
              </p>
              <p>
                The Kenyan delegation has demonstrated strong capabilities, with
                students from the country achieving commendable results in past
                editions. This active involvement is often supported by local
                academic institutions and national initiatives aimed at nurturing
                talent in STEM fields from a young age.
              </p>

              <div className="organizers-info">
                <h4>Organized By:</h4>
                <div className="organizer-cards">
                  <div className="organizer-card">
                    <i className="icofont-building"></i>
                    <span>Elimika Research Institute</span>
                  </div>
                  <div className="organizer-card">
                    <i className="icofont-users-alt-4"></i>
                    <span>IndabaX Kenya</span>
                  </div>
                </div>
              </div>

              <div className="cta-section">
                <Link href="/noai/gallery" className="btn btn-primary">
                  <i className="icofont-image"></i> View Gallery
                </Link>
                <Link href="/noai/apply" className="btn btn-outline-primary">
                  Join the Team <i className="icofont-arrow-right"></i>
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-12">
            <div className="participation-visual" data-aos="fade-left">
              <div className="event-highlight-card">
                <div className="card-header">
                  <span className="event-badge">IOAI 2025</span>
                  <span className="location-badge">
                    <i className="icofont-location-pin"></i> Beijing, China
                  </span>
                </div>

                <div className="card-body">
                  <div className="event-date">
                    <span className="day">2</span>
                    <span className="month">August</span>
                    <span className="year">2025</span>
                  </div>

                  <h4>Kenya&apos;s Debut</h4>
                  <p>
                    The first Kenyan team to represent the nation at the
                    International Olympiad in Artificial Intelligence.
                  </p>

                  <div className="achievement-badges">
                    <div className="achievement">
                      <i className="icofont-trophy"></i>
                      <span>Strong Performance</span>
                    </div>
                    <div className="achievement">
                      <i className="icofont-star"></i>
                      <span>Commendable Results</span>
                    </div>
                    <div className="achievement">
                      <i className="icofont-graduate"></i>
                      <span>STEM Excellence</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <p>
                    <i className="icofont-quote-left"></i>
                    Supported by local academic institutions and national
                    initiatives aimed at nurturing talent in STEM fields.
                    <i className="icofont-quote-right"></i>
                  </p>
                </div>
              </div>

              {/* Floating elements */}
              <div className="floating-element flag" data-aos="zoom-in" data-aos-delay="200">
                <span>🇰🇪</span>
              </div>
              <div className="floating-element ai" data-aos="zoom-in" data-aos-delay="300">
                <i className="icofont-brain-alt"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Future Goals */}
        <div className="future-goals" data-aos="fade-up">
          <div className="goals-wrapper">
            <h3>Looking Ahead</h3>
            <div className="row">
              <div className="col-md-4">
                <div className="goal-item">
                  <div className="goal-icon">
                    <i className="icofont-chart-growth"></i>
                  </div>
                  <h4>Grow Participation</h4>
                  <p>Increase the number of students competing at national level</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="goal-item">
                  <div className="goal-icon">
                    <i className="icofont-medal"></i>
                  </div>
                  <h4>Win Medals</h4>
                  <p>Aim for medal positions at IOAI 2026 in Abu Dhabi</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="goal-item">
                  <div className="goal-icon">
                    <i className="icofont-network"></i>
                  </div>
                  <h4>Build Community</h4>
                  <p>Create a strong AI community among Kenyan youth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KenyaParticipation;
