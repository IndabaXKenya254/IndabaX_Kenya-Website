// ═══════════════════════════════════════════════════════════════════════
// SERVER COMPONENT - Previous Editions (December 2025)
// ═══════════════════════════════════════════════════════════════════════
// Displays past IndabaX Kenya editions organized by year
// Data is fetched server-side for optimal performance (SSR/SSG)
// Interactive year tabs handled by client component (EditionTabs)
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import type { Event, Photo } from "@/types/api";
import { createPublicClient, getCurrentEventYear } from "@/lib/supabase";
import EditionTabs from "./EditionTabs";

interface EditionData {
  year: number;
  event: Event | null;
  photos: Photo[];
  highlights: {
    attendees?: number;
    speakers?: number;
    workshops?: number;
    countries?: number;
  };
}

// Server-side data fetching
async function getEditionsData(): Promise<EditionData[]> {
  try {
    const supabase = createPublicClient();

    // Fetch current event year with NO CACHING (prevents stale data)
    // This is fetched separately to ensure fresh settings
    const currentEventYear = await getCurrentEventYear();

    // Fetch events and photos in parallel
    const [eventsResult, photosResult] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false }),
      supabase
        .from('photos')
        .select('*')
        .neq('category', 'NOAI')
        .order('year', { ascending: false })
        .limit(100),
    ]);

    if (eventsResult.error) {
      console.error('Error fetching events:', eventsResult.error);
    }
    if (photosResult.error) {
      console.error('Error fetching photos:', photosResult.error);
    }

    const events = (eventsResult.data || []) as Event[];
    const photos = (photosResult.data || []) as Photo[];

    // Filter past events (IndabaX main events, before current event year)
    const today = new Date();

    const pastEvents = events.filter(event => {
      const eventEndDate = new Date(event.end_date || event.start_date);
      const eventYear = new Date(event.start_date).getFullYear();
      const isIndabaX = event.event_category === 'indabax' || !event.event_category;
      const hasEnded = eventEndDate.getTime() < today.getTime();
      const isHistorical = eventYear < currentEventYear;

      // Include all ended IndabaX events from years before current event year
      return hasEnded && isHistorical && isIndabaX;
    });

    // Get unique years from past events only
    const eventYears = new Set<number>();
    pastEvents.forEach(event => {
      const year = new Date(event.start_date).getFullYear();
      eventYears.add(year);
    });

    // Filter photos to only include past years (before current event year)
    const pastPhotos = photos.filter(photo => {
      const photoYear = typeof photo.year === 'string' ? parseInt(photo.year) : photo.year;
      return photoYear && photoYear < currentEventYear;
    });

    // Also get years from past photos
    pastPhotos.forEach(photo => {
      const photoYear = typeof photo.year === 'string' ? parseInt(photo.year) : photo.year;
      if (photoYear) eventYears.add(photoYear);
    });

    // Create editions data sorted by year (newest first)
    const sortedYears = Array.from(eventYears).sort((a, b) => b - a);

    const editionsData: EditionData[] = sortedYears.map(year => {
      const yearEvent = pastEvents.find(e =>
        new Date(e.start_date).getFullYear() === year
      ) || null;

      // Use pastPhotos (already filtered to exclude current year)
      const yearPhotos = pastPhotos.filter(p => {
        const photoYear = typeof p.year === 'string' ? parseInt(p.year) : p.year;
        return photoYear === year;
      });

      return {
        year,
        event: yearEvent,
        photos: yearPhotos.slice(0, 6), // Show max 6 photos per year
        highlights: {
          // These could come from the event metadata or be hardcoded
          attendees: yearEvent?.max_attendees || undefined,
          speakers: undefined,
          workshops: undefined,
          countries: undefined,
        }
      };
    });

    return editionsData;
  } catch (error) {
    console.error('Error fetching editions data:', error);
    return [];
  }
}

const PreviousEditions: React.FC = async () => {
  const editions = await getEditionsData();

  return (
    <div className="previous-editions-area ptb-120">
      <div className="container">
        {/* Section Header */}
        <div className="section-title">
          <span>Our Journey</span>
          <h2>
            Previous <b>Editions</b>
          </h2>
          <div className="bar"></div>
          <p className="section-description">
            Explore the rich history of IndabaX Kenya. Each edition has brought together
            passionate AI enthusiasts, researchers, and practitioners to learn, share, and grow together.
          </p>
        </div>

        {/* Edition Content - Client Component for Interactivity */}
        <EditionTabs editions={editions} />

        {/* CTA Section */}
        <div className="history-cta mt-5" data-aos="fade-up">
          <div className="cta-card">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h3>Be Part of IndabaX Kenya 2026</h3>
                <p>
                  Join us for the next edition and be part of East Africa&apos;s premier AI conference.
                  Registration is <strong>FREE for students only</strong>.
                </p>
              </div>
              <div className="col-lg-4 text-lg-end">
                <Link href="/register" className="btn btn-primary btn-lg">
                  Register Now <i className="icofont-arrow-right"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviousEditions;
