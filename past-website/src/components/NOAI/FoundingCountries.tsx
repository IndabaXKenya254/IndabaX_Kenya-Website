// ═══════════════════════════════════════════════════════════════════════
// NOAI - FOUNDING COUNTRIES COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Display the 33 founding IOAI countries/territories
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React from "react";

const FoundingCountries: React.FC = () => {
  const countries = [
    { name: "Australia", flag: "🇦🇺", region: "Oceania" },
    { name: "Bangladesh", flag: "🇧🇩", region: "Asia" },
    { name: "Brazil", flag: "🇧🇷", region: "South America" },
    { name: "Bulgaria", flag: "🇧🇬", region: "Europe" },
    { name: "Canada", flag: "🇨🇦", region: "North America" },
    { name: "China", flag: "🇨🇳", region: "Asia" },
    { name: "Colombia", flag: "🇨🇴", region: "South America" },
    { name: "El Salvador", flag: "🇸🇻", region: "Central America" },
    { name: "Estonia", flag: "🇪🇪", region: "Europe" },
    { name: "Hong Kong", flag: "🇭🇰", region: "Asia" },
    { name: "Hungary", flag: "🇭🇺", region: "Europe" },
    { name: "Isle of Man", flag: "🇮🇲", region: "Europe" },
    { name: "Japan", flag: "🇯🇵", region: "Asia" },
    { name: "Iran", flag: "🇮🇷", region: "Asia" },
    { name: "Jordan", flag: "🇯🇴", region: "Asia" },
    { name: "Kuwait", flag: "🇰🇼", region: "Asia" },
    { name: "Kazakhstan", flag: "🇰🇿", region: "Asia" },
    { name: "Kyrgyzstan", flag: "🇰🇬", region: "Asia" },
    { name: "Macau", flag: "🇲🇴", region: "Asia" },
    { name: "Malaysia", flag: "🇲🇾", region: "Asia" },
    { name: "Mongolia", flag: "🇲🇳", region: "Asia" },
    { name: "Nepal", flag: "🇳🇵", region: "Asia" },
    { name: "Netherlands", flag: "🇳🇱", region: "Europe" },
    { name: "Poland", flag: "🇵🇱", region: "Europe" },
    { name: "Romania", flag: "🇷🇴", region: "Europe" },
    { name: "Singapore", flag: "🇸🇬", region: "Asia" },
    { name: "Sweden", flag: "🇸🇪", region: "Europe" },
    { name: "Chinese Taipei", flag: "🇹🇼", region: "Asia" },
    { name: "Tunisia", flag: "🇹🇳", region: "Africa" },
    { name: "Turkey", flag: "🇹🇷", region: "Europe/Asia" },
    { name: "UAE", flag: "🇦🇪", region: "Asia" },
    { name: "USA", flag: "🇺🇸", region: "North America" },
    { name: "Vietnam", flag: "🇻🇳", region: "Asia" },
  ];

  return (
    <div className="founding-countries-section ptb-120 bg-light">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>Global Community</span>
          <h2>
            Founding <b>Countries & Territories</b>
          </h2>
          <div className="bar"></div>
        </div>

        <div className="countries-grid" data-aos="fade-up">
          {countries.map((country, index) => (
            <div
              key={index}
              className="country-item"
              data-aos="zoom-in"
              data-aos-delay={Math.min(index * 30, 300)}
            >
              <span className="country-flag">{country.flag}</span>
              <span className="country-name">{country.name}</span>
            </div>
          ))}
        </div>

        <div className="stats-summary" data-aos="fade-up">
          <div className="row">
            <div className="col-md-4">
              <div className="summary-item">
                <span className="number">33</span>
                <span className="label">Countries & Territories</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="summary-item">
                <span className="number">6</span>
                <span className="label">Continents</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="summary-item">
                <span className="number">2024</span>
                <span className="label">Founding Year</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundingCountries;
