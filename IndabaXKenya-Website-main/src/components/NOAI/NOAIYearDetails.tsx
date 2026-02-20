// ═══════════════════════════════════════════════════════════════════════
// NOAI - DYNAMIC YEAR DETAILS COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Fetches and displays NOAI event details for a specific year
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  event_year: number;
  registration_enabled: boolean;
  registration_deadline: string | null;
  max_attendees: number | null;
  featured_image: string | null;
}

export default function NOAIYearDetails({ year }: { year: string }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventByYear();
  }, [year]);

  const fetchEventByYear = async () => {
    try {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
        setError('Invalid year');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/events?event_category=noai&event_year=${yearNum}&limit=1`
      );

      if (!response.ok) {
        setError(`No NOAI event found for ${year}`);
        return;
      }

      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        setEvent(result.data[0]);
      } else {
        setError(`No NOAI event found for ${year}`);
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ptb-120">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="ptb-120">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <div data-aos="fade-up">
                <i
                  className="icofont-calendar"
                  style={{ fontSize: '5rem', color: '#95a5a6' }}
                ></i>
                <h2 className="mt-4">Event Not Found</h2>
                <p className="lead">{error || `No NOAI event scheduled for ${year}`}</p>
                <div className="mt-4">
                  <Link href="/noai" className="btn btn-primary">
                    <i className="icofont-arrow-left me-2"></i>
                    Back to NOAI
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if registration is open
  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline) < new Date()
    : false;
  const isRegistrationOpen = event.registration_enabled && !isDeadlinePassed;

  return (
    <div className="ioai-2026-section ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>National Olympiad</span>
          <h2>
            NOAI <b>{event.event_year}</b>
          </h2>
          <div className="bar"></div>
        </div>

        <div className="row">
          <div className="col-lg-8 col-md-12">
            <div className="event-details" data-aos="fade-right">
              {/* Event Header */}
              <div className="event-header">
                <div className="edition-badge">
                  <i className="icofont-trophy"></i> NOAI {event.event_year}
                </div>
                <h3>{event.title}</h3>
              </div>

              {/* Event Info Grid */}
              <div className="event-info-grid">
                <div className="info-card">
                  <div className="info-icon">
                    <i className="icofont-location-pin"></i>
                  </div>
                  <div className="info-content">
                    <h4>Location</h4>
                    <p>{event.location}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <i className="icofont-calendar"></i>
                  </div>
                  <div className="info-content">
                    <h4>Event Dates</h4>
                    <p>
                      {new Date(event.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(event.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {event.max_attendees && (
                  <div className="info-card">
                    <div className="info-icon">
                      <i className="icofont-users-alt-4"></i>
                    </div>
                    <div className="info-content">
                      <h4>Team Size</h4>
                      <p>{event.max_attendees} High School Students</p>
                    </div>
                  </div>
                )}

                {event.registration_deadline && (
                  <div className="info-card">
                    <div className="info-icon">
                      <i className="icofont-alarm"></i>
                    </div>
                    <div className="info-content">
                      <h4>Application Deadline</h4>
                      <p>
                        {new Date(event.registration_deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Description */}
              <div className="event-description">
                <h4>
                  <i className="icofont-info-circle me-2"></i>
                  About the Event
                </h4>
                <div dangerouslySetInnerHTML={{ __html: event.description }} />
              </div>

              {/* Issue #40 FIX: Registration CTA removed per client request */}

              {!isRegistrationOpen && event.registration_deadline && (
                <div className="alert alert-warning">
                  <i className="icofont-info-circle me-2"></i>
                  <strong>Applications Closed</strong>
                  <br />
                  The application deadline for NOAI {event.event_year} has passed.
                  Check back next year for new opportunities!
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4 col-md-12">
            <div className="event-sidebar" data-aos="fade-left">
              {/* Event Summary Card */}
              <div className="sidebar-card event-summary-card">
                <div className="card-header">
                  <span className="ioai-badge">NOAI {event.event_year}</span>
                </div>
                <div className="card-body">
                  <ul className="event-list">
                    <li>
                      <i className="icofont-location-pin"></i>
                      <span>{event.location}</span>
                    </li>
                    <li>
                      <i className="icofont-calendar"></i>
                      <span>
                        {new Date(event.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(event.end_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </li>
                    {event.max_attendees && (
                      <li>
                        <i className="icofont-users-alt-4"></i>
                        <span>{event.max_attendees} Students</span>
                      </li>
                    )}
                    {event.registration_deadline && isRegistrationOpen && (
                      <li>
                        <i className="icofont-alarm"></i>
                        <span>
                          Apply by{' '}
                          {new Date(event.registration_deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Quick Links Card */}
              <div className="sidebar-card">
                <h4>
                  <i className="icofont-link"></i> Quick Links
                </h4>
                <div className="d-grid gap-2">
                  <Link href="/noai" className="btn btn-outline-primary">
                    <i className="icofont-home me-2"></i>
                    NOAI Home
                  </Link>
                  <Link href="/noai/ioai" className="btn btn-outline-primary">
                    <i className="icofont-trophy me-2"></i>
                    About IOAI
                  </Link>
                  <Link href="/noai/kenya" className="btn btn-outline-primary">
                    <i className="icofont-flag me-2"></i>
                    Kenya&apos;s Journey
                  </Link>
                  <Link href="/noai/faq" className="btn btn-outline-primary">
                    <i className="icofont-question-circle me-2"></i>
                    FAQ
                  </Link>
                  {/* Issue #40 FIX: Apply Now button removed per client request */}
                </div>
              </div>

              {/* Contact Card */}
              <div className="sidebar-card contact-card">
                <h4>
                  <i className="icofont-question-circle"></i> Questions?
                </h4>
                <p>Have questions about NOAI {event.event_year}?</p>
                <a
                  href="mailto:abigail@deeplearningindaba.com"
                  className="contact-link"
                >
                  <i className="icofont-email"></i>
                  abigail@deeplearningindaba.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
