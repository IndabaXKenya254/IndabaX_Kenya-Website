// ═══════════════════════════════════════════════════════════════════════
// NOAI - IOAI HISTORY TIMELINE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Timeline showing IOAI editions from 2024 to future
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";

const IOAIHistory: React.FC = () => {
  const editions = [
    {
      year: "2024",
      title: "1st IOAI",
      location: "Burgas, Bulgaria",
      dates: "August 9-15, 2024",
      status: "completed",
      stats: {
        teams: 41,
        countries: 32,
        continents: 6,
      },
      focus: ["Machine Learning", "Natural Language Processing", "Computer Vision"],
      highlight: "Inaugural Edition",
    },
    {
      year: "2025",
      title: "2nd IOAI",
      location: "Beijing, China",
      dates: "August 2, 2025",
      status: "completed",
      stats: null,
      focus: null,
      highlight: "Kenya's First Participation",
    },
    {
      year: "2026",
      title: "3rd IOAI",
      location: "Abu Dhabi, UAE",
      dates: "August 2-8, 2026",
      status: "upcoming",
      stats: null,
      focus: null,
      highlight: "Now Accepting Applications",
    },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "upcoming":
        return "status-upcoming";
      case "announced":
        return "status-announced";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "icofont-check-circled";
      case "upcoming":
        return "icofont-star";
      case "announced":
        return "icofont-clock-time";
      default:
        return "icofont-info-circle";
    }
  };

  return (
    <div className="ioai-history-section ptb-120 bg-light">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>History</span>
          <h2>
            IOAI <b>Editions</b>
          </h2>
          <div className="bar"></div>
        </div>

        <div className="timeline-wrapper">
          <div className="timeline-line"></div>

          {editions.map((edition, index) => (
            <div
              key={index}
              className={`timeline-item ${index % 2 === 0 ? "left" : "right"} ${getStatusClass(edition.status)}`}
              data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
              data-aos-delay={index * 100}
            >
              <div className="timeline-marker">
                <i className={getStatusIcon(edition.status)}></i>
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="year-badge">{edition.year}</span>
                  {edition.highlight && (
                    <span className={`highlight-badge ${getStatusClass(edition.status)}`}>
                      {edition.highlight}
                    </span>
                  )}
                </div>

                <h3>{edition.title}</h3>
                <p className="location">
                  <i className="icofont-location-pin"></i> {edition.location}
                </p>
                <p className="dates">
                  <i className="icofont-calendar"></i> {edition.dates}
                </p>

                {edition.stats && (
                  <div className="edition-stats">
                    <span>
                      <strong>{edition.stats.teams}</strong> Teams
                    </span>
                    <span>
                      <strong>{edition.stats.countries}</strong> Countries
                    </span>
                    <span>
                      <strong>{edition.stats.continents}</strong> Continents
                    </span>
                  </div>
                )}

                {edition.focus && (
                  <div className="edition-focus">
                    <p className="focus-label">Focus Areas:</p>
                    <div className="focus-tags">
                      {edition.focus.map((area, i) => (
                        <span key={i} className="focus-tag">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IOAIHistory;
