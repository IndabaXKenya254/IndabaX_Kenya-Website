// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENTS GRID WITH FILTERS
// ═══════════════════════════════════════════════════════════════════════
// Events listing with upcoming/past filters
// Updated: Dec 30, 2025 - Use AuthContext for instant auth checks
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSwal } from "@/lib/sweetalert";
import { useAuth } from "@/contexts/AuthContext";
import type { Event, ApiSuccessResponse } from "@/types/api";
import { getOptimizedImageUrl, getBlurDataURL, shouldLazyLoad } from "@/lib/image-utils";

const CURRENT_YEAR = new Date().getFullYear();

const EventsGrid: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth(); // Use AuthContext for instant auth check
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [checkingEventId, setCheckingEventId] = useState<string | null>(null);

  // Handle register button click - OPTIMIZED: Single API check BEFORE navigating
  const handleRegisterClick = async (event: Event) => {
    // Check if user is logged in first (instant from AuthContext)
    if (!user) {
      await (await getSwal()).fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'You must be logged in to register for this event.',
        confirmButtonText: 'Go to Login',
        confirmButtonColor: '#0d6efd',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      router.push(`/login?redirect=/events/${event.slug}/register`);
      return;
    }

    // OPTIMIZED: Single API call to check everything
    setCheckingEventId(event.id);
    try {
      const response = await fetch(`/api/events/${event.slug}/registration-status`);
      const result = await response.json();

      if (!result.success || !result.data?.event) {
        await (await getSwal()).fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to check registration status. Please try again.',
          confirmButtonColor: '#0d6efd',
        });
        return;
      }

      const { canRegister, canModify, reason, registration } = result.data;

      // Already registered
      if (registration?.status === 'completed') {
        if (canModify) {
          const confirmModify = await (await getSwal()).fire({
            icon: 'question',
            title: 'Modify Registration?',
            html: `You have already registered for <strong>${event.title}</strong>.<br><br>Do you want to modify?`,
            confirmButtonText: 'Yes, Modify',
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ffc107',
          });
          if (confirmModify.isConfirmed) {
            router.push(`/events/${event.slug}/register`);
          }
        } else {
          await (await getSwal()).fire({
            icon: 'info',
            title: 'Already Registered!',
            html: `You have already registered for <strong>${event.title}</strong>.<br><br>${reason || ''}`,
            confirmButtonText: 'View Dashboard',
            showCancelButton: true,
            cancelButtonText: 'OK',
            confirmButtonColor: '#198754',
          }).then((swalResult: any) => {
            if (swalResult.isConfirmed) {
              router.push('/dashboard');
            }
          });
        }
        return;
      }

      // Can't register
      if (!canRegister) {
        await (await getSwal()).fire({
          icon: 'info',
          title: 'Registration Not Available',
          text: reason || 'Registration is not available for this event.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd',
        });
        return;
      }

      // All checks passed - navigate to registration
      router.push(`/events/${event.slug}/register`);
    } catch (err) {
      console.error('Registration check failed:', err);
      await (await getSwal()).fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to check registration status. Please try again.',
        confirmButtonColor: '#0d6efd',
      });
    } finally {
      setCheckingEventId(null);
    }
  };

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/events');

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const result: ApiSuccessResponse<Event[]> = await response.json();
        setEvents(result.data);
        // Start with all events, year filter disabled
        setYearFilter('all');
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handle filter tab change - reset year filter when switching tabs
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setYearFilter('all'); // Reset year filter when changing tabs
  };

  // Issue #1 FIX: Include 'published' status as upcoming (matches API filter)
  const isEventUpcoming = (event: Event): boolean => {
    return event.status === 'upcoming' || event.status === 'ongoing' || event.status === 'published';
  };

  // Get events filtered by the current tab (for year dropdown)
  const eventsForCurrentTab = useMemo(() => {
    if (filter === 'all') return events;
    if (filter === 'upcoming') return events.filter(e => e.status === 'upcoming' || e.status === 'ongoing' || e.status === 'published');
    if (filter === 'past') return events.filter(e => e.status === 'past' || e.status === 'archived');
    return events;
  }, [events, filter]);

  // Get unique years from events (filtered by current tab)
  const availableYears = useMemo(() => {
    const years = eventsForCurrentTab
      .map(e => new Date(e.start_date).getFullYear())
      .filter((year, index, self) => self.indexOf(year) === index)
      .sort((a, b) => b - a);
    return years;
  }, [eventsForCurrentTab]);

  // Count events by year (filtered by current tab)
  const eventsByYear = useMemo(() => {
    const counts: Record<number, number> = {};
    eventsForCurrentTab.forEach(e => {
      const year = new Date(e.start_date).getFullYear();
      counts[year] = (counts[year] || 0) + 1;
    });
    return counts;
  }, [eventsForCurrentTab]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const eventYear = new Date(event.start_date).getFullYear();

      // Year filter (only applies if not 'all')
      const matchesYear = yearFilter === 'all' || eventYear === yearFilter;

      // Issue #1 FIX: Include 'published' status as upcoming (matches API filter)
      let matchesFilter = true;
      if (filter === 'upcoming') {
        matchesFilter = event.status === 'upcoming' || event.status === 'ongoing' || event.status === 'published';
      } else if (filter === 'past') {
        matchesFilter = event.status === 'past' || event.status === 'archived';
      }
      // filter === 'all' shows everything

      const matchesSearch =
        searchQuery === "" ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesYear && matchesFilter && matchesSearch;
    });

    // Sort events: upcoming first (by date ascending), then past (by date descending)
    return filtered.sort((a, b) => {
      const aIsUpcoming = a.status === 'upcoming' || a.status === 'ongoing' || a.status === 'published';
      const bIsUpcoming = b.status === 'upcoming' || b.status === 'ongoing' || b.status === 'published';
      const aDate = new Date(a.start_date).getTime();
      const bDate = new Date(b.start_date).getTime();

      // If showing all, upcoming events come first
      if (filter === 'all') {
        if (aIsUpcoming && !bIsUpcoming) return -1; // a is upcoming, b is past -> a first
        if (!aIsUpcoming && bIsUpcoming) return 1;  // a is past, b is upcoming -> b first
      }

      // Within same category:
      // - Upcoming: soonest first (ascending)
      // - Past: most recent first (descending)
      if (aIsUpcoming && bIsUpcoming) {
        return aDate - bDate; // Ascending for upcoming
      } else {
        return bDate - aDate; // Descending for past
      }
    });
  }, [events, filter, searchQuery, yearFilter]);

  const formatDate = (dateString: string, endDateString?: string) => {
    const startDate = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    if (endDateString) {
      const endDate = new Date(endDateString);
      return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
    }

    return startDate.toLocaleDateString("en-US", options);
  };

  // Strip HTML tags and create excerpt
  const createExcerpt = (html: string, maxLength: number = 150): string => {
    // Create a temporary div to parse HTML
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    // Get text content without HTML tags
    const text = tmp.textContent || tmp.innerText || "";
    // Trim and create excerpt
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div className="events-grid-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Discover</span>
          <h2>
            Our <b>Events</b>
          </h2>
          <div className="bar"></div>
          </div>

        {/* Filters */}
        <div className="events-filters" data-aos="fade-up">
          <div className="row align-items-center">
            <div className="col-lg-4 col-md-6">
              <div className="filter-group">
                <label htmlFor="yearFilter">
                  <i className="icofont-calendar"></i> Year
                </label>
                <select
                  id="yearFilter"
                  className="form-control"
                  value={yearFilter === 'all' ? 'all' : String(yearFilter)}
                  onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                >
                  <option value="all">All Years ({eventsForCurrentTab.length} {eventsForCurrentTab.length === 1 ? 'event' : 'events'})</option>
                  {availableYears.map(year => {
                    const count = eventsByYear[year] || 0;
                    return (
                      <option key={year} value={year}>
                        {year} ({count} {count === 1 ? 'event' : 'events'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="filter-group">
                <label htmlFor="search">
                  <i className="icofont-search-1"></i> Search Events
                </label>
                <input
                  type="text"
                  id="search"
                  className="form-control"
                  placeholder="Search by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-4 col-md-12">
              <div className="filter-tabs">
                <button
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => handleFilterChange("all")}
                >
                  <i className="icofont-calendar"></i> All
                </button>
                <button
                  className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
                  onClick={() => handleFilterChange("upcoming")}
                >
                  <i className="icofont-clock-time"></i> Upcoming
                </button>
                <button
                  className={`filter-btn ${filter === "past" ? "active" : ""}`}
                  onClick={() => handleFilterChange("past")}
                >
                  <i className="icofont-history"></i> Past
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="filter-results">
            <p>
              Showing <strong>{filteredEvents.length}</strong> of{" "}
              <strong>{events.length}</strong> events
              {yearFilter !== 'all' && (
                <span className="text-muted ms-2">({yearFilter})</span>
              )}
            </p>
            {(searchQuery !== "" || yearFilter !== 'all' || filter !== 'all') && (
              <button
                className="btn btn-text"
                onClick={() => {
                  setSearchQuery("");
                  setYearFilter('all');
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
              <span className="visually-hidden">Loading events...</span>
            </div>
            <p className="mt-3">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning"></i> {error}
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && filteredEvents.length > 0 ? (
          <div className="row">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="col-lg-4 col-md-6"
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay={index * 100}
              >
                <div className={`event-card ${event.is_featured ? "featured" : ""}`}>
                  {event.is_featured && (
                    <div className="featured-badge">
                      <i className="icofont-star"></i> Featured
                    </div>
                  )}

                  <div className="event-image-wrapper">
                    <Link href={`/events/${event.slug}`}>
                      <Image
                        src={getOptimizedImageUrl(event.featured_image, { width: 800, quality: 80 }) || "/images/events/default-event.jpg"}
                        alt={event.title}
                        width={800}
                        height={500}
                        loading={shouldLazyLoad(index) ? "lazy" : "eager"}
                        placeholder="blur"
                        blurDataURL={getBlurDataURL(10, 6)}
                        className="event-image"
                        unoptimized={event.featured_image?.startsWith('http')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/events/default-event.jpg";
                        }}
                      />
                    </Link>
                    <div className="event-date-badge">
                      <div className="date-content">
                        <span className="month">
                          {new Date(event.start_date).toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                        <span className="day">
                          {new Date(event.start_date).getDate()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="event-content">
                    <div className="event-meta">
                      <span className="event-type">
                        <i className="icofont-ui-calendar"></i>{" "}
                        {isEventUpcoming(event) ? "Upcoming Event" : "Past Event"}
                      </span>
                      {event.format && (
                        <span className={`event-format format-${event.format}`}>
                          <i className={
                            event.format === 'physical' ? 'icofont-users-alt-4' :
                            event.format === 'hybrid' ? 'icofont-share' :
                            'icofont-web'
                          }></i>{" "}
                          {event.format === 'physical' ? 'In-Person' :
                           event.format === 'hybrid' ? 'Hybrid' :
                           'Virtual'}
                        </span>
                      )}
                    </div>

                    <h3 className="event-title">
                      <Link href={`/events/${event.slug}`}>{event.title}</Link>
                    </h3>

                    {event.theme && (
                      <p className="event-theme">
                        <i className="icofont-tag"></i> {event.theme}
                      </p>
                    )}

                    <div
                      className="event-excerpt"
                      dangerouslySetInnerHTML={{
                        __html: event.description ? createExcerpt(event.description, 150) : "No description available"
                      }}
                    />

                    <div className="event-info">
                      <div className="info-item">
                        <i className="icofont-calendar"></i>
                        <span>{formatDate(event.start_date, event.end_date || undefined)}</span>
                      </div>
                      {event.location && (
                        <div className="info-item">
                          <i className="icofont-location-pin"></i>
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.venue && (
                        <div className="info-item">
                          <i className="icofont-building-alt"></i>
                          <span>{event.venue}</span>
                        </div>
                      )}
                      {event.edition && (
                        <div className="info-item">
                          <i className="icofont-star"></i>
                          <span>{event.edition}</span>
                        </div>
                      )}
                    </div>

                    <div className="event-footer">
                      {/* Show Register button for upcoming events with registration enabled */}
                      {isEventUpcoming(event) && event.registration_enabled && (
                        <>
                          {!event.registration_deadline || new Date(event.registration_deadline) > new Date() ? (
                            <button
                              onClick={() => handleRegisterClick(event)}
                              className="btn btn-primary btn-sm me-2"
                              disabled={checkingEventId === event.id}
                            >
                              {checkingEventId === event.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1"></span>
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <i className="icofont-ui-add"></i> Register Now
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-muted small me-2">
                              <i className="icofont-close-circled"></i> Registration Closed
                            </span>
                          )}
                        </>
                      )}
                      <Link
                        href={`/events/${event.slug}`}
                        className="btn-link"
                        aria-label={`Learn more about ${event.title}`}
                      >
                        Learn More <i className="icofont-arrow-right" aria-hidden="true"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="no-results" data-aos="fade-up">
            <i className="icofont-calendar"></i>
            <h3>No events found</h3>
            <p>Try adjusting your filters or search query to find events.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                handleFilterChange("all");
                setSearchQuery("");
                setYearFilter('all');
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

export default EventsGrid;
