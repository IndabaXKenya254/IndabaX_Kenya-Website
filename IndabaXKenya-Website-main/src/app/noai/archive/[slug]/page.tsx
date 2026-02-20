// ═══════════════════════════════════════════════════════════════════════
// NOAI ARCHIVE DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════
// Displays individual archive with participants, gallery, and content
// ═══════════════════════════════════════════════════════════════════════

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createNoCachePublicClient } from '@/lib/supabase'
import Navbar from '@/components/Layouts/Navbar'
import Footer from '@/components/Layouts/Footer'
import '../../../../../styles/noai.css'

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
  content_sections: any[]
  is_published: boolean
}

interface Participant {
  id: string
  name: string | null
  role: string | null
  photo_url: string | null
  school: string | null
  achievement: string | null
  year: string | null
}

interface GalleryPhoto {
  id: string
  url: string
  caption: string | null
  year: string | null
}

interface Props {
  params: { slug: string }
}

async function getArchive(slug: string): Promise<Archive | null> {
  try {
    const supabase = createNoCachePublicClient()

    const { data, error } = await supabase
      .from('noai_archives')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) {
      console.error('Error fetching archive:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getArchive:', error)
    return null
  }
}

async function getParticipants(year: string | null): Promise<Participant[]> {
  if (!year) return []

  try {
    const supabase = createNoCachePublicClient()

    const { data, error } = await supabase
      .from('noai_participants')
      .select('*')
      .eq('year', year)
      .eq('is_published', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching participants:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getParticipants:', error)
    return []
  }
}

async function getGalleryPhotos(year: string | null): Promise<GalleryPhoto[]> {
  if (!year) return []

  try {
    const supabase = createNoCachePublicClient()

    // Try to get NOAI-specific gallery photos for the year
    const { data, error } = await supabase
      .from('photos')
      .select('id, url, caption, year')
      .eq('year', year)
      .ilike('album', '%NOAI%')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .limit(12)

    if (error) {
      console.error('Error fetching gallery photos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getGalleryPhotos:', error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const archive = await getArchive(params.slug)

  if (!archive) {
    return {
      title: 'Archive Not Found | NOAI',
    }
  }

  return {
    title: `${archive.title} | NOAI Archives`,
    description: archive.description || `Learn about ${archive.title} - Kenya's journey in IOAI.`,
  }
}

export default async function NOAIArchiveDetailPage({ params }: Props) {
  const archive = await getArchive(params.slug)

  if (!archive) {
    notFound()
  }

  const participants = await getParticipants(archive.year)
  const galleryPhotos = await getGalleryPhotos(archive.year)

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section
        className="noai-hero-section noai-archive-detail-hero"
        style={archive.featured_image ? { backgroundImage: `url(${archive.featured_image})` } : {}}
      >
        <div className="hero-overlay"></div>
        <div className="container position-relative">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <Link href="/noai/archive" className="back-link" data-aos="fade-down">
                <i className="icofont-arrow-left me-2"></i>
                All Archives
              </Link>
              {archive.year && (
                <span className="hero-badge mt-3" data-aos="fade-down" data-aos-delay="100">
                  <i className="icofont-calendar me-2"></i>
                  {archive.year}
                </span>
              )}
              <h1 data-aos="fade-up" data-aos-delay="150">
                {archive.title}
              </h1>
              {archive.subtitle && (
                <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
                  {archive.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="noai-archive-content ptb-120">
        <div className="container">
          {/* Description */}
          {archive.description && (
            <div className="row justify-content-center mb-5">
              <div className="col-lg-10">
                <div className="archive-description-card" data-aos="fade-up">
                  <p className="lead">{archive.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Participants Section */}
          {participants.length > 0 && (
            <div className="archive-section mb-5">
              <div className="section-title" data-aos="fade-up">
                <span>Team</span>
                <h2>
                  Kenya&apos;s <b>Representatives</b>
                </h2>
                <div className="bar"></div>
              </div>

              <div className="row g-4 justify-content-center">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="col-lg-3 col-md-4 col-sm-6"
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                  >
                    <div className="participant-card">
                      <div className="participant-photo">
                        {participant.photo_url ? (
                          <img
                            src={participant.photo_url}
                            alt={participant.name || 'Participant'}
                          />
                        ) : (
                          <div className="participant-placeholder">
                            <i className="icofont-user-alt-3"></i>
                          </div>
                        )}
                      </div>
                      <div className="participant-info">
                        <h4>{participant.name || 'Participant'}</h4>
                        {participant.role && (
                          <span className="participant-role">{participant.role}</span>
                        )}
                        {participant.school && (
                          <p className="participant-school">{participant.school}</p>
                        )}
                        {participant.achievement && (
                          <span className="participant-achievement">
                            <i className="icofont-medal me-1"></i>
                            {participant.achievement}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {galleryPhotos.length > 0 && (
            <div className="archive-section mb-5">
              <div className="section-title" data-aos="fade-up">
                <span>Memories</span>
                <h2>
                  Photo <b>Gallery</b>
                </h2>
                <div className="bar"></div>
              </div>

              <div className="row g-3">
                {galleryPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="col-lg-3 col-md-4 col-6"
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                  >
                    <div className="gallery-item">
                      <img src={photo.url} alt={photo.caption || 'Gallery photo'} />
                      {photo.caption && (
                        <div className="gallery-caption">{photo.caption}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Link to full gallery */}
              <div className="text-center mt-4">
                <Link
                  href={`/noai/gallery?year=${archive.year}`}
                  className="btn btn-outline-primary"
                >
                  View Full Gallery <i className="icofont-arrow-right ms-2"></i>
                </Link>
              </div>
            </div>
          )}

          {/* Dynamic Content Sections */}
          {archive.content_sections && archive.content_sections.length > 0 && (
            <div className="archive-dynamic-content">
              {archive.content_sections.map((section: any, index: number) => (
                <div
                  key={index}
                  className="content-section mb-5"
                  data-aos="fade-up"
                >
                  {section.title && <h3>{section.title}</h3>}
                  {section.content && (
                    <div
                      className="content-html"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="archive-navigation mt-5 pt-4 border-top">
            <div className="row">
              <div className="col-6">
                <Link href="/noai/archive" className="nav-link-prev">
                  <i className="icofont-arrow-left me-2"></i>
                  All Archives
                </Link>
              </div>
              <div className="col-6 text-end">
                <Link href="/noai" className="nav-link-next">
                  Back to NOAI
                  <i className="icofont-arrow-right ms-2"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
