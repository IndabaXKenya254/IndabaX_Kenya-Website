// ═══════════════════════════════════════════════════════════════════════
// WHY US / WHY CHOOSE INDABAX SECTION
// ═══════════════════════════════════════════════════════════════════════
// Issue #44: Now fetches from database with JSON fallback
// Includes editable section header

import React from "react";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase";
import whyAttendFallback from "@/../../lib/mock-data/why-attend.json";

interface WhyAttendCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  sort_order?: number;
}

interface SectionHeader {
  subtitle: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  is_visible: boolean;
}

// Default header values
const defaultHeader: SectionHeader = {
  subtitle: 'Why Attend',
  title: 'Why Choose IndabaX Kenya',
  description: 'IndabaX Kenya offers unparalleled opportunities for learning, networking, and advancing your AI career. Here\'s what makes our conference unique.',
  button_text: 'Register for IndabaX',
  button_link: '/register',
  is_visible: true
};

// Server-side data fetching for header
async function getWhyAttendHeader(): Promise<SectionHeader> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'why_attend_header')
      .single();

    const result = data as { value: any } | null;
    if (error || !result?.value) {
      return defaultHeader;
    }

    return result.value as SectionHeader;
  } catch (error) {
    console.error('WhyUs header fetch error:', error);
    return defaultHeader;
  }
}

// Server-side data fetching for cards
async function getWhyAttendCards(): Promise<WhyAttendCard[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('why_attend_cards')
      .select('id, icon, title, description, color, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching why_attend cards:', error);
      // Return fallback data
      return whyAttendFallback as WhyAttendCard[];
    }

    // If no data in DB, use fallback
    if (!data || data.length === 0) {
      return whyAttendFallback as WhyAttendCard[];
    }

    return data;
  } catch (error) {
    console.error('WhyUs data fetch error:', error);
    return whyAttendFallback as WhyAttendCard[];
  }
}

const WhyUs: React.FC = async () => {
  const [header, reasons] = await Promise.all([
    getWhyAttendHeader(),
    getWhyAttendCards()
  ]);

  // Get current year for display
  const currentYear = new Date().getFullYear();

  // Don't render if section is hidden
  if (!header.is_visible) {
    return null;
  }

  return (
    <>
      <div className="why-choose-us ptb-120">
        <div className="container">
          <div className="section-title">
            {header.subtitle && <span>{header.subtitle}</span>}
            <h2>{header.title} {currentYear}?</h2>
            <div className="bar"></div>
            {header.description && (
              <p className="section-description">
                {header.description}
              </p>
            )}
          </div>

          <div className="row justify-content-center">
            {reasons.map((reason, index) => (
              <div
                className="col-lg-4 col-md-6 col-sm-12"
                key={reason.id}
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay={index * 100}
              >
                <div className="single-why-us-card">
                  <div
                    className="icon-wrapper"
                    style={{ backgroundColor: `${reason.color}20` }}
                  >
                    <i
                      className={reason.icon}
                      style={{ color: reason.color }}
                    ></i>
                  </div>
                  <h3>{reason.title}</h3>
                  <p>{reason.description}</p>
                </div>
              </div>
            ))}
          </div>

          {header.button_text && (
            <div className="text-center mt-5">
              <Link href={header.button_link || '/register'} className="btn btn-primary btn-lg">
                {header.button_text} {currentYear}
                <i className="icofont-double-right"></i>
              </Link>
            </div>
          )}
        </div>

        {/* Animated background slideshow */}
        <ul className="slideshow">
          <li>
            <span
              style={{ backgroundImage: `url(/images/slideshow-bg1.jpg)` }}
            ></span>
          </li>
          <li>
            <span
              style={{ backgroundImage: `url(/images/slideshow-bg2.jpg)` }}
            ></span>
          </li>
          <li>
            <span
              style={{ backgroundImage: `url(/images/slideshow-bg3.jpg)` }}
            ></span>
          </li>
          <li>
            <span
              style={{ backgroundImage: `url(/images/slideshow-bg4.jpg)` }}
            ></span>
          </li>
        </ul>
      </div>
    </>
  );
};

export default WhyUs;
