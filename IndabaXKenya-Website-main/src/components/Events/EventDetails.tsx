// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT DETAILS COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Detailed view for individual events
// Updated: Dec 30, 2025 - Use AuthContext for instant auth checks
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSwal } from "@/lib/sweetalert";
import PostContent from "@/components/Common/PostContent";
import { useAuth } from "@/contexts/AuthContext";
import type { EventDetail, ApiSuccessResponse } from "@/types/api";

interface EventDetailsProps {
  eventId: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({ eventId }) => {
  const router = useRouter();
  const { user, logout } = useAuth(); // Use AuthContext for instant auth check
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checkingRegistration, setCheckingRegistration] = useState(false);

  // Handle register button click - check if registration is available BEFORE navigating
  const handleRegisterClick = async () => {
    if (!event) return;
    const Swal = await getSwal();

    // Check if user is logged in first (instant from AuthContext)
    if (!user) {
      await Swal.fire({
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

    // Check if user is an admin - admins must log in as regular users to register
    if (user.role === 'admin' || user.role === 'super_admin') {
      const result = await Swal.fire({
        icon: 'info',
        title: 'Admin Account Detected',
        html: `You are currently logged in as an <strong>admin</strong>.<br><br>To register for events, please log in with your <strong>personal/applicant account</strong>.`,
        confirmButtonText: 'Log Out & Switch Account',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      if (result.isConfirmed) {
        // Log out the admin and redirect to login page
        await logout();
        router.push(`/login?redirect=/events/${event.slug}/register`);
      }
      return;
    }

    // OPTIMIZED: Single API call to check everything
    setCheckingRegistration(true);
    try {
      const response = await fetch(`/api/events/${event.slug}/registration-status`);
      const result = await response.json();

      if (!result.success || !result.data?.event) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to check registration status. Please try again.',
          confirmButtonColor: '#0d6efd',
        });
        return;
      }

      const { canRegister, canModify, reason, registration } = result.data;

      // Already registered and can't modify
      if (registration?.status === 'completed' && !canModify) {
        const swalResult = await Swal.fire({
          icon: 'info',
          title: 'Already Registered!',
          html: `You have already registered for <strong>${event.title}</strong>.<br><br>${reason || 'Check your dashboard to view your registration.'}`,
          confirmButtonText: 'View Dashboard',
          showCancelButton: true,
          cancelButtonText: 'Stay Here',
          confirmButtonColor: '#198754',
          cancelButtonColor: '#6c757d',
        });
        if (swalResult.isConfirmed) {
          router.push('/dashboard');
        }
        return;
      }

      // Already registered but CAN modify
      if (registration?.status === 'completed' && canModify) {
        const confirmModify = await Swal.fire({
          icon: 'question',
          title: 'Modify Registration?',
          html: `You have already registered for <strong>${event.title}</strong>.<br><br>Do you want to modify your registration?`,
          confirmButtonText: 'Yes, Modify',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#ffc107',
          cancelButtonColor: '#6c757d',
        });
        if (confirmModify.isConfirmed) {
          router.push(`/events/${event.slug}/register`);
        }
        return;
      }

      // Can't register (deadline passed, not enabled, no form)
      if (!canRegister) {
        await Swal.fire({
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
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to check registration status. Please try again.',
        confirmButtonColor: '#0d6efd',
      });
    } finally {
      setCheckingRegistration(false);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/events/${eventId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Event not found');
          } else {
            throw new Error('Failed to fetch event details');
          }
          return;
        }

        const result: ApiSuccessResponse<EventDetail> = await response.json();
        setEvent(result.data);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="event-details-area ptb-120">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading event...</span>
            </div>
            <p className="mt-3">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-details-area ptb-120">
        <div className="container">
          <div className="event-not-found">
            <i className="icofont-calendar"></i>
            <h2>Event Not Found</h2>
            <p>The event you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/events" className="btn btn-primary">
              <i className="icofont-arrow-left"></i> Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const eventSpeakers = event.event_speakers || [];
  const scheduleItems = event.schedule_items || [];

  // Helper function to check if event is upcoming
  const isEventUpcoming = (event: EventDetail): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.end_date || event.start_date);
    return eventDate >= today;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="event-details-area ptb-120">
      <div className="container">
        {/* Breadcrumb */}
        <div className="event-breadcrumb" data-aos="fade-up">
          <Link href="/events">
            <i className="icofont-arrow-left"></i> Back to Events
          </Link>
        </div>

        {/* Event Header */}
        <div className="event-header" data-aos="fade-up">
          {event.is_featured && (
            <div className="featured-badge">
              <i className="icofont-star"></i> Featured Event
            </div>
          )}
          {!isEventUpcoming(event) && (
            <div className="past-badge">
              <i className="icofont-history"></i> Past Event
            </div>
          )}
          <h1>{event.title}</h1>
          {event.theme && (
            <p className="event-theme-subtitle">
              <i className="icofont-quote-left"></i> {event.theme}
            </p>
          )}
          <div className="event-meta">
            <div className="meta-item">
              <i className="icofont-calendar"></i>
              <span>
                {formatDate(event.start_date)}
                {event.end_date && ` - ${formatShortDate(event.end_date)}`}
              </span>
            </div>
            {event.location && (
              <div className="meta-item">
                <i className="icofont-location-pin"></i>
                <span>{event.location}</span>
              </div>
            )}
            {event.venue && (
              <div className="meta-item">
                <i className="icofont-building-alt"></i>
                <span>{event.venue}</span>
              </div>
            )}
            {event.format && (
              <div className="meta-item">
                <i className={
                  event.format === 'physical' ? 'icofont-users-alt-4' :
                  event.format === 'hybrid' ? 'icofont-share' :
                  'icofont-web'
                }></i>
                <span>
                  {event.format === 'physical' ? 'In-Person' :
                   event.format === 'hybrid' ? 'Hybrid Event' :
                   'Virtual Event'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Event Image */}
        {event.featured_image && (
          <div className="event-image-wrapper" data-aos="fade-up">
            <Image
              src={event.featured_image}
              alt={event.title}
              width={800}
              height={300}
              className="event-image"
              style={{ objectFit: 'contain' }}
            />
          </div>
        )}

        <div className="row">
          {/* Event Content */}
          <div className="col-lg-8">
            <div className="event-content" data-aos="fade-up">
              <PostContent htmlContent={event.description || ""} />
            </div>
          </div>

          {/* Event Sidebar */}
          <div className="col-lg-4">
            <div className="event-sidebar" data-aos="fade-up">
              {/* Registration CTA */}
              {isEventUpcoming(event) && event.registration_enabled && (
                <div className="sidebar-widget register-widget">
                  <h4>Register Now</h4>
                  <p>Secure your spot at {event.title}</p>
                  {(!event.registration_deadline || new Date(event.registration_deadline) > new Date()) ? (
                    <button
                      onClick={handleRegisterClick}
                      className="btn btn-primary w-100"
                      disabled={checkingRegistration}
                    >
                      {checkingRegistration ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Checking...
                        </>
                      ) : (
                        <>
                          <i className="icofont-ticket"></i> Register Now
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="alert alert-warning">
                      <i className="icofont-close-circled"></i> Registration deadline has passed
                    </div>
                  )}
                </div>
              )}

              {/* Event Info */}
              <div className="sidebar-widget info-widget">
                <h4>Event Information</h4>
                <ul className="info-list">
                  <li>
                    <strong>
                      <i className="icofont-calendar"></i> Date:
                    </strong>
                    <span>{formatShortDate(event.start_date)}</span>
                  </li>
                  {event.end_date && (
                    <li>
                      <strong>
                        <i className="icofont-calendar"></i> End Date:
                      </strong>
                      <span>{formatShortDate(event.end_date)}</span>
                    </li>
                  )}
                  {event.location && (
                    <li>
                      <strong>
                        <i className="icofont-location-pin"></i> Location:
                      </strong>
                      <span>{event.location}</span>
                    </li>
                  )}
                  {event.venue && (
                    <li>
                      <strong>
                        <i className="icofont-building-alt"></i> Venue:
                      </strong>
                      <span>{event.venue}</span>
                    </li>
                  )}
                  {event.format && (
                    <li>
                      <strong>
                        <i className={
                          event.format === 'physical' ? 'icofont-users-alt-4' :
                          event.format === 'hybrid' ? 'icofont-share' :
                          'icofont-web'
                        }></i> Format:
                      </strong>
                      <span>
                        {event.format === 'physical' ? 'In-Person' :
                         event.format === 'hybrid' ? 'Hybrid' :
                         'Virtual'}
                      </span>
                    </li>
                  )}
                  {event.edition && (
                    <li>
                      <strong>
                        <i className="icofont-award"></i> Edition:
                      </strong>
                      <span>{event.edition}</span>
                    </li>
                  )}
                  <li>
                    <strong>
                      <i className="icofont-tags"></i> Category:
                    </strong>
                    <span className="event-type-badge">{event.event_type}</span>
                  </li>
                  {/* Issue #26 FIX: Share link in Event Information */}
                  <li className="share-link-row">
                    <strong>
                      <i className="icofont-share"></i> Share:
                    </strong>
                    <button
                      className="btn btn-sm btn-outline-primary copy-link-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href)
                        const btn = document.querySelector('.copy-link-btn')
                        if (btn) {
                          btn.textContent = 'Copied!'
                          setTimeout(() => {
                            btn.innerHTML = '<i class="icofont-link"></i> Copy Link'
                          }, 2000)
                        }
                      }}
                    >
                      <i className="icofont-link"></i> Copy Link
                    </button>
                  </li>
                </ul>
              </div>

              {/* Partners Widget */}
              {event.partners && Array.isArray(event.partners) && event.partners.length > 0 && (
                <div className="sidebar-widget partners-widget">
                  <h4>
                    <i className="icofont-handshake-deal"></i> Event Partners
                  </h4>
                  <ul className="partners-list">
                    {event.partners.map((partner, index) => (
                      <li key={index}>
                        <i className="icofont-check-circled"></i> {partner}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* External Link Widget */}
              {event.external_link && (
                <div className="sidebar-widget external-link-widget">
                  <h4>
                    <i className="icofont-link"></i> Related Links
                  </h4>
                  <a
                    href={event.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary w-100"
                  >
                    <i className="icofont-trophy me-2"></i>
                    {event.external_link_label || 'View More'}
                  </a>
                </div>
              )}

              {/* Schedule Widget */}
              {scheduleItems.length > 0 && (
                <div className="sidebar-widget schedule-widget">
                  <h4>
                    <i className="icofont-clock-time"></i> Event Schedule
                  </h4>
                  <p>
                    This event has a detailed schedule with {scheduleItems.length} session{scheduleItems.length !== 1 ? 's' : ''} planned.
                  </p>
                  <Link href="/schedule" className="btn btn-primary w-100">
                    <i className="icofont-calendar"></i> View Full Schedule
                  </Link>
                </div>
              )}

              {/* Share Widget */}
              <div className="sidebar-widget share-widget">
                <h4>Share Event</h4>
                <div className="share-buttons">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn twitter"
                  >
                    <i className="icofont-twitter"></i>
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn facebook"
                  >
                    <i className="icofont-facebook"></i>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn linkedin"
                  >
                    <i className="icofont-linkedin"></i>
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(window.location.href)}`}
                    className="share-btn email"
                  >
                    <i className="icofont-envelope"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Speakers - Full Width Section (Issue #41 FIX) */}
        {eventSpeakers.length > 0 && (
          <div className="event-speakers-fullwidth" data-aos="fade-up">
            <h3>
              <i className="icofont-users-alt-4"></i> Featured Speakers
            </h3>
            <div className="row">
              {eventSpeakers.map((es) => (
                <div key={es.id} className="col-md-6 col-lg-3">
                  <div className="speaker-mini-card">
                    {es.speaker.photo_url && (
                      <Image
                        src={es.speaker.photo_url}
                        alt={es.speaker.name}
                        width={150}
                        height={150}
                        className="speaker-photo"
                      />
                    )}
                    <h5>{es.speaker.name}</h5>
                    <p className="speaker-title">{es.speaker.title}</p>
                    <p className="speaker-org">{es.speaker.organization}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link href="/speakers" className="btn btn-secondary">
                View All Speakers <i className="icofont-arrow-right"></i>
              </Link>
            </div>
          </div>
        )}

        {/* Related Events - TODO: Add separate API call for related events */}
      </div>
    </div>
  );
};

export default EventDetails;
