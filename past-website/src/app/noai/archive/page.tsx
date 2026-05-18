// ═══════════════════════════════════════════════════════════════════════
// NOAI ARCHIVES LISTING PAGE
// ═══════════════════════════════════════════════════════════════════════
// Lists all published NOAI archives (IOAI participations, competitions, etc.)
// ═══════════════════════════════════════════════════════════════════════

import { Metadata } from 'next'
import Link from 'next/link'
import { createNoCachePublicClient } from '@/lib/supabase'
import Navbar from '@/components/Layouts/Navbar'
import Footer from '@/components/Layouts/Footer'
import '../../../../styles/noai.css'

export const metadata: Metadata = {
  title: 'NOAI Archives | Kenya\'s AI Journey',
  description: 'Explore Kenya\'s journey in the International Olympiad in Artificial Intelligence. View past competitions, participants, and achievements.',
}

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Archive {
  id: string
  slug: string
  title: string
  subtitle: string | null
  year: string | null
  description: string | null
  featured_image: string | null
  is_published: boolean
  display_order: number
}

async function getArchives(): Promise<Archive[]> {
  try {
    const supabase = createNoCachePublicClient()

    const { data, error } = await supabase
      .from('noai_archives')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching archives:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getArchives:', error)
    return []
  }
}

export default async function NOAIArchivesPage() {
  const archives = await getArchives()

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="noai-hero-section noai-archive-hero">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <span className="hero-badge" data-aos="fade-down">
                <i className="icofont-history me-2"></i>
                Our Journey
              </span>
              <h1 data-aos="fade-up" data-aos-delay="100">
                NOAI <span className="text-gradient">Archives</span>
              </h1>
              <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
                Explore Kenya&apos;s journey in the International Olympiad in Artificial Intelligence.
                From our historic debut to future aspirations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Archives Grid */}
      <section className="noai-archives-section ptb-120">
        <div className="container">
          {archives.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="icofont-archive" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
              </div>
              <h3>No Archives Available</h3>
              <p className="text-muted">
                Archives will be available soon. Check back later!
              </p>
              <Link href="/noai" className="btn btn-primary mt-3">
                <i className="icofont-arrow-left me-2"></i>
                Back to NOAI
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              {archives.map((archive, index) => (
                <div
                  key={archive.id}
                  className="col-lg-6 col-md-6"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <Link href={`/noai/archive/${archive.slug}`} className="archive-card">
                    <div className="archive-card-inner">
                      {archive.featured_image ? (
                        <div
                          className="archive-card-image"
                          style={{ backgroundImage: `url(${archive.featured_image})` }}
                        />
                      ) : (
                        <div className="archive-card-image archive-card-placeholder">
                          <i className="icofont-trophy"></i>
                        </div>
                      )}
                      <div className="archive-card-content">
                        {archive.year && (
                          <span className="archive-year-badge">{archive.year}</span>
                        )}
                        <h3>{archive.title}</h3>
                        {archive.subtitle && (
                          <p className="archive-subtitle">{archive.subtitle}</p>
                        )}
                        {archive.description && (
                          <p className="archive-description">
                            {archive.description.length > 150
                              ? `${archive.description.substring(0, 150)}...`
                              : archive.description}
                          </p>
                        )}
                        <span className="archive-view-link">
                          View Archive <i className="icofont-arrow-right"></i>
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Back to NOAI */}
          <div className="text-center mt-5" data-aos="fade-up">
            <Link href="/noai" className="btn btn-outline-primary">
              <i className="icofont-arrow-left me-2"></i>
              Back to NOAI
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
