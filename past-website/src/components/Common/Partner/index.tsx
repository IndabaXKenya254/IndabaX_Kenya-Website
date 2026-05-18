"use client";

import React from "react"; 
import PlatinumSponsors from "./PlatinumSponsors";
import GoldSponsors from "./GoldSponsors";

const Partner: React.FC = () => {
  return (
    <>
      <div className="partner-area ptb-120">
        <div className="container">
          <div className="section-title">
            <span>Check Who Makes This Event Possible!</span>
            <h2>
              Our Event <b>Sponsors</b>
            </h2>

            <a href="#" className="btn btn-primary">
              Become a Sponsor
            </a>

            <div className="bar"></div>
          </div>

          <PlatinumSponsors />

          <div className="border"></div>

          <GoldSponsors />
        </div>
      </div>
    </>
  );
};

export default Partner;
