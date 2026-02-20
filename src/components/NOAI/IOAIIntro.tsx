// ═══════════════════════════════════════════════════════════════════════
// NOAI - IOAI INTRODUCTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// What is IOAI section with mission and vision
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";
import Link from "next/link";

const IOAIIntro: React.FC = () => {
  return (
    <div className="ioai-intro-section ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>About IOAI</span>
          <h2>
            International Olympiad in <b>Artificial Intelligence</b>
          </h2>
          <div className="bar"></div>
        </div>

        <div className="row align-items-center">
          <div className="col-lg-6 col-md-12">
            <div className="intro-content" data-aos="fade-right">
              <p className="lead-text">
                The International Olympiad in Artificial Intelligence (IOAI) is an
                annual global competition designed to inspire and challenge
                secondary school students in the field of AI.
              </p>
              <p>
                Its primary mission is to promote awareness and understanding of
                artificial intelligence among the next generation of thinkers and
                innovators. The olympiad aims to foster an interest in AI and
                real-world applications through a competitive yet collaborative
                environment.
              </p>
              <p>
                By bringing together bright young minds from across the world, the
                IOAI seeks to build an international community passionate about
                the future of technology. Ultimately, it serves as a premier
                platform for students to showcase their problem-solving skills and
                grasp of fundamental AI concepts.
              </p>

              <div className="intro-link">
                <Link
                  href="https://ioai-official.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary"
                >
                  Visit Official IOAI Website{" "}
                  <i className="icofont-external-link"></i>
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-12">
            <div className="mission-vision-cards" data-aos="fade-left">
              <div className="mv-card mission-card">
                <div className="card-icon">
                  <i className="icofont-rocket-alt-2"></i>
                </div>
                <h3>IOAI Mission</h3>
                <p>
                  IOAI aims to inspire young people globally in science, focusing
                  on AI. We provide a platform for top AI students selected
                  through national competitions to compete, exchange ideas, and
                  build connections, fostering a dialogue on AI&apos;s opportunities
                  and ethical challenges among students and the community.
                </p>
              </div>

              <div className="mv-card vision-card">
                <div className="card-icon">
                  <i className="icofont-eye-alt"></i>
                </div>
                <h3>IOAI Vision</h3>
                <p>
                  IOAI aspires to become an International Science Olympiad on par
                  with the established ones in terms of participating countries
                  and task level. In collaboration with global organizations and
                  AI experts, IOAI builds a network of future innovators who will
                  shape AI for the benefit of humankind and our planet, while
                  ensuring financial accessibility for all participants.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="ioai-stats" data-aos="fade-up">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-6">
              <div className="stat-box">
                <span className="stat-number">41</span>
                <span className="stat-label">Teams in 2024</span>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-6">
              <div className="stat-box">
                <span className="stat-number">32</span>
                <span className="stat-label">Countries</span>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-6">
              <div className="stat-box">
                <span className="stat-number">6</span>
                <span className="stat-label">Continents</span>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-6">
              <div className="stat-box">
                <span className="stat-number">2024</span>
                <span className="stat-label">Inaugural Year</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOAIIntro;
