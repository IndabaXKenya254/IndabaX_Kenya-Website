"use client";

import React from "react";
import CountUp from "react-countup";
import { useStats } from "@/hooks/useApi";

const FunFact: React.FC = () => {
  // React Query automatically handles caching, deduplication, and loading states
  const { data: stats, isLoading: loading } = useStats();

  return (
    <>
      <div className="funfacts-area ptb-120">
        <div className="container">
          {/* Issue #34: Added section title per client request */}
          <div className="section-title" data-aos="fade-up" data-aos-duration="1000">
            <h2>IndabaX Kenya in Numbers</h2>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading stats...</span>
              </div>
            </div>
          ) : (
            <div className="row justify-content-center">
              {(stats || []).map((stat, index) => (
                <div
                  className="col-lg-3 col-6 col-sm-6"
                  key={stat.id}
                  data-aos="zoom-in"
                  data-aos-duration="1000"
                  data-aos-delay={index * 100}
                >
                  <div className="single-funfact">
                    <div className="icon">
                      <i className={stat.icon} style={{ color: stat.color }}></i>
                    </div>
                    <h3 style={{ color: stat.color }}>
                      <CountUp
                        end={stat.value}
                        duration={2.5}
                        enableScrollSpy={true}
                        scrollSpyOnce={true}
                      />
                      {stat.suffix}
                    </h3>
                    <p>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FunFact;
