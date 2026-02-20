// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SPONSORS GRID (FRESH IMPLEMENTATION)
// ═══════════════════════════════════════════════════════════════════════
// Simple sponsors listing using Next.js Image like SpeakersGrid
// Created: Jan 6, 2026 - Fresh start following working Speakers pattern
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Sponsor, Event, ApiSuccessResponse } from "@/types/api";
import SponsorSkeleton from "./SponsorSkeleton";
import SponsorCard from "./SponsorCard";

const CURRENT_YEAR = new Date().getFullYear();

const SponsorsGrid: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');

  // Fetch events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const timestamp = Date.now();
        const response = await fetch(`/api/events?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        if (response.ok) {
          const result: ApiSuccessResponse<Event[]> = await response.json();
          setEvents(result.data);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch sponsors from API
  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        setError(null);
        // Add cache busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const url = eventFilter !== 'all'
          ? `/api/sponsors?event_id=${eventFilter}&_t=${timestamp}`
          : `/api/sponsors?_t=${timestamp}`;
        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sponsors');
        }

        const result: ApiSuccessResponse<Sponsor[]> = await response.json();
        setSponsors(result.data);
      } catch (err) {
        console.error('Error fetching sponsors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sponsors');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, [eventFilter]);

  // No filtering needed - show all sponsors
  const filteredSponsors = sponsors;

  return (
    <div className="sponsors-grid-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Check Who Makes This Event Possible!</span>
          <h2>
            Our Event <b>Sponsors</b>
          </h2>
          <div className="bar"></div>
          <p className="section-description">
            We are grateful to our sponsors and partners who make IndabaX Kenya possible.
            Their support enables us to bring world-class AI education and community building to Kenya.
          </p>
        </div>

        {/* Filters */}
        <div className="sponsors-filters mb-5">
          <div className="card shadow-sm">
            <div className="card-body py-4">
              {loading ? (
                // Filter skeleton
                <div className="row align-items-end justify-content-center g-3">
                  <div className="col-lg-4 col-md-6 mx-auto">
                    <div className="filter-group">
                      <div className="skeleton skeleton-text mb-2" style={{ width: '120px', height: '14px' }}></div>
                      <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="row align-items-end justify-content-center g-3">
                    {/* Event Dropdown - Client Feedback #4: Remove theme text */}
                    <div className="col-lg-4 col-md-6 mx-auto">
                      <div className="filter-group">
                        <label htmlFor="eventFilter" className="form-label fw-semibold">
                          <i className="icofont-ui-calendar me-2"></i>Filter by Event
                        </label>
                        <select
                          id="eventFilter"
                          className="form-select"
                          value={eventFilter}
                          onChange={(e) => setEventFilter(e.target.value)}
                        >
                          <option value="all">All Events</option>
                          {events.map(event => {
                            // Extract just the event name (remove theme text)
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
                    {/* Year Dropdown - REMOVED per client feedback */}
                  </div>

                  {/* Filter Summary */}
                  {eventFilter !== 'all' && (
                    <div className="text-center mt-3 pt-3 border-top">
                      <span className="text-muted me-2">
                        Showing {filteredSponsors.length} of {sponsors.length} sponsors
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setEventFilter('all')}
                      >
                        <i className="icofont-close-circled me-1"></i>
                        Clear Filter
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && <SponsorSkeleton />}

        {/* Error */}
        {error && (
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning"></i> {error}
          </div>
        )}

        {/* Sponsors Grid */}
        {!loading && !error && filteredSponsors.length > 0 ? (
          <div className="row">
            {filteredSponsors.map((sponsor, index) => (
              <SponsorCard
                key={sponsor.id}
                sponsor={sponsor}
                index={index}
              />
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="no-results" data-aos="fade-up">
            <i className="icofont-building"></i>
            <h3>No sponsors found</h3>
            <p>
              {eventFilter === 'all'
                ? 'No sponsors available at this time.'
                : 'No sponsors found for this event. Try clearing your filters.'}
            </p>
            {eventFilter !== 'all' && (
              <button
                className="btn btn-primary"
                onClick={() => setEventFilter('all')}
              >
                View All Sponsors
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SponsorsGrid;
