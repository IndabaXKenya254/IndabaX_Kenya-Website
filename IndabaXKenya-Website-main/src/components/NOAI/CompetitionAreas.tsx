// ═══════════════════════════════════════════════════════════════════════
// NOAI - COMPETITION AREAS COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Cards displaying ML, NLP, CV, Robotics, and Ethics focus areas
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";

const CompetitionAreas: React.FC = () => {
  // Competition areas from source document line 38
  const areas = [
    {
      icon: "icofont-chart-line-alt",
      title: "Machine Learning",
      color: "#4285f4",
    },
    {
      icon: "icofont-eye",
      title: "Computer Vision",
      color: "#ea4335",
    },
    {
      icon: "icofont-speech-comments",
      title: "Natural Language Processing",
      color: "#34a853",
    },
    {
      icon: "icofont-robot",
      title: "Robotic Motion Planning",
      color: "#fbbc04",
    },
  ];

  return (
    <div className="competition-areas-section ptb-120 bg-light">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>About the IOAI Competition</span>
          <h2>
            Competition <b>Focus Areas</b>
          </h2>
          <div className="bar"></div>
        </div>

        <div className="areas-grid">
          <div className="row">
            {areas.map((area, index) => (
              <div
                key={index}
                className="col-lg-4 col-md-6"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="area-card">
                  <div
                    className="card-icon"
                    style={{ backgroundColor: `${area.color}15`, color: area.color }}
                  >
                    <i className={area.icon}></i>
                  </div>
                  <h3>{area.title}</h3>
                  <div
                    className="card-accent"
                    style={{ backgroundColor: area.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="format-note" data-aos="fade-up">
          <div className="note-content">
            <i className="icofont-info-circle"></i>
            <p>
              The format encourages not only technical excellence but also critical
              thinking about the societal impact of the solutions created. Ethical
              considerations are integrated directly into the competition tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionAreas;
