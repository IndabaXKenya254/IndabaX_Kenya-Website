// ═══════════════════════════════════════════════════════════════════════
// NOAI About Section - Database-driven content
// SERVER COMPONENT - Converted to SSR for faster initial load
// ═══════════════════════════════════════════════════════════════════════

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

    const [sectionsResult, subsectionsResult] = await Promise.all([
      supabase
        .from('noai_page_sections')
        .select('*')
        .eq('section_key', 'about_noai')
        .eq('is_published', true)
        .single(),
      supabase
        .from('noai_subsections')
        .select('*')
        .eq('parent_section_key', 'about_noai')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
    ])

    return {
      section: sectionsResult.data as PageSection | null,
      subsections: (subsectionsResult.data as Subsection[]) || []
    }
  } catch (error) {
    console.error('Error loading NOAI about section:', error)
    return {
      section: null,
      subsections: []
    }
  }
}

export default async function NOAIAboutSection() {
  const { section, subsections } = await getSectionData()

  if (!section) {
    return null
  }

  return (
    <section className="noai-about-section ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>National Olympiad in Artificial Intelligence (NOAI)</span>
          <h2>About Kenya NOAI</h2>
          <div className="bar"></div>
        </div>

        {/* Display subsections as cards */}
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
      </div>
    </section>
  )
}
