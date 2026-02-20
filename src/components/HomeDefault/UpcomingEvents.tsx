// ═══════════════════════════════════════════════════════════════════════
// SERVER COMPONENT - Phase 3 SSR Conversion (November 29, 2025)
// ═══════════════════════════════════════════════════════════════════════
// BEFORE: Client-side fetch with React Query (slow, waterfall requests)
// AFTER: Server-side data fetching (fast, parallel with page load)
// Expected Impact: 40-70% faster initial render
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/types/api";
import { createNoCachePublicClient } from "@/lib/supabase";
import { getOptimizedImageUrl, getBlurDataURL } from "@/lib/image-utils";

async function getUpcomingEvents(): Promise<Event[]> {
  try {
    // Issue #4 FIX: Use no-cache client to always show fresh event data
    const supabase = createNoCachePublicClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Issue #1 FIX: Show all upcoming events, not just featured ones
    // Featured events sort first via is_featured desc, then by date
    // Issue #4 FIX: Filter by registration_deadline (or end_date if deadline not set)
    const { data, error } = await supabase
      .from('events')
      .select('id, slug, title, description, featured_image, start_date, end_date, registration_deadline, location, venue, is_featured, event_type')
      .in('status', ['published', 'upcoming', 'ongoing'])
      .order('is_featured', { ascending: false })
      .order('start_date', { ascending: true })
      .limit(10); // Fetch more, filter client-side

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    // Filter client-side: show events where:
    // 1. registration_deadline >= today, OR
    // 2. registration_deadline is null AND (end_date >= today OR start_date >= today)
    const filteredEvents = (data || []).filter((event: any) => {
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

    return filteredEvents.slice(0, 3) as Event[];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Strip HTML tags server-side using regex
function createExcerpt(html: string | null, maxLength: number = 120): string {
  if (!html) return "Learn more about this exciting event";

  // Remove HTML tags using regex
  const text = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities (basic ones)
  const decodedText = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  // Trim and create excerpt
  if (decodedText.length <= maxLength) return decodedText.trim();
  return decodedText.substring(0, maxLength).trim() + "...";
}

const UpcomingEvents: React.FC = async () => {
  const upcomingEvents = await getUpcomingEvents();

  return (
    <>
      <div className="upcoming-events-area ptb-120">
        <div className="container">
          <div className="section-title">
            <span>Don&apos;t Miss Out</span>
            <h2>Upcoming Events</h2>
            <div className="bar"></div>
            <p className="section-description">
              Join us for IndabaX Kenya 2026 and related events. Connect with Africa&apos;s AI community and advance your machine learning journey.
            </p>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="row justify-content-center">
              {upcomingEvents.map((event, index) => (
                <div
                  className="col-lg-4 col-md-6"
                  key={event.id}
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay={index * 100}
                >
                  <div className="single-event-card">
                    <div className="event-image">
                      <Link href={`/events/${event.slug}`}>
                        <Image
                          src={getOptimizedImageUrl(event.featured_image, { width: 600, height: 400, quality: 80 }) || "/images/events/default-event.jpg"}
                          alt={event.title}
                          width={600}
                          height={400}
                          className="event-image"
                          priority={index === 0}
                          placeholder="blur"
                          blurDataURL={getBlurDataURL(10, 7)}
                        />
                      </Link>
                      <div className="event-date">
                        <span className="date-day">
                          {new Date(event.start_date).getDate()}
                        </span>
                        <span className="date-month">
                          {new Date(event.start_date).toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="event-content">
                      <h3>
                        <Link href={`/events/${event.slug}`}>{event.title}</Link>
                      </h3>

                      <ul className="event-meta">
                        <li>
                          <i className="icofont-calendar"></i>
                          {formatDate(event.start_date)}
                          {event.end_date && ` - ${formatDate(event.end_date)}`}
                        </li>
                        <li>
                          <i className="icofont-location-pin"></i>
                          {event.venue && `${event.venue}, `}{event.location}
                        </li>
                      </ul>

                      <p>{createExcerpt(event.description, 120)}</p>

                      <Link
                        href={`/events/${event.slug}`}
                        className="btn btn-primary btn-sm"
                        aria-label={`Learn more about ${event.title}`}
                      >
                        Learn More
                        <i className="icofont-double-right" aria-hidden="true"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          )}

          <div className="text-center mt-4">
            <Link href="/events" className="btn btn-secondary">
              View All Events
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpcomingEvents;
