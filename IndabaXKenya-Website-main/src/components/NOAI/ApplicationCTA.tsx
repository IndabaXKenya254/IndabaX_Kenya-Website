// ═══════════════════════════════════════════════════════════════════════
// NOAI - APPLICATION CALL TO ACTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Dynamic CTA banner with deadline countdown from database
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface NOAIEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_deadline: string | null;
  max_attendees: number | null;
}

interface ApplicationCTAProps {
  variant?: "banner" | "section" | "compact";
  showCountdown?: boolean;
}

const ApplicationCTA: React.FC<ApplicationCTAProps> = ({
  variant = "section",
  showCountdown = true,
}) => {
  const [event, setEvent] = useState<NOAIEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  // Fetch current NOAI event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch('/api/events/noai/current');
        const result = await response.json();
        if (result.success && result.data) {
          setEvent(result.data);
        }
      } catch (error) {
        console.error('Error fetching NOAI event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!event || !event.registration_deadline) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const deadline = new Date(event.registration_deadline!);
      const difference = deadline.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [event]);

  // Show loading state
  if (loading || !event) {
    return null;
  }

  const eventYear = new Date(event.start_date).getFullYear();
  const deadlineFormatted = event.registration_deadline
    ? new Date(event.registration_deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBD';

  if (variant === "banner") {
    return (
      <div className="noai-cta-banner">
        <div className="container">
          <div className="banner-content">
            <div className="banner-text">
              <span className="badge">NOAI {eventYear}</span>
              <h4>Apply for the National Olympiad in AI</h4>
              <p>
                <i className="icofont-alarm me-1"></i>
                Deadline: {deadlineFormatted}
              </p>
            </div>
            {showCountdown && !isExpired && event.registration_deadline && (
              <div className="countdown-mini">
                <span>{timeLeft.days}d</span>
                <span>{timeLeft.hours}h</span>
                <span>{timeLeft.minutes}m</span>
              </div>
            )}
            <Link href="/noai/apply" className="btn btn-light">
              <i className="icofont-pencil-alt-2 me-2"></i>
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="noai-cta-compact" data-aos="fade-up">
        <div className="cta-icon">
          <i className="icofont-paper-plane"></i>
        </div>
        <div className="cta-text">
          <h5>Ready to Represent Kenya?</h5>
          <p>
            <i className="icofont-alarm me-1"></i>
            Application deadline: {deadlineFormatted}
          </p>
        </div>
        <Link href="/noai/apply" className="btn btn-primary">
          <i className="icofont-pencil-alt-2 me-2"></i>
          Apply Now
          <i className="icofont-arrow-right ms-2"></i>
        </Link>
      </div>
    );
  }

  // Default: section variant
  const eventStartDate = new Date(event.start_date);
  const eventEndDate = new Date(event.end_date);
  const monthName = eventStartDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const startDay = eventStartDate.getDate();
  const endDay = eventEndDate.getDate();

  return (
    <div className="noai-cta-section ptb-120">
      <div className="container">
        <div className="cta-wrapper" data-aos="fade-up">
          <div className="row align-items-center">
            <div className="col-lg-7 col-md-12">
              <div className="cta-content">
                <span className="badge-label">
                  <i className="icofont-trophy me-1"></i>
                  NOAI {eventYear} - {event.location}
                </span>
                <h2>
                  Represent Kenya at the <b>National Olympiad in AI</b>
                </h2>
                <p>
                  {event.max_attendees || 4} high school students will be selected to showcase their AI
                  skills. Your application will be reviewed by our expert panel.
                </p>

                {!isExpired ? (
                  <>
                    {showCountdown && event.registration_deadline && (
                      <div className="countdown-wrapper">
                        <p className="countdown-label">
                          <i className="icofont-alarm me-2"></i>
                          Application closes in:
                        </p>
                        <div className="countdown-grid">
                          <div className="countdown-item">
                            <span className="number">{timeLeft.days}</span>
                            <span className="label">Days</span>
                          </div>
                          <div className="countdown-item">
                            <span className="number">{timeLeft.hours}</span>
                            <span className="label">Hours</span>
                          </div>
                          <div className="countdown-item">
                            <span className="number">{timeLeft.minutes}</span>
                            <span className="label">Minutes</span>
                          </div>
                          <div className="countdown-item">
                            <span className="number">{timeLeft.seconds}</span>
                            <span className="label">Seconds</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="cta-buttons">
                      <Link href="/noai/apply" className="btn btn-primary btn-lg">
                        <i className="icofont-pencil-alt-2 me-2"></i>
                        Apply Now
                        <i className="icofont-arrow-right ms-2"></i>
                      </Link>
                      <Link href={`/noai/${eventYear}`} className="btn btn-outline-primary btn-lg">
                        <i className="icofont-info-circle me-2"></i>
                        Learn More
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="deadline-passed alert alert-warning">
                    <i className="icofont-clock-time me-2"></i>
                    Application deadline has passed. Check back next year!
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-5 col-md-12">
              <div className="cta-visual">
                <div className="event-card">
                  <div className="event-date">
                    <span className="month">{monthName}</span>
                    <span className="day">{startDay}-{endDay}</span>
                    <span className="year">{eventYear}</span>
                  </div>
                  <div className="event-info">
                    <h4>NOAI {eventYear}</h4>
                    <p>
                      <i className="icofont-location-pin"></i> {event.location}
                    </p>
                    <p>
                      <i className="icofont-users-alt-4"></i> {event.max_attendees || 4} Students Selected
                    </p>
                    <p>
                      <i className="icofont-certificate-alt-1"></i> High School Students
                    </p>
                    {event.registration_deadline && (
                      <p>
                        <i className="icofont-alarm"></i> Apply by {deadlineFormatted}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCTA;
