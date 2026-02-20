// ═══════════════════════════════════════════════════════════════════════
// SERVER COMPONENT - Phase 3 SSR Conversion (November 29, 2025)
// ═══════════════════════════════════════════════════════════════════════
// BEFORE: Client-side fetch with useEffect (slow, waterfall requests)
// AFTER: Server-side data fetching (fast, parallel with page load)
// Expected Impact: 40-70% faster initial render
// Updated: December 28, 2025 - Added speaker_year filtering
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Speaker } from "@/types/api";
import { createPublicClient } from "@/lib/supabase";
import { getOptimizedImageUrl, getBlurDataURL } from "@/lib/image-utils";

const CURRENT_YEAR = new Date().getFullYear();

async function getSpeakers(): Promise<{ speakers: Speaker[], hasMixedSpeakers: boolean }> {
  try {
    const supabase = createPublicClient();
    const MAX_SPEAKERS = 6;

    // First get current year speakers NOT marked as previous
    let { data: currentSpeakers, error: currentError } = await supabase
      .from('speakers')
      .select('id, name, title, organization, photo_url, bio_short, linkedin_url, twitter_url, website_url, is_featured, display_order, speaker_year, force_previous')
      .eq('is_featured', true)
      .eq('force_previous', false)  // Not marked as previous
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(MAX_SPEAKERS);

    if (currentError) {
      console.error('Error fetching current speakers:', currentError);
      currentSpeakers = [];
    }

    // If we have 6 current speakers, return them
    if (currentSpeakers && currentSpeakers.length >= MAX_SPEAKERS) {
      return { speakers: currentSpeakers as any, hasMixedSpeakers: false };
    }

    // Need to fill remaining slots with previous speakers
    const remainingSlots = MAX_SPEAKERS - (currentSpeakers?.length || 0);

    if (remainingSlots > 0) {
      const { data: previousSpeakers, error: prevError } = await supabase
        .from('speakers')
        .select('id, name, title, organization, photo_url, bio_short, linkedin_url, twitter_url, website_url, is_featured, display_order, speaker_year, force_previous')
        .eq('is_featured', true)
        .eq('force_previous', true)  // Only previous speakers
        .order('speaker_year', { ascending: false })
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
        .limit(remainingSlots);

      if (prevError) {
        console.error('Error fetching previous speakers:', prevError);
      }

      // Combine current and previous speakers
      const allSpeakers = [...(currentSpeakers || []), ...(previousSpeakers || [])];
      const hasMixed = (currentSpeakers?.length || 0) > 0 && (previousSpeakers?.length || 0) > 0;

      return { speakers: allSpeakers as any, hasMixedSpeakers: hasMixed || (previousSpeakers?.length || 0) > 0 };
    }

    return { speakers: (currentSpeakers as any) || [], hasMixedSpeakers: false };
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return { speakers: [], hasMixedSpeakers: false };
  }
}

const Speakers: React.FC = async () => {
  const { speakers, hasMixedSpeakers } = await getSpeakers();

  // Check if we have any current speakers
  const hasCurrentSpeakers = speakers.some(s => !s.force_previous);
  const allPreviousSpeakers = speakers.every(s => s.force_previous);

  // Get the year from previous speakers for display
  const previousYear = speakers.find(s => s.force_previous)?.speaker_year || CURRENT_YEAR - 1;

  return (
    <>
      <div className="speakers-area ptb-120 pb-0">
        <div className="container">
          <div className="section-title">
            <span>{allPreviousSpeakers ? 'Past Speakers' : 'Meet Our Experts'}</span>
            <h2>{allPreviousSpeakers ? `Speakers ${previousYear}` : `Featured Speakers ${CURRENT_YEAR}`}</h2>
            <div className="bar"></div>

            <p className="section-description">
              {allPreviousSpeakers
                ? `Check out our amazing speakers from ${previousYear}. Stay tuned for ${CURRENT_YEAR + 1} speaker announcements!`
                : "Learn from Africa's leading AI researchers, practitioners, and innovators. Our speakers bring cutting-edge expertise and real-world experience from across the continent and beyond."
              }
            </p>
          </div>
        </div>

        {speakers.length > 0 ? (
          <div className="row m-0">
            {speakers.map((speaker, index) => (
              <div
                className="col-lg-4 col-md-6 col-sm-6 p-0"
                key={speaker.id}
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay={index * 100}
              >
                <div className="single-speakers">
                  {/* Previous Speaker Badge */}
                  {speaker.force_previous && (
                    <div className="speaker-badge-previous" style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <i className="icofont-history"></i>
                      {speaker.speaker_year || 'Previous'}
                    </div>
                  )}

                  <Image
                    src={getOptimizedImageUrl(speaker.photo_url, { width: 800, height: 800, quality: 85 }) || "/images/speakers/default-speaker.jpg"}
                    alt={speaker.name}
                    width={800}
                    height={800}
                    priority={index < 3}
                    placeholder="blur"
                    blurDataURL={getBlurDataURL(10, 10)}
                  />

                  <div className="speakers-content">
                    <h3>{speaker.name}</h3>
                    <span>
                      {speaker.title} at {speaker.organization}
                    </span>
                  </div>

                  <ul>
                    {speaker.linkedin_url && (
                      <li>
                        <a
                          href={speaker.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${speaker.name} LinkedIn Profile`}
                          style={{ background: "#0077B5" }}
                        >
                          <i className="icofont-linkedin"></i>
                        </a>
                      </li>
                    )}
                    {speaker.twitter_url && (
                      <li>
                        <a
                          href={speaker.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${speaker.name} Twitter Profile`}
                          style={{ background: "#1DA1F2" }}
                        >
                          <i className="icofont-twitter"></i>
                        </a>
                      </li>
                    )}
                    {speaker.website_url && (
                      <li>
                        <a
                          href={speaker.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${speaker.name} Website`}
                          style={{ background: "#6c757d" }}
                        >
                          <i className="icofont-globe"></i>
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <p>No featured speakers at the moment. Check back soon!</p>
          </div>
        )}

        <div className="container">
          <div className="text-center mt-5 mb-5">
            <Link href="/speakers" className="btn btn-primary btn-lg">
              View All Speakers
              <i className="icofont-double-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Speakers;
