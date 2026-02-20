// ═══════════════════════════════════════════════════════════════════════
// SERVER COMPONENT - About Us Section (December 29, 2025)
// ═══════════════════════════════════════════════════════════════════════
// Now reads rich text content from database settings for admin editability
// Supports HTML formatting from Quill.js editor
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase";

interface AboutSettings {
  about_subtitle: string;
  about_title: string;
  about_paragraphs: string; // Now stores HTML from Quill.js
  about_image1: string;
  about_image2: string;
}

async function getAboutSettings(): Promise<AboutSettings> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['about_subtitle', 'about_title', 'about_paragraphs', 'about_image1', 'about_image2']);

    if (error || !data) {
      console.error('Error fetching about settings:', error);
      return getDefaultSettings();
    }

    const settingsMap: Record<string, string> = {};
    data.forEach((item: { key: string; value: string }) => {
      settingsMap[item.key] = item.value;
    });

    return {
      about_subtitle: settingsMap.about_subtitle || "About IndabaX Kenya",
      about_title: settingsMap.about_title || "Empowering Africa's AI Future",
      about_paragraphs: settingsMap.about_paragraphs || getDefaultContent(),
      about_image1: settingsMap.about_image1 || "/images/about1.jpg",
      about_image2: settingsMap.about_image2 || "/images/about2.jpg",
    };
  } catch (error) {
    console.error('Error fetching about settings:', error);
    return getDefaultSettings();
  }
}

function getDefaultSettings(): AboutSettings {
  return {
    about_subtitle: "About IndabaX Kenya",
    about_title: "Empowering Africa's AI Future",
    about_paragraphs: getDefaultContent(),
    about_image1: "/images/about1.jpg",
    about_image2: "/images/about2.jpg",
  };
}

function getDefaultContent(): string {
  return `<p>IndabaX Kenya is East Africa's premier gathering for machine learning and artificial intelligence enthusiasts, researchers, and practitioners. As part of the global Deep Learning Indaba movement, we bring together Africa's brightest minds to advance AI research, education, and applications across the continent.</p>
<p>Since our inception, IndabaX Kenya has grown into a vibrant community of over <strong>500+ participants</strong> from <strong>20+ countries</strong>. We host annual conferences featuring cutting-edge research presentations, hands-on workshops, keynote talks from world-renowned experts, and networking opportunities that foster collaboration and innovation in AI.</p>
<p>Our mission is to strengthen machine learning and AI in Kenya and across Africa by creating inclusive spaces for learning, sharing knowledge, and building solutions that address local challenges using global best practices.</p>`;
}

const AboutUsContent: React.FC = async () => {
  const settings = await getAboutSettings();

  return (
    <>
      <div className="about-area ptb-120 bg-image">
        <div className="container">
          <div className="row h-100 align-items-center">
            <div className="col-lg-6" data-aos="fade-right" data-aos-duration="1000" suppressHydrationWarning>
              <div className="about-content">
                <span>{settings.about_subtitle}</span>
                <h2 dangerouslySetInnerHTML={{ __html: settings.about_title }} />

                {/* Render rich text HTML content from Quill.js */}
                <div
                  className="about-rich-content"
                  dangerouslySetInnerHTML={{ __html: settings.about_paragraphs }}
                />

                <div className="about-buttons">
                  <Link href="/register" className="btn btn-primary">
                    Register for 2026
                    <i className="icofont-double-right"></i>
                  </Link>

                  <Link href="/history" className="btn btn-outline-primary">
                    <i className="icofont-history"></i> Previous Editions
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-6" data-aos="fade-left" data-aos-duration="1000" suppressHydrationWarning>
              <div className="about-image">
                <Image
                  src={settings.about_image1}
                  className="about-img1"
                  width={1600}
                  height={1066}
                  alt="IndabaX Kenya Conference"
                  priority
                  unoptimized={settings.about_image1.startsWith('http')}
                />
                <Image
                  src={settings.about_image2}
                  className="about-img2"
                  alt="AI Workshop"
                  width={1280}
                  height={853}
                  unoptimized={settings.about_image2.startsWith('http')}
                />

              </div>
              <div className="mt-3 text-center">
                <Link href="/about-us" className="btn btn-primary">
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUsContent;
