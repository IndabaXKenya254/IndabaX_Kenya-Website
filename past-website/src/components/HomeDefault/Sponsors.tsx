// ═══════════════════════════════════════════════════════════════════════
// SERVER COMPONENT - HomeDefault Sponsors (Restored Original UI)
// ═══════════════════════════════════════════════════════════════════════
// Homepage sponsors section - simple grid layout (original design)
// Added: Previous badge for force_previous=true sponsors
// NO CACHING - Always fetch fresh data
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Sponsor } from "@/types/api";
import { createPublicClient } from "@/lib/supabase";

// Disable caching for this component
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CURRENT_YEAR = new Date().getFullYear();

async function getSponsors(): Promise<Sponsor[]> {
  try {
    const supabase = createPublicClient();

    // Get all active sponsors, ordered by display
    const { data, error } = await supabase
      .from('sponsors')
      .select('id, name, logo_url, website_url, tier, display_order, is_active, sponsor_year, force_previous')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching sponsors:', error);
      return [];
    }

    return (data as Sponsor[]) || [];
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return [];
  }
}

const Sponsors: React.FC = async () => {
  const sponsors = await getSponsors();

  // Check if all sponsors are "previous"
  const allPrevious = sponsors.length > 0 && sponsors.every(s => s.force_previous);
  const sponsorYear = sponsors[0]?.sponsor_year || CURRENT_YEAR;

  return (
    <div className="partner-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>{allPrevious ? 'Past Sponsors' : 'Our Supporters'}</span>
          <h2>{allPrevious ? `Sponsors ${sponsorYear}` : 'Partners & Sponsors'}</h2>
          <div className="bar"></div>
          {allPrevious && (
            <p className="section-description">
              Thank you to our {sponsorYear} sponsors! Stay tuned for {CURRENT_YEAR + 1} sponsor announcements.
            </p>
          )}
        </div>

        {sponsors.length > 0 ? (
          <div className="partner-grid">
            <div className="row g-4 justify-content-center">
              {sponsors.map((sponsor, index) => (
                <div
                  className="col-lg-3 col-md-4 col-sm-6 col-6"
                  key={sponsor.id}
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay={index * 50}
                >
                  <div className="single-partner-item" style={{ position: 'relative' }}>
                    {/* Previous Sponsor Badge */}
                    {sponsor.force_previous && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        zIndex: 10,
                      }}>
                        {sponsor.sponsor_year || 'Previous'}
                      </span>
                    )}
                    <a
                      href={sponsor.website_url || "#"}
                      target={sponsor.website_url ? "_blank" : "_self"}
                      rel={sponsor.website_url ? "noopener noreferrer" : undefined}
                      aria-label={`Visit ${sponsor.name} website`}
                    >
                      <div className="partner-logo">
                        {sponsor.logo_url ? (
                          <Image
                            src={sponsor.logo_url}
                            alt={sponsor.name}
                            width={200}
                            height={100}
                            style={{ objectFit: 'contain' }}
                          />
                        ) : (
                          <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                            <i className="icofont-building" style={{ fontSize: '40px' }}></i>
                          </div>
                        )}
                      </div>
                      <span className="partner-name">{sponsor.name}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-5">
            <p>No sponsors at this time.</p>
          </div>
        )}

        <div className="text-center mt-5">
          <p className="sponsor-cta">
            Interested in sponsoring IndabaX Kenya {CURRENT_YEAR + 1}?{" "}
            <Link href="/contact" className="sponsor-link">
              Contact us
            </Link>{" "}
            to learn about sponsorship opportunities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sponsors;
