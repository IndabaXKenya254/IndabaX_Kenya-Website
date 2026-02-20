"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSponsors } from "@/hooks/useApi";

interface Event {
  id: string;
  title: string;
  slug: string;
  start_date: string | null;
}

const Partner: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('all');

  // React Query hook with automatic caching and deduplication
  const { data: sponsors, isLoading: loading } = useSponsors();

  // Fetch events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const result = await response.json();
          setEvents(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, []);

  // Filter sponsors by event
  const filteredSponsors = React.useMemo(() => {
    if (!sponsors) return [];
    if (eventFilter === 'all') return sponsors;

    // Filter sponsors that match the selected event OR have no event (global sponsors)
    return sponsors.filter((s: any) => !s.event_id || s.event_id === eventFilter);
  }, [sponsors, eventFilter]);

  return (
    <>
      <div className="partner-area ptb-120">
        <div className="container">
          <div className="section-title">
            <span>Our Supporters</span>
            <h2>Partners & Sponsors</h2>
            <div className="bar"></div>
          </div>

          {/* Event Filter - Client Feedback #9 */}
          <div className="row mb-4">
            <div className="col-md-4 mx-auto">
              <div className="filter-group">
                <label htmlFor="eventFilter" className="form-label">
                  <i className="icofont-ui-calendar"></i> Filter by Event
                </label>
                <select
                  id="eventFilter"
                  className="form-control"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                >
                  <option value="all">All Events</option>
                  {events.map(event => {
                    // Extract just the year from title (remove theme text)
                    const titleParts = event.title.split(':');
                    const eventNameOnly = titleParts[0].trim();

                    return (
                      <option key={event.id} value={event.id}>
                        {eventNameOnly}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading sponsors...</span>
              </div>
            </div>
          ) : filteredSponsors && filteredSponsors.length > 0 ? (
            <>
              {/* Results count */}
              <div className="text-center mb-4">
                <p className="text-muted">
                  Showing <strong>{filteredSponsors.length}</strong> of <strong>{sponsors?.length || 0}</strong> sponsors
                  {eventFilter !== 'all' && <span> (filtered by event)</span>}
                </p>
              </div>

              <div className="partner-grid">
                <div className="row g-4 justify-content-center">
                  {filteredSponsors.map((sponsor, index) => (
                  <div
                    className="col-lg-3 col-md-4 col-sm-6 col-6"
                    key={sponsor.id}
                    data-aos="fade-up"
                    data-aos-duration="1000"
                    data-aos-delay={index * 50}
                  >
                    <div className="single-partner-item">
                      <a
                        href={sponsor.website_url || "#"}
                        target={sponsor.website_url ? "_blank" : "_self"}
                        rel={sponsor.website_url ? "noopener noreferrer" : undefined}
                        aria-label={`Visit ${sponsor.name} website`}
                      >
                        <div className="partner-logo">
                          <Image
                            src={sponsor.logo_url}
                            alt={sponsor.name}
                            width={200}
                            height={100}
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                        <span className="partner-name">{sponsor.name}</span>
                      </a>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <p>
                {eventFilter !== 'all'
                  ? 'No sponsors found for this event.'
                  : 'No sponsors at this time.'}
              </p>
            </div>
          )}

          <div className="text-center mt-5">
            <p className="sponsor-cta">
              Interested in sponsoring IndabaX Kenya 2026?{" "}
              <a href="/contact" className="sponsor-link">
                Contact us
              </a>{" "}
              to learn about sponsorship opportunities.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Partner;
