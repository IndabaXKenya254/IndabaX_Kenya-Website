// ═══════════════════════════════════════════════════════════════════════
// KENYA'S IOAI JOURNEY TIMELINE - Database-driven (Editable via Admin)
// ═══════════════════════════════════════════════════════════════════════
// Timeline showing Kenya's participation and selection process for IOAI
// Milestones are editable via admin panel
// Clickable links to archive pages when link_url is set
// ═══════════════════════════════════════════════════════════════════════

import { createNoCachePublicClient } from '@/lib/supabase';
import Link from 'next/link';

interface TimelineMilestone {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  date: string;
  icon: string;
  description: string;
  highlight?: string;
  display_order: number;
  is_published: boolean;
  link_url?: string | null;
  link_type?: 'internal' | 'external' | 'archive' | null;
}

async function getTimelineMilestones(): Promise<TimelineMilestone[]> {
  try {
    const supabase = createNoCachePublicClient();

    const { data, error } = await supabase
      .from('noai_timeline_milestones')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching timeline milestones:', error);
      return getDefaultMilestones();
    }

    return data && data.length > 0 ? data : getDefaultMilestones();
  } catch (error) {
    console.error('Error in getTimelineMilestones:', error);
    return getDefaultMilestones();
  }
}

function getDefaultMilestones(): TimelineMilestone[] {
  return [
    {
      id: "2025-participation",
      year: "2025",
      title: "Kenya's First IOAI Participation",
      subtitle: "2nd IOAI - Beijing, China",
      date: "August 2, 2025",
      icon: "icofont-flag-alt-2",
      description: "Kenya made history by participating in the International Olympiad in Artificial Intelligence for the first time, representing East Africa on the global AI stage.",
      highlight: "Historic Debut",
      display_order: 1,
      is_published: true,
      link_url: "/noai/archive/ioai-2025-beijing",
      link_type: "archive",
    },
    {
      id: "2025-round1",
      year: "2025/26",
      title: "Round One Examination",
      subtitle: "NOAI Selection Process",
      date: "December 17, 2025",
      icon: "icofont-paper",
      description: "First round of the National Olympiad for AI. Open to all eligible Kenyan students interested in representing Kenya at IOAI 2026.",
      highlight: "",
      display_order: 2,
      is_published: true,
      link_url: null,
      link_type: null,
    },
    {
      id: "2025-round2",
      year: "2025/26",
      title: "Round Two Examination",
      subtitle: "NOAI Selection Process",
      date: "December 22, 2025",
      icon: "icofont-chart-line-alt",
      description: "Second round for shortlisted candidates from Round One. Advanced problem-solving and AI concepts assessment.",
      highlight: "",
      display_order: 3,
      is_published: true,
      link_url: null,
      link_type: null,
    },
    {
      id: "2026-training",
      year: "2026",
      title: "Final Team Training",
      subtitle: "Intensive Preparation",
      date: "January - July 2026",
      icon: "icofont-graduate",
      description: "Selected team members undergo rigorous training in machine learning, natural language processing, computer vision, and AI problem-solving.",
      highlight: "6 Months",
      display_order: 4,
      is_published: true,
      link_url: null,
      link_type: null,
    },
    {
      id: "2026-ioai",
      year: "2026",
      title: "3rd IOAI - Abu Dhabi",
      subtitle: "International Competition",
      date: "August 2-9, 2026",
      icon: "icofont-trophy",
      description: "Kenya's team competes at the 3rd International Olympiad in Artificial Intelligence in Abu Dhabi, UAE.",
      highlight: "",
      display_order: 5,
      is_published: true,
      link_url: null,
      link_type: null,
    },
  ];
}

// Helper component for rendering timeline content
function TimelineContent({ milestone }: { milestone: TimelineMilestone }) {
  return (
    <>
      <div className="kenya-timeline-header">
        <span className="year-badge">{milestone.year}</span>
        {milestone.link_url && (
          <span className="link-indicator">
            <i className="icofont-external-link"></i>
          </span>
        )}
      </div>

      <h3>{milestone.title}</h3>
      <p className="subtitle">{milestone.subtitle}</p>

      <div className="date-info">
        <i className="icofont-calendar"></i>
        <span>{milestone.date}</span>
      </div>

      <p className="description">{milestone.description}</p>

      {milestone.highlight && (
        <span className="highlight-tag">
          {milestone.highlight}
        </span>
      )}

      {milestone.link_url && (
        <span className="view-more-link">
          View Details <i className="icofont-arrow-right"></i>
        </span>
      )}
    </>
  );
}

export default async function KenyaJourneyTimelineDB() {
  const milestones = await getTimelineMilestones();

  if (milestones.length === 0) {
    return null;
  }

  return (
    <section className="kenya-journey-timeline-section ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>Roadmap</span>
          <h2>
            Kenya&apos;s IOAI <b>Journey</b>
          </h2>
          <p className="section-subtitle">
            From our historic debut in 2025 to the upcoming IOAI 2026 in Abu Dhabi
          </p>
          <div className="bar"></div>
        </div>

        <div className="kenya-timeline-wrapper">
          <div className="kenya-timeline-line"></div>

          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`kenya-timeline-item ${index % 2 === 0 ? "left" : "right"} ${milestone.link_url ? "clickable" : ""}`}
              data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
              data-aos-delay={index * 100}
            >
              <div className="kenya-timeline-marker">
                <i className={milestone.icon}></i>
              </div>

              {milestone.link_url ? (
                // Clickable milestone - wrap in link
                milestone.link_type === 'external' ? (
                  <a
                    href={milestone.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kenya-timeline-content"
                  >
                    <TimelineContent milestone={milestone} />
                  </a>
                ) : (
                  <Link
                    href={milestone.link_url}
                    className="kenya-timeline-content"
                  >
                    <TimelineContent milestone={milestone} />
                  </Link>
                )
              ) : (
                // Non-clickable milestone
                <div className="kenya-timeline-content">
                  <TimelineContent milestone={milestone} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Issue #40 FIX: Apply Now CTA removed per client request */}
      </div>
    </section>
  );
}
