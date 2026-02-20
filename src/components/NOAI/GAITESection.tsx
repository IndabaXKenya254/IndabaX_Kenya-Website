// ═══════════════════════════════════════════════════════════════════════
// NOAI - GAITE SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Global AI Talent Empowerment initiative explanation
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";

const GAITESection: React.FC = () => {
  // Goals exactly from source document (lines 17-22)
  const goals = [
    {
      icon: "icofont-globe",
      title: "Promote STEM and AI globally",
    },
    {
      icon: "icofont-people",
      title: "Foster inclusivity",
    },
    {
      icon: "icofont-network",
      title: "Expand the IOAI community",
    },
    {
      icon: "icofont-graduate",
      title: "Support national STEM and AI culture",
    },
    {
      icon: "icofont-handshake-deal",
      title: "Attract international partners",
    },
  ];

  return (
    <div className="gaite-section ptb-120">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-5 col-md-12">
            <div className="gaite-intro" data-aos="fade-right">
              <span className="section-badge">IOAI Initiative</span>
              <h2>
                IOAI <b>GAITE</b>
              </h2>
              <h4>Global AI Talent Empowerment</h4>
              <p className="lead">
                The IOAI Global AI Talent Empowerment (GAITE) initiative under IOAI
                supports countries and territories with limited International Science
                Olympiads history, helping them integrate into the IOAI community.
              </p>
            </div>
          </div>

          <div className="col-lg-7 col-md-12">
            <div className="gaite-goals" data-aos="fade-left">
              <h3 className="goals-title">Program Goals</h3>
              <div className="goals-grid">
                {goals.map((goal, index) => (
                  <div
                    key={index}
                    className="goal-card"
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                  >
                    <div className="goal-icon">
                      <i className={goal.icon}></i>
                    </div>
                    <div className="goal-content">
                      <h4>{goal.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GAITESection;
