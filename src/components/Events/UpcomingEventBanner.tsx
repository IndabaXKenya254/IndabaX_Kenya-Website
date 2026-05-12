// ═══════════════════════════════════════════════════════════════════════
// UPCOMING EVENT BANNER - Server Component with Client Countdown
// ═══════════════════════════════════════════════════════════════════════
// Displays upcoming event info with countdown timer on Events page
// Data source: banner_settings from settings table OR first upcoming event
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase";
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
}> {
  const supabase = createPublicClient();

  // First try to get banner_settings
  const { data: settingsData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'banner_settings')
    .maybeSingle();

  const settingsResult = settingsData as { value: any } | null;
  const bannerSettings = settingsResult?.value as BannerSettings | null;

  // Fetch the next upcoming event — filter at DB level so past events are never returned
  const today = new Date().toISOString().split('T')[0]
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, start_date, end_date, location, theme, slug, registration_enabled')
    .in('status', ['published', 'upcoming', 'ongoing'])
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(1);

  const upcomingEvent = upcomingEvents?.[0] as UpcomingEvent | undefined;

  // Determine if there's an upcoming event
  const now = new Date();
  let hasUpcoming = false;

  // Check banner settings date
  if (bannerSettings?.eventDate) {
    const bannerDate = new Date(bannerSettings.eventDate);
    if (bannerDate > now) {
      hasUpcoming = true;
    }
  }

  // Check upcoming event from events table
  if (upcomingEvent?.start_date) {
    const eventDate = new Date(upcomingEvent.start_date);
    if (eventDate > now) {
      hasUpcoming = true;
    }
  }

  // Return data - prefer banner_settings if available, fallback to event data
  if (bannerSettings && hasUpcoming) {
    return {
      hasUpcoming: true,
      eventTitle: bannerSettings.eventTitle || 'Upcoming Event',
      eventSubtitle: bannerSettings.eventSubtitle || '',
      eventDate: bannerSettings.eventDate,
      eventEndDate: bannerSettings.eventEndDate || bannerSettings.eventDate,
      eventLocation: bannerSettings.eventLocation || '',
      registrationUrl: bannerSettings.registrationUrl || '/register',
      showCountdown: bannerSettings.showCountdown !== false,
    };
  }

  if (upcomingEvent && hasUpcoming) {
    return {
      hasUpcoming: true,
      eventTitle: upcomingEvent.title,
      eventSubtitle: upcomingEvent.theme || '',
      eventDate: upcomingEvent.start_date,
      eventEndDate: upcomingEvent.end_date || upcomingEvent.start_date,
      eventLocation: upcomingEvent.location || '',
      registrationUrl: upcomingEvent.registration_enabled
        ? `/events/${upcomingEvent.slug}/register`
        : `/events/${upcomingEvent.slug}`,
      showCountdown: true,
    };
  }

  // No upcoming event found
  return {
    hasUpcoming: false,
    eventTitle: '',
    eventSubtitle: '',
    eventDate: '',
    eventEndDate: '',
    eventLocation: '',
    registrationUrl: '',
    showCountdown: false,
  };
}

const UpcomingEventBanner: React.FC = async () => {
  const eventData = await getUpcomingEventData();

  // Don't render if no upcoming event
  if (!eventData.hasUpcoming) {
    return null;
  }

  // Format dates for display
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
    <div className="upcoming-event-banner">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7">
            <div className="event-info">
              <span className="event-badge">Upcoming Event</span>
              <h2>{eventData.eventTitle}</h2>
              {eventData.eventSubtitle && (
                <p className="event-subtitle">{eventData.eventSubtitle}</p>
              )}
              <div className="event-meta">
                {eventData.eventLocation && (
                  <span className="meta-item">
                    <i className="icofont-location-pin"></i>
                    {eventData.eventLocation}
                  </span>
                )}
                <span className="meta-item">
                  <i className="icofont-calendar"></i>
                  {dateDisplay}
                </span>
              </div>
              <div className="event-cta">
                <Link href={eventData.registrationUrl} className="btn btn-primary">
                  Register Now <i className="icofont-arrow-right"></i>
                </Link>
              </div>
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
  );
};

export default UpcomingEventBanner;
