// ═══════════════════════════════════════════════════════════════════════
// EVENT SCHEDULE SECTION - Displays schedule for a specific event
// ═══════════════════════════════════════════════════════════════════════
// Fetches event ID by slug, then displays the full schedule
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  session_type: string;
  speaker?: string;
  location: string | null;
  description: string | null;
}

interface ScheduleDay {
  day_number: number;
  day_name: string;
  schedule_date: string | null;
  sessions: Session[];
}

interface EventScheduleSectionProps {
  eventSlug: string;
}

const EventScheduleSection: React.FC<EventScheduleSectionProps> = ({ eventSlug }) => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get event ID from slug
        const eventResponse = await fetch(`/api/events/${eventSlug}`);
        if (!eventResponse.ok) {
          setSchedule([]);
          return;
        }
        const eventData = await eventResponse.json();
        const eventId = eventData.data?.id;
        setEventTitle(eventData.data?.title || "");

        if (!eventId) {
          setSchedule([]);
          return;
        }

        // Then fetch schedule for this event
        const scheduleResponse = await fetch(`/api/schedule?event_id=${eventId}`);
        if (!scheduleResponse.ok) {
          setSchedule([]);
          return;
        }

        const scheduleData = await scheduleResponse.json();
        setSchedule(scheduleData.data?.schedule || []);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [eventSlug]);

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
      case "hackathon":
        return "icofont-code";
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
      case "registration":
        return "#607D8B";
      case "closing":
        return "#E91E63";
      case "hackathon":
        return "#00BCD4";
      default:
        return "#666";
    }
  };

  const formatTime = (time: string) => {
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Don't render anything if no schedule
  if (!loading && schedule.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="schedule-area ptb-120 bg-image" id="schedule">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading schedule...</span>
            </div>
            <p className="mt-3">Loading event schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  const dayCount = schedule.length;

  return (
    <div className="schedule-area ptb-120 bg-image" id="schedule">
      <div className="container">
        <div className="section-title">
          <span>EVENT SCHEDULE</span>
          <h2>
            {dayCount}-Day <b>Program</b>
          </h2>
          <div className="bar"></div>
          <p className="section-description">
            Full program with keynotes, workshops, panels, and networking sessions
          </p>
        </div>

        <div className="row">
          <div className="col-lg-12">
            <Tabs
              selectedIndex={activeTab}
              onSelect={(index) => setActiveTab(index)}
            >
              <TabList className="schedule-tabs">
                {schedule.map((day) => (
                  <Tab key={day.day_number}>
                    <div className="tab-content-wrapper">
                      <span className="day-label">{day.day_name}</span>
                      <span className="date-label">{day.schedule_date || ""}</span>
                    </div>
                  </Tab>
                ))}
              </TabList>

              {schedule.map((day) => (
                <TabPanel key={day.day_number}>
                  <div className="schedule-timeline">
                    {day.sessions.map((session, index) => (
                      <div
                        className="single-schedule-item"
                        key={session.id}
                        data-aos="fade-up"
                        data-aos-duration="1000"
                        data-aos-delay={Math.min(index * 50, 300)}
                      >
                        <div className="schedule-time">
                          <span>{formatTime(session.start_time)}</span>
                          <span className="time-separator">-</span>
                          <span>{formatTime(session.end_time)}</span>
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
                                backgroundColor: getSessionColor(session.session_type),
                              }}
                            >
                              {session.session_type}
                            </span>
                          </div>
                          {session.description && (
                            <p className="session-description">
                              {session.description}
                            </p>
                          )}
                          {session.location && (
                            <p className="session-location">
                              <i className="icofont-location-pin"></i>{" "}
                              {session.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabPanel>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventScheduleSection;
