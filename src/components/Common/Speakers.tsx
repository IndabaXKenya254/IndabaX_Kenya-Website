"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSpeakers } from "@/hooks/useApi";

const Speakers: React.FC = () => {
  // React Query hook with automatic caching and deduplication
  // Limit to 8 speakers for homepage
  const { data: speakers, isLoading: loading } = useSpeakers(8);

  return (
    <>
      <div className="speakers-area ptb-120 pb-0">
        <div className="container">
          <div className="section-title">
            <span>Listen to the Event Speakers</span>
            <h2>Who&apos;s Speaking</h2>
            <div className="bar"></div>
          </div>

          {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading speakers...</span>
            </div>
          </div>
        ) : speakers && speakers.length > 0 ? (
          <div className="row m-0">
            {(speakers || []).map((speaker, index) => (
              <div className="col-lg-3 col-sm-6 p-0" key={speaker.id}>
                <div className="single-speakers">
                  <div className="speaker-image-wrapper">
                    <Image
                      src={speaker.photo_url || "/images/speakers1.jpg"}
                      alt={speaker.name}
                      width={800}
                      height={800}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>

                  <div className="speakers-content">
                    <h3>{speaker.name}</h3>
                    <span>{speaker.title || speaker.organization || "Speaker"}</span>
                  </div>

                  <ul>
                    {speaker.linkedin_url && (
                      <li>
                        <a
                          href={speaker.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="linkedin"
                          aria-label={`${speaker.name} on LinkedIn`}
                        >
                          <i className="icofont-linkedin"></i>
                        </a>
                      </li>
                    )}
                    {speaker.twitter_url && (
                      <li>
                        <a
                          href={speaker.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="twitter"
                          aria-label={`${speaker.name} on Twitter`}
                        >
                          <i className="icofont-twitter"></i>
                        </a>
                      </li>
                    )}
                    {speaker.website_url && (
                      <li>
                        <a
                          href={speaker.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link"
                          aria-label={`${speaker.name}'s website`}
                        >
                          <i className="icofont-link"></i>
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <p>Speaker lineup coming soon! Stay tuned for announcements.</p>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default Speakers;
