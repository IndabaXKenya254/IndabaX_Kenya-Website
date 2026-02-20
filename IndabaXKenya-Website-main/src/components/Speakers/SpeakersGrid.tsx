// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SPEAKERS GRID WITH FILTERS
// ═══════════════════════════════════════════════════════════════════════
// Main speakers listing with flip cards and filtering
// Updated: Jan 3, 2026 - Added event filter dropdown
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useMemo, useEffect } from "react";
import SpeakerFlipCard from "./SpeakerFlipCard";
import type { Speaker, Event, ApiSuccessResponse } from "@/types/api";

const CURRENT_YEAR = new Date().getFullYear();

const SpeakersGrid: React.FC = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [filter, setFilter] = useState<string>("all"); // all, featured

  // Fetch events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
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

  // Fetch speakers from API (with optional event_id filter)
  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = eventFilter !== 'all'
          ? `/api/speakers?event_id=${eventFilter}`
          : '/api/speakers';
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch speakers');
        }

        const result: ApiSuccessResponse<Speaker[]> = await response.json();
        setSpeakers(result.data);
      } catch (err) {
        console.error('Error fetching speakers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load speakers');
      } finally {
        setLoading(false);
      }
    };

    fetchSpeakers();
  }, [eventFilter]);

  // Handle filter tab change - reset year filter when switching tabs
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setYearFilter('all');
  };

  // Get speakers filtered by the current tab (for year dropdown)
  const speakersForCurrentTab = useMemo(() => {
    if (filter === 'all') return speakers;
    if (filter === 'featured') return speakers.filter(s => s.is_featured);
    return speakers;
  }, [speakers, filter]);

  // Get unique years from speakers (filtered by current tab)
  const availableYears = useMemo(() => {
    const years = speakersForCurrentTab
      .map(s => s.speaker_year)
      .filter((year): year is number => year !== null)
      .filter((year, index, self) => self.indexOf(year) === index)
      .sort((a, b) => b - a); // Sort descending (newest first)
    return years;
  }, [speakersForCurrentTab]);

  // Count speakers by year (filtered by current tab)
  const speakersByYear = useMemo(() => {
    const counts: Record<number, number> = {};
    speakersForCurrentTab.forEach(s => {
      if (s.speaker_year) {
        counts[s.speaker_year] = (counts[s.speaker_year] || 0) + 1;
      }
    });
    return counts;
  }, [speakersForCurrentTab]);

  // Filter speakers based on all criteria
  const filteredSpeakers = useMemo(() => {
    return speakers.filter((speaker) => {
      // Year filter
      const matchesYear = yearFilter === 'all' || speaker.speaker_year === yearFilter;

      // Tab filter
      let matchesFilter = true;
      if (filter === 'featured') {
        matchesFilter = speaker.is_featured === true;
      }

      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (speaker.title && speaker.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (speaker.organization && speaker.organization.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesYear && matchesFilter && matchesSearch;
    });
  }, [speakers, searchQuery, yearFilter, filter]);

  // Count featured speakers
  const featuredCount = useMemo(() => {
    return speakers.filter(s => s.is_featured).length;
  }, [speakers]);

  return (
    <div className="speakers-grid-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Meet Our Experts</span>
          <h2>
            Conference <b>Speakers</b>
          </h2>
          <div className="bar"></div>
          <p className="section-description">
            Learn from 20+ leading AI researchers, practitioners, and innovators
            from across Africa and around the world. Our speakers are at the
            forefront of AI research and application.
          </p>
        </div>

        {/* Filters - Same layout as Events page */}
        <div className="speakers-filters" data-aos="fade-up">
          <div className="row align-items-center">
            {/* Event Dropdown */}
            <div className="col-lg-3 col-md-6">
              <div className="filter-group">
                <label htmlFor="eventFilter">
                  <i className="icofont-ui-calendar"></i> Event
                </label>
                <select
                  id="eventFilter"
                  className="form-control"
                  value={eventFilter}
                  onChange={(e) => {
                    setEventFilter(e.target.value);
                    setYearFilter('all'); // Reset year filter when changing event
                  }}
                >
                  <option value="all">All Events</option>
                  {events.map(event => {
                    // Extract just the year from title (e.g., "IndabaX Kenya 2024: Theme" -> "IndabaX Kenya 2024")
                    // Client feedback #8: Remove theme text, keep only event name
                    const titleParts = event.title.split(':')
                    const eventNameOnly = titleParts[0].trim()

                    return (
                      <option key={event.id} value={event.id}>
                        {eventNameOnly}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Year Dropdown - REMOVED per client feedback #7 */}
            {/* Client wants speakers grouped by event only, no year filter */}

            {/* Search */}
            <div className="col-lg-3 col-md-6">
              <div className="filter-group">
                <label htmlFor="search">
                  <i className="icofont-search-1"></i> Search Speakers
                </label>
                <input
                  type="text"
                  id="search"
                  className="form-control"
                  placeholder="Search by name, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

          </div>

          {/* Results count */}
          <div className="filter-results">
            <p>
              Showing <strong>{filteredSpeakers.length}</strong> of{" "}
              <strong>{speakers.length}</strong> speakers
              {eventFilter !== 'all' && (
                <span className="text-muted ms-2">(filtered by event)</span>
              )}
              {yearFilter !== 'all' && (
                <span className="text-muted ms-2">({yearFilter})</span>
              )}
            </p>
            {(searchQuery !== "" || yearFilter !== 'all' || filter !== 'all' || eventFilter !== 'all') && (
              <button
                className="btn btn-text"
                onClick={() => {
                  setSearchQuery("");
                  setYearFilter('all');
                  setEventFilter('all');
                  handleFilterChange('all');
                }}
              >
                <i className="icofont-close-circled"></i> Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5" data-aos="fade-up">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading speakers...</span>
            </div>
            <p className="mt-3">Loading speakers...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning"></i> {error}
          </div>
        )}

        {/* Speakers Grid */}
        {!loading && !error && filteredSpeakers.length > 0 ? (
          <div className="row">
            {filteredSpeakers.map((speaker, index) => (
              <SpeakerFlipCard
                key={speaker.id}
                speaker={speaker}
                index={index}
              />
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="no-results" data-aos="fade-up">
            <i className="icofont-search-document"></i>
            <h3>No speakers found</h3>
            <p>Try adjusting your filters or search query to find speakers.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                handleFilterChange("all");
                setSearchQuery("");
                setYearFilter('all');
                setEventFilter('all');
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SpeakersGrid;
