"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";

interface Highlight {
  icon: string;
  text: string;
}

interface CTAData {
  badge_text: string;
  heading: string;
  description: string;
  button_text: string;
  button_link: string;
  background_image: string;
  highlights: Highlight[];
  is_visible: boolean;
}

const BuyTicket: React.FC = () => {
  const { settings } = useSettings();
  const [ctaData, setCTAData] = useState<CTAData | null>(null);

  // Get current year from settings or default
  const currentYear = settings.current_event_year || new Date().getFullYear();

  // Format registration deadline if available
  const deadlineText = settings.event_registration_deadline
    ? `Registration deadline: ${new Date(settings.event_registration_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : null;

  // Fetch CTA section data
  useEffect(() => {
    const fetchCTAData = async () => {
      try {
        const response = await fetch('/api/cta-section');
        const result = await response.json();
        if (result.success && result.data) {
          setCTAData(result.data);
        }
      } catch (error) {
        console.error('Error fetching CTA data:', error);
      }
    };

    fetchCTAData();
  }, []);

  // Default values if no data fetched
  const defaultData: CTAData = {
    badge_text: "Don't Miss Out!",
    heading: "Secure Your Spot at IndabaX Kenya",
    description: "Join 500+ AI enthusiasts from across Africa for 3 days of learning, networking, and innovation. <strong>Registration is FREE for students only.</strong> Limited seats available - register now to be part of East Africa's premier AI conference.",
    button_text: "Register Now",
    button_link: "/register",
    background_image: "/images/buy-tickets-bg.jpg",
    highlights: [
      { icon: "icofont-check-circled", text: "50+ Expert Speakers" },
      { icon: "icofont-check-circled", text: "10+ Hands-on Workshops" },
      { icon: "icofont-check-circled", text: "Networking with 500+ Attendees" },
      { icon: "icofont-check-circled", text: "FREE for Students Only" }
    ],
    is_visible: true
  };

  const data = ctaData || defaultData;

  // Don't render if not visible
  if (!data.is_visible) {
    return null;
  }

  return (
    <>
      <div
        className="buy-tickets-area ptb-120"
        style={{
          backgroundImage: `url(${data.background_image})`,
        }}
      >
        <div className="buy-tickets">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <div className="section-title">
                  {data.badge_text && <span>{data.badge_text}</span>}
                  <h2>{data.heading} {currentYear}</h2>
                  {data.description && (
                    <p dangerouslySetInnerHTML={{ __html: data.description }}></p>
                  )}
                  {data.highlights && data.highlights.length > 0 && (
                    <ul className="cta-highlights">
                      {data.highlights.map((highlight, index) => (
                        <li key={index}>
                          <i className={highlight.icon}></i> {highlight.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="buy-ticket-btn">
                  <Link href={data.button_link} className="btn btn-primary btn-lg">
                    {data.button_text}
                    <i className="icofont-double-right"></i>
                  </Link>
                  {deadlineText && (
                    <p className="deadline-text">
                      <i className="icofont-calendar"></i> {deadlineText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuyTicket;
