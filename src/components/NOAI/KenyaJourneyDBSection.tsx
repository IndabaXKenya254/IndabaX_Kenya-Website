// ═══════════════════════════════════════════════════════════════════════
// Kenya's Journey Section - Database-driven content
// SERVER COMPONENT - Converted to SSR for faster initial load
// ═══════════════════════════════════════════════════════════════════════

import { createPublicClient } from '@/lib/supabase'

interface KenyaJourneyMetadata {
  milestone: {
    year: string
    text: string
    icon: string
  }
  organizers: Array<{
    name: string
    icon: string
    url?: string | null
  }>
  event: {
    badge: string
    location: string
    location_icon: string
    date: {
      day: string
      month: string
      year: string
    }
    title: string
    description: string
    achievements: Array<{
      icon: string
      text: string
    }>
    quote: string
  }
  buttons: {
    gallery: {
      text: string
      url: string
      icon: string
    }
    apply: {
      text: string
      url: string
      icon: string
    }
  }
  futureGoals: Array<{
    icon: string
    title: string
    description: string
  }>
}

interface PageSection {
  id: string
  section_key: string
  title: string
  content: {
    text?: string
    html?: string
    metadata?: KenyaJourneyMetadata
    [key: string]: any
  }
}

interface Subsection {
  id: string
  title: string
  content: {
    html?: string
    text?: string
  }
  icon?: string
  style_variant?: string
}

async function getSectionData() {
  try {
    const supabase = createPublicClient()

    const [sectionResult, subsectionsResult] = await Promise.all([
      supabase
        .from('noai_page_sections')
        .select('*')
        .eq('section_key', 'kenya_journey')
        .eq('is_published', true)
        .single(),
      supabase
        .from('noai_subsections')
        .select('*')
        .eq('parent_section_key', 'kenya_journey')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
    ])

    const section = sectionResult.data as PageSection | null
    const metadata = section?.content?.metadata as KenyaJourneyMetadata | null

    return {
      section,
      subsections: (subsectionsResult.data as Subsection[]) || [],
      metadata
    }
  } catch (error) {
    console.error('Error loading Kenya journey section:', error)
    return {
      section: null,
      subsections: [],
      metadata: null
    }
  }
}

export default async function KenyaJourneyDBSection() {
  const { section, subsections, metadata } = await getSectionData()

  if (!section) {
    return null
  }

  // Use metadata from database or fallback to defaults
  const meta = metadata || {
    milestone: { year: '2025', text: 'First Participation: 2025', icon: 'icofont-flag-alt-2' },
    organizers: [
      { name: 'Elimika Research Institute', icon: 'icofont-building' },
      { name: 'IndabaX Kenya', icon: 'icofont-users-alt-4' }
    ],
    event: {
      badge: 'IOAI 2025',
      location: 'Beijing, China',
      location_icon: 'icofont-location-pin',
      date: { day: '2', month: 'August', year: '2025' },
      title: "Kenya's Debut",
      description: 'The first Kenyan team to represent the nation at the International Olympiad in Artificial Intelligence.',
      achievements: [
        { icon: 'icofont-trophy', text: 'Strong Performance' },
        { icon: 'icofont-star', text: 'Commendable Results' },
        { icon: 'icofont-graduate', text: 'STEM Excellence' }
      ],
      quote: 'Supported by local academic institutions and national initiatives aimed at nurturing talent in STEM fields.'
    },
    buttons: {
      gallery: { text: 'View Gallery', url: '#gallery', icon: 'icofont-image' },
      apply: { text: 'Join the Team', url: '#apply', icon: 'icofont-arrow-right' }
    },
    futureGoals: [
      { icon: 'icofont-chart-growth', title: 'Grow Participation', description: 'Increase the number of students competing at national level' },
      { icon: 'icofont-medal', title: 'Win Medals', description: 'Aim for medal positions at IOAI 2026 in Abu Dhabi' },
      { icon: 'icofont-network', title: 'Build Community', description: 'Create a strong AI community among Kenyan youth' }
    ]
  }

  return (
    <section className="kenya-participation-section ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>Our Journey</span>
          <h2>{section.title}</h2>
          <div className="bar"></div>
        </div>

        {/* Editable from admin: Milestone Badge + Event Card */}
        <div className="row align-items-center mb-5">
          <div className="col-lg-6 col-md-12">
            <div className="participation-content" data-aos="fade-right">
              <div className="milestone-badge">
                <i className={meta.milestone.icon}></i>
                <span>{meta.milestone.text}</span>
              </div>

              <div className="organizers-info mt-4">
                <h4>Organized By:</h4>
                <div className="organizer-cards">
                  {meta.organizers.map((org, index) => {
                    const content = (
                      <>
                        <i className={org.icon}></i>
                        <span>{org.name}</span>
                      </>
                    );

                    return org.url ? (
                      <a
                        key={index}
                        href={org.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="organizer-card organizer-card-link"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={index} className="organizer-card">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cta-section mt-4">
                <a href={meta.buttons.gallery.url} className="btn btn-primary">
                  <i className={meta.buttons.gallery.icon}></i> {meta.buttons.gallery.text}
                </a>
                <a href={meta.buttons.apply.url} className="btn btn-outline-primary">
                  {meta.buttons.apply.text} <i className={meta.buttons.apply.icon}></i>
                </a>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-12">
            <div className="participation-visual" data-aos="fade-left">
              <div className="event-highlight-card">
                <div className="card-header">
                  <span className="event-badge">{meta.event.badge}</span>
                  <span className="location-badge">
                    <i className={meta.event.location_icon}></i> {meta.event.location}
                  </span>
                </div>

                <div className="card-body">
                  <div className="event-date">
                    <span className="day">{meta.event.date.day}</span>
                    <span className="month">{meta.event.date.month}</span>
                    <span className="year">{meta.event.date.year}</span>
                  </div>

                  <h4>{meta.event.title}</h4>
                  <p>{meta.event.description}</p>

                  <div className="achievement-badges">
                    {meta.event.achievements.map((achievement, index) => (
                      <div key={index} className="achievement">
                        <i className={achievement.icon}></i>
                        <span>{achievement.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-footer">
                  <p>
                    <i className="icofont-quote-left"></i>
                    {meta.event.quote}
                    <i className="icofont-quote-right"></i>
                  </p>
                </div>
              </div>

              {/* <div className="floating-element flag" data-aos="zoom-in" data-aos-delay="200">
                <span>🇰🇪</span>
              </div> */}
              {/* <div className="floating-element ai" data-aos="zoom-in" data-aos-delay="300">
                <i className="icofont-brain-alt"></i>
              </div> */}
            </div>
          </div>
        </div>

        {/* EDITABLE: Subsections from database */}
        <div className="row">
          {subsections.map((subsection, index) => (
            <div key={subsection.id} className="col-lg-4 col-md-6 mb-4" data-aos="fade-up" data-aos-delay={index * 100}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  {subsection.icon && (
                    <div className="mb-3">
                      <i className={`${subsection.icon} text-primary`} style={{ fontSize: '3rem' }}></i>
                    </div>
                  )}
                  <h4 className="card-title mb-3">{subsection.title}</h4>
                  <div
                    className="card-text"
                    dangerouslySetInnerHTML={{
                      __html: subsection.content.html || subsection.content.text || ''
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Editable from admin: Future Goals */}
        <div className="future-goals mt-5" data-aos="fade-up">
          <div className="goals-wrapper">
            <h3>Looking Ahead</h3>
            <div className="row">
              {meta.futureGoals.map((goal, index) => (
                <div key={index} className="col-md-4">
                  <div className="goal-item">
                    <div className="goal-icon">
                      <i className={goal.icon}></i>
                    </div>
                    <h4>{goal.title}</h4>
                    <p>{goal.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
