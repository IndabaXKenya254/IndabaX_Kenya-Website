"use client";

import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { useScheduleItems } from "@/hooks/useApi";

interface Session {
  id: string;
  time: string;
  title: string;
  session_type: string;
  speaker?: string;
  location: string;
  description: string;
}

interface ScheduleDay {
  day_number: number;
  day_name: string;
  schedule_date: string | null;
  sessions: Session[];
}

interface EventInfo {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

interface EventSchedulesProps {
  eventId?: string;
  showEventTitle?: boolean;
  isPreview?: boolean; // For home page - show first 3 sessions per day
}

const EventSchedules: React.FC<EventSchedulesProps> = ({
  eventId,
  showEventTitle = true,
  isPreview = false
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // React Query hook with automatic caching and deduplication
  const { data, isLoading: loading, isError } = useScheduleItems(eventId);

  const schedule: ScheduleDay[] = data?.schedule || [];
  const event: EventInfo | null = data?.event || null;
  const error = isError ? 'An error occurred while loading the schedule' : null;

  const getSessionIcon = (type: string) => {
    switch (type) {
      case "keynote":
        return "icofont-microphone";
      case "workshop":
        return "icofont-tools-alt-2";
      case "panel":
        return "icofont-users-alt-4";
      case "track":
        return "icofont-paper";
      case "break":
        return "icofont-ui-food";
      case "social":
        return "icofont-users-social";
      case "special":
        return "icofont-star";
      case "registration":
        return "icofont-id-card";
      case "closing":
        return "icofont-flag-alt-2";
      default:
        return "icofont-calendar";
    }
  };

  const getSessionColor = (type: string) => {
    switch (type) {
      case "keynote":
        return "#FF2D55";
      case "workshop":
        return "#00ACEE";
      case "panel":
        return "#FFA500";
      case "track":
        return "#9C27B0";
      case "break":
        return "#4CAF50";
      case "social":
        return "#FF6B6B";
      case "special":
        return "#FFD700";
      default:
        return "#666";
    }
  };

  if (loading) {
    return (
      <div className="schedule-area ptb-120 bg-image">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-area ptb-120 bg-image">
        <div className="container">
          <div className="alert alert-warning text-center" role="alert">
            <i className="icofont-warning"></i> {error}
          </div>
        </div>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="schedule-area ptb-120 bg-image">
        <div className="container">
          <div className="text-center py-5">
            <p className="text-muted">No schedule available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic title and subtitle
  const dayCount = schedule.length;
  const eventName = event?.title || 'Event';
  const scheduleTitle = showEventTitle && event?.title
    ? event.title
    : `${eventName} Schedule`;
  const scheduleSubtitle = dayCount > 0
    ? `${dayCount}-Day Program`
    : 'Program';

  // Extract first paragraph from description
  const getExcerpt = (htmlContent: string) => {
    // Extract first paragraph (text between first <p> and </p>)
    const match = htmlContent.match(/<p>(.*?)<\/p>/);
    return match ? match[1] : '';
  };

  return (
    <>
      <div className="schedule-area ptb-120 bg-image">
        <div className="container">
          <div className="section-title">
            <span>{scheduleSubtitle}</span>
            <h2>{scheduleTitle}</h2>
            <div className="bar"></div>
            <p className="section-description">
              Explore the full schedule with keynote speeches, hands-on workshops, and networking opportunities.
            </p>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <Tabs
                selectedIndex={activeTab}
                onSelect={(index) => setActiveTab(index)}
              >
                <TabList className="schedule-tabs">
                  {schedule.map((day, index) => (
                    <Tab key={day.day_number}>
                      <div className="tab-content-wrapper">
                        <span className="day-label">{day.day_name}</span>
                        <span className="date-label">{day.schedule_date || ''}</span>
                      </div>
                    </Tab>
                  ))}
                </TabList>

                {schedule.map((day) => {
                  // For preview mode (home page), show only first 3 sessions
                  const sessionsToShow = isPreview ? day.sessions.slice(0, 3) : day.sessions;

                  return (
                    <TabPanel key={day.day_number}>
                      <div className="schedule-timeline">
                        {sessionsToShow.map((session, index) => (
                          <div
                            className="single-schedule-item"
                            key={session.id}
                            data-aos="fade-up"
                            data-aos-duration="1000"
                            data-aos-delay={index * 50}
                          >
                            <div className="schedule-time">
                              <span>{session.time}</span>
                            </div>
                            <div
                              className="schedule-icon"
                              style={{
                                backgroundColor: `${getSessionColor(session.session_type)}20`,
                              }}
                            >
                              <i
                                className={getSessionIcon(session.session_type)}
                                style={{ color: getSessionColor(session.session_type) }}
                              ></i>
                            </div>
                            <div className="schedule-content">
                              <div className="schedule-header">
                                <h3>{session.title}</h3>
                                <span
                                  className="session-type-badge"
                                  style={{
                                    backgroundColor: getSessionColor(
                                      session.session_type
                                    ),
                                  }}
                                >
                                  {session.session_type}
                                </span>
                              </div>
                              {session.speaker && (
                                <p className="speaker-name">
                                  <i className="icofont-user-alt-3"></i>{" "}
                                  {session.speaker}
                                </p>
                              )}
                              {session.location && (
                                <p className="session-location">
                                  <i className="icofont-location-pin"></i>{" "}
                                  {session.location}
                                </p>
                              )}
                              {session.description && (
                                <p className="session-description">
                                  {session.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {isPreview && day.sessions.length > 3 && (
                          <div className="text-center mt-4">
                            <small className="text-muted">
                              + {day.sessions.length - 3} more sessions
                            </small>
                          </div>
                        )}
                      </div>
                    </TabPanel>
                  );
                })}
              </Tabs>
            </div>
          </div>

          {isPreview && (
            <div className="text-center mt-5">
              <a
                href="/schedule"
                className="btn btn-primary btn-lg"
              >
                View Full Schedule
                <i className="icofont-double-right"></i>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EventSchedules;
