// ═══════════════════════════════════════════════════════════════════════
// EVENTS HERO BANNER - Shows Upcoming Event with Countdown
// ═══════════════════════════════════════════════════════════════════════
// Hero-style banner for Events page featuring the upcoming event
// Similar to homepage main banner but focused on events
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Image from "next/image";
import { createNoCachePublicClient } from "@/lib/supabase";
import EventCountdown from "./EventCountdown";

interface BannerSettings {
  eventDate: string;
  eventEndDate: string;
  eventLocation: string;
  eventTitle: string;
  eventSubtitle: string;
  registrationUrl: string;
  showCountdown?: boolean;
}

interface UpcomingEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  theme: string | null;
  slug: string;
  registration_enabled: boolean;
}

async function getUpcomingEventData(): Promise<{
  hasUpcoming: boolean;
  eventTitle: string;
  eventSubtitle: string;
  eventDate: string;
  eventEndDate: string;
  eventLocation: string;
  registrationUrl: string;
  showCountdown: boolean;
} | null> {
  // Issue #4 FIX: Use no-cache client to always show fresh event data
  const supabase = createNoCachePublicClient();

  // First try to get banner_settings
  const { data: settingsData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'banner_settings')
    .maybeSingle();

  const settingsResult = settingsData as { value: any } | null;
  const bannerSettings = settingsResult?.value as BannerSettings | null;

  // Also check for upcoming events in the events table
  // Issue #4 FIX: Filter by registration_deadline (or end_date if deadline not set)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, start_date, end_date, location, theme, slug, registration_enabled, registration_deadline')
    .eq('status', 'upcoming')
    .eq('registration_enabled', true)
    .order('start_date', { ascending: true })
    .limit(5); // Fetch more, filter client-side

  // Filter client-side: show events where:
  // 1. registration_deadline >= today, OR
  // 2. registration_deadline is null AND (end_date >= today OR start_date >= today)
  const filteredEvents = (upcomingEvents || []).filter((event: any) => {
    const deadline = event.registration_deadline?.split('T')[0] || event.registration_deadline;
    const endDate = event.end_date;
    const startDate = event.start_date;

    if (deadline) {
      return deadline >= today;
    }
    // No deadline set - use end_date, or start_date if no end_date
    const effectiveEndDate = endDate || startDate;
    return effectiveEndDate >= today;
  });

  const upcomingEvent = filteredEvents[0] as UpcomingEvent | undefined;

  // Issue #4 FIX: Compare dates only (ignore time) so events starting TODAY are shown
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Check if banner_settings has a future or current date
  if (bannerSettings?.eventDate) {
    const bannerDateStr = new Date(bannerSettings.eventDate).toISOString().split('T')[0];
    if (bannerDateStr >= todayDate) {
      return {
        hasUpcoming: true,
        eventTitle: bannerSettings.eventTitle || 'Upcoming Event',
        eventSubtitle: bannerSettings.eventSubtitle || 'Machine Learning & AI Conference',
        eventDate: bannerSettings.eventDate,
        eventEndDate: bannerSettings.eventEndDate || bannerSettings.eventDate,
        eventLocation: bannerSettings.eventLocation || 'Nairobi, Kenya',
        registrationUrl: bannerSettings.registrationUrl || '/register',
        showCountdown: bannerSettings.showCountdown !== false,
      };
    }
  }

  // Check upcoming event from events table
  if (upcomingEvent) {
    const eventDateStr = new Date(upcomingEvent.start_date).toISOString().split('T')[0];
    // Issue #4 FIX: Show events starting today or in the future
    if (eventDateStr >= todayDate) {
      return {
        hasUpcoming: true,
        eventTitle: upcomingEvent.title,
        eventSubtitle: upcomingEvent.theme || 'AI & Machine Learning Conference',
        eventDate: upcomingEvent.start_date,
        eventEndDate: upcomingEvent.end_date || upcomingEvent.start_date,
        eventLocation: upcomingEvent.location || 'Nairobi, Kenya',
        registrationUrl: upcomingEvent.registration_enabled
          ? `/events/${upcomingEvent.slug}/register`
          : `/events/${upcomingEvent.slug}`,
        showCountdown: true,
      };
    }
  }

  // No upcoming event found
  return null;
}

const EventsHeroBanner: React.FC = async () => {
  const eventData = await getUpcomingEventData();

  // No upcoming event - show simple banner with clear messaging
  if (!eventData) {
    return (
      <div
        className="events-hero-banner events-hero-banner--simple"
        style={{
          backgroundImage: `url(/images/main-bg4.jpg)`
        }}
        data-aos="fade-in"
        data-aos-duration="1000"
      >
        <div className="d-table">
          <div className="d-table-cell">
            <div className="container">
              <div className="events-hero-content text-center">
                <span className="event-badge event-badge--muted">Coming Soon</span>
                <h1>No Upcoming Events</h1>
                <p className="event-subtitle">
                  We&apos;re planning something exciting! Subscribe to be the first to know when we announce our next AI conference or workshop.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shape Images */}
        <div className="shape1">
          <Image src="/images/shapes/1.png" alt="shape1" width={77} height={77} />
        </div>
        <div className="shape2 rotateme">
          <Image src="/images/shapes/2.png" alt="shape2" width={38} height={38} />
        </div>
      </div>
    );
  }

  // Has upcoming event - show full banner with countdown
  const startDate = new Date(eventData.eventDate);
  const endDate = new Date(eventData.eventEndDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const dateDisplay = eventData.eventDate === eventData.eventEndDate
    ? formatDate(startDate)
    : `${formatDate(startDate)} - ${formatDate(endDate)}`;

  return (
    <div
      className="events-hero-banner"
      style={{
        backgroundImage: `url(/images/main-bg4.jpg)`
      }}
      data-aos="fade-in"
      data-aos-duration="1000"
    >
      <div className="d-table">
        <div className="d-table-cell">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-7">
                <div className="events-hero-content">
                  <span className="event-badge">Upcoming Event</span>
                  <h1>{eventData.eventTitle}</h1>
                  <p className="event-subtitle">{eventData.eventSubtitle}</p>

                  <ul className="event-meta">
                    <li>
                      <i className="icofont-calendar"></i> {dateDisplay}
                    </li>
                    <li>
                      <i className="icofont-location-pin"></i> {eventData.eventLocation}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-5">
                {eventData.showCountdown && (
                  <EventCountdown endDate={eventData.eventDate} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shape Images */}
      <div className="shape1">
        <Image
          src="/images/shapes/1.png"
          alt="shape1"
          width={77}
          height={77}
        />
      </div>
      <div className="shape2 rotateme">
        <Image
          src="/images/shapes/2.png"
          alt="shape2"
          width={38}
          height={38}
        />
      </div>
      <div className="shape3 rotateme">
        <Image
          src="/images/shapes/3.png"
          alt="shape3"
          width={51}
          height={57}
        />
      </div>
      <div className="shape4">
        <Image
          src="/images/shapes/4.png"
          alt="shape4"
          width={29}
          height={29}
        />
      </div>
    </div>
  );
};

export default EventsHeroBanner;
