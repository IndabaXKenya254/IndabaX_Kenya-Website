"use client";

import React from "react";
import Link from "next/link";
import { usePricing } from "@/hooks/useApi";

const Pricing: React.FC = () => {
  // React Query hook with automatic caching and deduplication
  const { data: tiers, isLoading: loading } = usePricing();

  return (
    <>
      <div className="pricing-area ptb-120 bg-image">
        <div className="container">
          <div className="section-title">
            <span>Registration</span>
            <h2>
              Choose Your <b>Pass</b>
            </h2>
            <div className="bar"></div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading pricing...</span>
              </div>
            </div>
          ) : (
            <div className="row justify-content-center g-4">
              {(tiers || []).map((tier, index) => {
                // Dynamically set Bootstrap column classes based on number of tiers
                // Maximum 3 cards per row for better proportions
                let colClass = 'col-lg-6 col-md-6'; // Default: 2 per row

                if ((tiers || []).length === 1) {
                  colClass = 'col-lg-12 col-md-12'; // 1 card: full width, centered
                } else if ((tiers || []).length === 2) {
                  colClass = 'col-lg-6 col-md-6'; // 2 cards: 50% each
                } else {
                  // 3 or more cards: 3 per row (33.33% each), wraps to next row
                  colClass = 'col-lg-4 col-md-6'; // 3 cards per row
                }

                return (
                  <div
                    className={colClass}
                    key={tier.id}
                    data-aos="fade-up"
                    data-aos-duration="1000"
                    data-aos-delay={index * 100}
                  >
                    <div
                      className={`pricing-table-box ${
                        tier.featured ? "featured" : ""
                      }`}
                >
                  {tier.badge && (
                    <div className="pricing-badge">{tier.badge}</div>
                  )}

                  <div className="pricingTable-header">
                    <h3 className="title">{tier.title}</h3>
                    {tier.description && (
                      <p className="tier-description">{tier.description}</p>
                    )}
                    <div className="price-value">
                      {tier.price === "FREE" ? (
                        <span className="free-text">FREE</span>
                      ) : (
                        <span>
                          <sup>{tier.currency} </sup>
                          <span>{tier.price}</span>
                        </span>
                      )}
                    </div>
                    <span className="period">{tier.period}</span>
                  </div>

                  <ul className="pricing-content">
                    {(tier.features || []).map((feature, idx) => (
                      <li key={idx}>
                        <i className="icofont-check-circled"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {tier.requirements && tier.requirements.length > 0 && (
                    <div className="requirements">
                      <p className="requirements-title">
                        <i className="icofont-info-circle"></i> Requirements:
                      </p>
                      <ul>
                        {(tier.requirements || []).map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link
                    href={tier.button_link}
                    className={`btn ${
                      tier.featured ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    {tier.button_text}
                    <i className="icofont-double-right"></i>
                  </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-5">
            <p className="pricing-note">
              <i className="icofont-info-circle"></i> All prices are in Kenyan Shillings (KSH). Group discounts available for 5+ registrations.{" "}
              <Link href="/contact">Contact us</Link> for more information.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
