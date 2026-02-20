// ═══════════════════════════════════════════════════════════════════════
// KENYA'S IOAI JOURNEY TIMELINE
// ═══════════════════════════════════════════════════════════════════════
// Timeline showing Kenya's participation and selection process for IOAI
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";

const KenyaJourneyTimeline: React.FC = () => {
  const milestones = [
    {
      id: "2025-participation",
      year: "2025",
      title: "Kenya's First IOAI Participation",
      subtitle: "2nd IOAI - Beijing, China",
      date: "August 2, 2025",
      icon: "icofont-flag-alt-2",
      description: "Kenya made history by participating in the International Olympiad in Artificial Intelligence for the first time, representing East Africa on the global AI stage.",
      highlight: "Historic Debut",
    },
    {
      id: "2025-round1",
      year: "2025/26",
      title: "Round One Examination",
      subtitle: "NOAI Selection Process",
      date: "December 17, 2025",
      icon: "icofont-paper",
      description: "First round of the National Olympiad for AI. Open to all eligible Kenyan students interested in representing Kenya at IOAI 2026.",
      highlight: "",
    },
    {
      id: "2025-round2",
      year: "2025/26",
      title: "Round Two Examination",
      subtitle: "NOAI Selection Process",
      date: "December 22, 2025",
      icon: "icofont-chart-line-alt",
      description: "Second round for shortlisted candidates from Round One. Advanced problem-solving and AI concepts assessment.",
      highlight: "",
    },
    {
      id: "2026-training",
      year: "2026",
      title: "Final Team Training",
      subtitle: "Intensive Preparation",
      date: "January - July 2026",
      icon: "icofont-graduate",
      description: "Selected team members undergo rigorous training in machine learning, natural language processing, computer vision, and AI problem-solving.",
      highlight: "6 Months",
    },
    {
      id: "2026-ioai",
      year: "2026",
      title: "3rd IOAI - Abu Dhabi",
      subtitle: "International Competition",
      date: "August 2-9, 2026",
      icon: "icofont-trophy",
      description: "Kenya's team competes at the 3rd International Olympiad in Artificial Intelligence in Abu Dhabi, UAE.",
      highlight: "",
    },
  ];


  return (
    <section className="kenya-journey-timeline-section ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>Roadmap</span>
          <h2>
            Kenya&apos;s IOAI <b>Journey</b>
          </h2>
          <p className="section-subtitle">
            From our historic debut in 2025 to the upcoming IOAI 2026 in Abu Dhabi
          </p>
          <div className="bar"></div>
        </div>

        <div className="kenya-timeline-wrapper">
          <div className="kenya-timeline-line"></div>

          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`kenya-timeline-item ${index % 2 === 0 ? "left" : "right"}`}
              data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
              data-aos-delay={index * 100}
            >
              <div className="kenya-timeline-marker">
                <i className={milestone.icon}></i>
              </div>

              <div className="kenya-timeline-content">
                <div className="kenya-timeline-header">
                  <span className="year-badge">{milestone.year}</span>
                </div>

                <h3>{milestone.title}</h3>
                <p className="subtitle">{milestone.subtitle}</p>

                <div className="date-info">
                  <i className="icofont-calendar"></i>
                  <span>{milestone.date}</span>
                </div>

                <p className="description">{milestone.description}</p>

                {milestone.highlight && (
                  <span className="highlight-tag">
                    {milestone.highlight}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Issue #40 FIX: Apply Now CTA removed per client request */}
      </div>
    </section>
  );
};

export default KenyaJourneyTimeline;
