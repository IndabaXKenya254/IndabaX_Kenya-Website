'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GoogleFormEmbed from './GoogleFormEmbed';
// Issue #40 FIX: ApplicationCTA banner removed per client request

interface NOAIEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_enabled: boolean;
  registration_deadline: string | null;
  application_form_url: string | null;
  initial_template_id: string | null;
  max_attendees: number | null;
  slug: string;
}

export default function DynamicNOAIApplicationForm() {
  const [event, setEvent] = useState<NOAIEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentNOAIEvent();
  }, []);

  const fetchCurrentNOAIEvent = async () => {
    try {
      const response = await fetch('/api/events/noai/current');
      const result = await response.json();

      if (result.success && result.data) {
        setEvent(result.data);
      } else {
        setError(result.message || 'No active NOAI event found');
      }
    } catch (err) {
      setError('Failed to load event details');
      console.error('Error fetching NOAI event:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="apply-page-content ptb-120">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return <ApplicationClosedView error={error} />;
  }

  // Check if registration is closed
  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline) < new Date()
    : false;
  const isRegistrationClosed = !event.registration_enabled || isDeadlinePassed;

  if (isRegistrationClosed) {
    return <ApplicationClosedView event={event} />;
  }

  // Determine which form to show
  const showGoogleForm = !!event.application_form_url;
  const showBuiltInForm = !!event.initial_template_id;

  return (
    <>
      {/* Issue #40 FIX: ApplicationCTA banner removed per client request */}

      <div className="apply-page-content ptb-120">
        <div className="container">
          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8 col-md-12">
              <div className="application-intro" data-aos="fade-up">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="edition-badge">
                    <i className="icofont-trophy"></i> NOAI {new Date(event.start_date).getFullYear()}
                  </div>
                </div>
                <h2>{event.title}</h2>
                <div className="lead mb-4" dangerouslySetInnerHTML={{ __html: event.description }} />

                <div className="important-notice">
                  <h4><i className="icofont-info-circle"></i> Important Information</h4>
                  <ul className="mb-0">
                    {event.registration_deadline && (
                      <li>
                        <i className="icofont-alarm text-primary me-2"></i>
                        <strong>Application Deadline:</strong>{' '}
                        {new Date(event.registration_deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </li>
                    )}
                    <li>
                      <i className="icofont-calendar text-primary me-2"></i>
                      <strong>Event Dates:</strong>{' '}
                      {new Date(event.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(event.end_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </li>
                    <li>
                      <i className="icofont-location-pin text-primary me-2"></i>
                      <strong>Location:</strong> {event.location}
                    </li>
                    {event.max_attendees && (
                      <li>
                        <i className="icofont-users-alt-4 text-primary me-2"></i>
                        <strong>Team Selection:</strong> {event.max_attendees} students will be selected
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Form Section */}
              <div className="application-form-section" data-aos="fade-up" data-aos-delay="100">
                <h3>
                  <i className="icofont-edit me-2"></i>
                  Application Form
                </h3>
                {showGoogleForm && (
                  <>
                    <p className="text-muted mb-4">Complete the form below to submit your application for NOAI {new Date(event.start_date).getFullYear()}.</p>
                    <GoogleFormEmbed formUrl={event.application_form_url!} />
                  </>
                )}
                {!showGoogleForm && showBuiltInForm && (
                  <div className="event-cta">
                    <p className="text-muted mb-4">
                      Click the button below to access the application form. You&apos;ll be able to save your progress and continue later.
                    </p>
                    <Link
                      href={`/events/${event.slug}/register`}
                      className="btn btn-primary btn-lg"
                    >
                      <i className="icofont-pencil-alt-2 me-2"></i>
                      Start Application
                      <i className="icofont-arrow-right ms-2"></i>
                    </Link>
                    <p className="mt-3 text-muted small">
                      <i className="icofont-save me-1"></i>
                      Your progress will be automatically saved
                    </p>
                  </div>
                )}
                {!showGoogleForm && !showBuiltInForm && (
                  <div className="alert alert-warning">
                    <i className="icofont-warning me-2"></i>
                    <strong>Form Configuration in Progress</strong>
                    <br />
                    The application form is being configured. Please check back later or contact us for assistance.
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4 col-md-12">
              <EventSidebar event={event} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ApplicationClosedView({ event, error }: { event?: NOAIEvent; error?: string | null }) {
  return (
    <div className="apply-page-content ptb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 text-center">
            <div className="application-closed-message" data-aos="fade-up">
              <i className="icofont-close-circled" style={{ fontSize: '5rem', color: '#e74c3c' }}></i>
              <h2 className="mt-4">Applications Closed</h2>
              <p className="lead">
                {error || 'The application deadline has passed or registration is currently not open.'}
              </p>
              <p>Check back next year or explore other events.</p>

              <div className="mt-4">
                <Link href="/events" className="btn btn-primary me-3">
                  <i className="icofont-calendar me-2"></i>
                  View Other Events
                </Link>
                <Link href="/noai" className="btn btn-outline-primary">
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

function EventSidebar({ event }: { event: NOAIEvent }) {
  const eventYear = new Date(event.start_date).getFullYear();

  return (
    <div className="apply-sidebar" data-aos="fade-left">
      {/* Event Summary Card */}
      <div className="sidebar-card event-summary-card">
        <div className="card-header">
          <span className="badge">NOAI {eventYear}</span>
        </div>
        <div className="card-body">
          <ul className="info-list">
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
                <span>{event.max_attendees} Students Selected</span>
              </li>
            )}
            {event.registration_deadline && (
              <li>
                <i className="icofont-alarm"></i>
                <span>
                  Deadline:{' '}
                  {new Date(event.registration_deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
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
          <i className="icofont-link"></i> Resources
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
          <Link href="/noai/faq" className="btn btn-outline-primary">
            <i className="icofont-question-circle me-2"></i>
            FAQ
          </Link>
        </div>
      </div>

      {/* Contact Card */}
      <div className="sidebar-card contact-card">
        <h4>
          <i className="icofont-question-circle"></i> Questions?
        </h4>
        <p>Have questions about the application process?</p>
        <a
          href="mailto:abigail@deeplearningindaba.com"
          className="contact-link"
        >
          <i className="icofont-email"></i>
          abigail@deeplearningindaba.com
        </a>
      </div>
    </div>
  );
}
