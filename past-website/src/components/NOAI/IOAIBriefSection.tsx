// ═══════════════════════════════════════════════════════════════════════
// IOAI Brief Section - Shortened intro with external link
// SERVER COMPONENT - Converted to SSR for faster initial load
// ═══════════════════════════════════════════════════════════════════════

import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase'

interface PageSection {
  id: string
  section_key: string
  title: string
  content: {
    text?: string
    html?: string
    [key: string]: any
  }
}

interface Settings {
  ioai_website_url: string
}

async function getSectionData() {
  try {
    const supabase = createPublicClient()

    const [sectionResult, settingsResult] = await Promise.all([
      supabase
        .from('noai_page_sections')
        .select('*')
        .eq('section_key', 'about_ioai')
        .eq('is_published', true)
        .single(),
      supabase
        .from('noai_settings')
        .select('*')
        .single()
    ])

    return {
      section: sectionResult.data as PageSection | null,
      settings: settingsResult.data as Settings | null
    }
  } catch (error) {
    console.error('Error loading IOAI section:', error)
    return {
      section: null,
      settings: null
    }
  }
}

export default async function IOAIBriefSection() {
  const { section, settings } = await getSectionData()

  if (!section) {
    return null
  }

  const ioaiWebsite = settings?.ioai_website_url || 'https://ioai-official.org'

  return (
    <section className="ioai-intro-section ptb-120 bg-light">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>About IOAI</span>
          <h2>{section.title}</h2>
          <div className="bar"></div>
        </div>

        <div className="row align-items-center">
          <div className="col-lg-6 col-md-12">
            <div className="intro-content" data-aos="fade-right">
              {section.content.html ? (
                <div dangerouslySetInnerHTML={{ __html: section.content.html }} />
              ) : section.content.text ? (
                <>
                  <p className="lead-text">{section.content.text}</p>
                  <p>
                    Its primary mission is to promote awareness and understanding of
                    artificial intelligence among the next generation of thinkers and
                    innovators. The olympiad aims to foster an interest in AI and
                    real-world applications through a competitive yet collaborative
                    environment.
                  </p>
                  <p>
                    By bringing together bright young minds from across the world, the
                    IOAI seeks to build an international community passionate about
                    the future of technology. Ultimately, it serves as a premier
                    platform for students to showcase their problem-solving skills and
                    grasp of fundamental AI concepts.
                  </p>
                </>
              ) : null}

              <div className="intro-link">
                <a
                  href={ioaiWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary"
                >
                  Visit Official IOAI Website{' '}
                  <i className="icofont-external-link"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-12">
            <div className="mission-vision-cards" data-aos="fade-left">
              <div className="mv-card mission-card">
                <div className="card-icon">
                  <i className="icofont-rocket-alt-2"></i>
                </div>
                <h3>IOAI Mission</h3>
                <p>
                  IOAI aims to inspire young people globally in science, focusing
                  on AI. We provide a platform for top AI students selected
                  through national competitions to compete, exchange ideas, and
                  build connections, fostering a dialogue on AI&apos;s opportunities
                  and ethical challenges among students and the community.
                </p>
              </div>

              <div className="mv-card vision-card">
                <div className="card-icon">
                  <i className="icofont-eye-alt"></i>
                </div>
                <h3>IOAI Vision</h3>
                <p>
                  IOAI aspires to become an International Science Olympiad on par
                  with the established ones in terms of participating countries
                  and task level. In collaboration with global organizations and
                  AI experts, IOAI builds a network of future innovators who will
                  shape AI for the benefit of humankind and our planet, while
                  ensuring financial accessibility for all participants.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Competition Areas */}
        <div className="competition-areas-mini mt-5" data-aos="fade-up">
          <h3 className="text-center mb-4">Competition Focus Areas</h3>
          <div className="row">
            <div className="col-lg-3 col-md-6 col-6 mb-3">
              <div className="area-card-mini" style={{ backgroundColor: '#4285f415', color: '#4285f4', border: '2px solid #4285f4', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <i className="icofont-chart-line-alt" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
                <span style={{ fontWeight: '600' }}>Machine Learning</span>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-6 mb-3">
              <div className="area-card-mini" style={{ backgroundColor: '#ea433515', color: '#ea4335', border: '2px solid #ea4335', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <i className="icofont-eye" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
                <span style={{ fontWeight: '600' }}>Computer Vision</span>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-6 mb-3">
              <div className="area-card-mini" style={{ backgroundColor: '#34a85315', color: '#34a853', border: '2px solid #34a853', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <i className="icofont-speech-comments" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
                <span style={{ fontWeight: '600' }}>NLP</span>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-6 mb-3">
              <div className="area-card-mini" style={{ backgroundColor: '#fbbc0415', color: '#fbbc04', border: '2px solid #fbbc04', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <i className="icofont-robot" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
                <span style={{ fontWeight: '600' }}>Robotics</span>
              </div>
            </div>
          </div>
          <div className="format-note text-center mt-4" data-aos="fade-up">
            <div className="note-content" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #dee2e6' }}>
              <i className="icofont-info-circle" style={{ fontSize: '1.5rem', color: '#0066cc', marginRight: '10px' }}></i>
              <p style={{ margin: 0, display: 'inline' }}>
                The format encourages not only technical excellence but also critical
                thinking about the societal impact of the solutions created. Ethical
                considerations are integrated directly into the competition tasks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
