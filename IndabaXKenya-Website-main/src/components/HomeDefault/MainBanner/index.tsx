// ═══════════════════════════════════════════════════════════════════════
// SERVER COMPONENT - No Flash of Fallback Content (November 29, 2025)
// ═══════════════════════════════════════════════════════════════════════
// BEFORE: Client-side fetch with fallback values flashing on screen
// AFTER: Server-side data fetching - real data on first render
// Expected Impact: No visual flash, better UX
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import Image from "next/image";
// VideoModal removed per Issue #33 - client requested removal of Watch Video button
// import VideoModal from "./VideoModal";
import { createPublicClient } from "@/lib/supabase";

interface BannerSettings {
  eventDate: string;
  eventEndDate: string;
  eventLocation: string;
  eventTitle: string;
  eventSubtitle: string;
  videoUrl: string;
  registrationUrl: string;
  submitPaperUrl: string;
  showCountdown?: boolean;
  showVideo?: boolean;
}

interface HomepageSettings {
  hero_title_line1: string;
  hero_title_line2: string;
  hero_stats: string;
  hero_description: string;
  hero_background_image: string;
}

async function getHomepageSettings(): Promise<HomepageSettings> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['hero_title_line1', 'hero_title_line2', 'hero_stats', 'hero_description', 'hero_background_image']);

    if (error || !data) {
      console.error('Error fetching homepage settings:', error);
      return {
        hero_title_line1: "Building Africa's",
        hero_title_line2: 'AI & Machine Learning Community',
        hero_stats: '500+ AI Enthusiasts|East Africa\'s Premier AI Conference',
        hero_description: 'IndabaX Kenya is part of the global Deep Learning Indaba movement, dedicated to strengthening machine learning and artificial intelligence across Africa through world-class conferences, workshops, and community building.',
        hero_background_image: '/images/main-bg1.jpg',
      };
    }

    const settingsMap: Record<string, string> = {};
    data.forEach((item: { key: string; value: string }) => {
      settingsMap[item.key] = item.value;
    });

    return {
      hero_title_line1: settingsMap.hero_title_line1 || "Building Africa's",
      hero_title_line2: settingsMap.hero_title_line2 || 'AI & Machine Learning Community',
      hero_stats: settingsMap.hero_stats || '500+ AI Enthusiasts|East Africa\'s Premier AI Conference',
      hero_description: settingsMap.hero_description || 'IndabaX Kenya is part of the global Deep Learning Indaba movement, dedicated to strengthening machine learning and artificial intelligence across Africa through world-class conferences, workshops, and community building.',
      hero_background_image: settingsMap.hero_background_image || '/images/main-bg1.jpg',
    };
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return {
      hero_title_line1: "Building Africa's",
      hero_title_line2: 'AI & Machine Learning Community',
      hero_stats: '500+ AI Enthusiasts|East Africa\'s Premier AI Conference',
      hero_description: 'IndabaX Kenya is part of the global Deep Learning Indaba movement, dedicated to strengthening machine learning and artificial intelligence across Africa through world-class conferences, workshops, and community building.',
      hero_background_image: '/images/main-bg1.jpg',
    };
  }
}

async function getBannerSettings(): Promise<BannerSettings> {
  const supabase = createPublicClient();
  const currentYear = new Date().getFullYear();

  // Default settings use current year dynamically
  const getDefaultSettings = (): BannerSettings => ({
    eventDate: '', // Empty - will be fetched from featured event
    eventEndDate: '',
    eventLocation: 'Nairobi, Kenya',
    eventTitle: `IndabaX Kenya ${currentYear}`,
    eventSubtitle: 'Machine Learning & AI Conference',
    videoUrl: 'TJLo-TLC5do',
    registrationUrl: '/register',
    submitPaperUrl: '/submit',
    showCountdown: true,
    showVideo: true,
  });

  try {
    // Fetch banner settings and featured event in parallel
    const [settingsResult, eventResult] = await Promise.all([
      supabase
        .from('settings')
        .select('value')
        .eq('key', 'banner_settings')
        .maybeSingle(),
      supabase
        .from('events')
        .select('title, start_date, end_date, location, venue')
        .eq('status', 'upcoming')
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle()
    ]);

    let settings = getDefaultSettings();

    // Apply banner settings if available
    const settingsData = settingsResult.data as { value: any } | null;
    if (settingsData?.value) {
      settings = { ...settings, ...settingsData.value as BannerSettings };
    }

    // Override with featured event data if available and banner dates are empty
    const eventData = eventResult.data as any;
    if (eventData) {
      const event = eventData;
      if (!settings.eventDate || settings.eventDate === '') {
        settings.eventDate = event.start_date;
        settings.eventEndDate = event.end_date;
      }
      if (!settings.eventLocation || settings.eventLocation === 'Nairobi, Kenya') {
        settings.eventLocation = event.venue || event.location || 'Nairobi, Kenya';
      }
      if (!settings.eventTitle || settings.eventTitle === `IndabaX Kenya ${currentYear}`) {
        settings.eventTitle = event.title;
      }
    }

    return settings;
  } catch (error) {
    console.error('Error fetching banner settings:', error);
    return getDefaultSettings();
  }
}

const MainBanner: React.FC = async () => {
  const settings = await getBannerSettings();
  const homepageSettings = await getHomepageSettings();

  // Parse stats from pipe-separated string (e.g., "500+ AI Enthusiasts|East Africa's Premier AI Conference")
  const statsItems = homepageSettings.hero_stats.split('|').map(s => s.trim());

  return (
    <>
      <div
        className="main-banner"
        style={{
          backgroundImage: `url(${homepageSettings.hero_background_image})`
        }}
        data-aos="fade-in"
        data-aos-duration="1000"
        suppressHydrationWarning
      >
        <div className="d-table">
          <div className="d-table-cell">
            <div className="container">
              <div className="main-banner-content">
                <p>
                  Welcome to <span>IndabaX</span> Kenya
                </p>
                <h1>
                  {homepageSettings.hero_title_line1} <br />
                  <span className="subtitle">{homepageSettings.hero_title_line2}</span>
                </h1>

                <ul>
                  {statsItems[0] && (
                    <li>
                      <i className="icofont-users-alt-5"></i> {statsItems[0]}
                    </li>
                  )}
                  {statsItems[1] && (
                    <li>
                      <i className="icofont-globe"></i> {statsItems[1]}
                    </li>
                  )}
                </ul>

                <div
                  className="hero-description"
                  dangerouslySetInnerHTML={{ __html: homepageSettings.hero_description }}
                />

                {/* Issue #33: Removed Login and Watch Video buttons per client request */}
                <div className="button-box">
                  <Link href="/events" className="btn btn-primary">
                    Explore Events
                  </Link>
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
    </>
  );
};

export default MainBanner;
