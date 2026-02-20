// ═══════════════════════════════════════════════════════════════════════
// Participants Display - Client Component for interactivity
// ═══════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Participant {
  id: string
  year: number
  name: string
  school: string | null
  role: 'contestant' | 'team_leader' | 'deputy_leader' | 'observer'
  photo_url: string | null
  achievement: 'gold' | 'silver' | 'bronze' | 'honorable_mention' | 'participant' | null
  bio: string | null
  display_order: number
}

interface ParticipantsData {
  [year: number]: Participant[]
}

interface Props {
  participantsData: ParticipantsData
}

const achievementIcons: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  honorable_mention: '🏅',
  participant: '🎖️'
}

const achievementLabels: Record<string, string> = {
  gold: 'Gold Medal',
  silver: 'Silver Medal',
  bronze: 'Bronze Medal',
  honorable_mention: 'Honorable Mention',
  participant: 'Participant'
}

const roleLabels: Record<string, string> = {
  contestant: 'Contestant',
  team_leader: 'Team Leader',
  deputy_leader: 'Deputy Leader',
  observer: 'Observer'
}

export default function ParticipantsDisplay({ participantsData }: Props) {
  const years = Object.keys(participantsData).map(Number).sort((a, b) => b - a)
  const [selectedYear, setSelectedYear] = useState<number | null>(years[0] || null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [modalName, setModalName] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const participantsPerPage = 20

  // Reset to page 1 when year changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedYear])

  // ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalImage) {
        setModalImage(null)
        setModalName(null)
        document.body.style.overflow = 'auto'
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [modalImage])

  if (years.length === 0) {
    return null
  }

  const allParticipants = selectedYear ? participantsData[selectedYear] || [] : []

  // Calculate pagination
  const totalParticipants = allParticipants.length
  const totalPages = Math.ceil(totalParticipants / participantsPerPage)
  const startIndex = (currentPage - 1) * participantsPerPage
  const endIndex = startIndex + participantsPerPage
  const currentParticipants = allParticipants.slice(startIndex, endIndex)

  const openModal = (imageUrl: string, name: string | null) => {
    setModalImage(imageUrl)
    setModalName(name)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setModalImage(null)
    setModalName(null)
    document.body.style.overflow = 'auto'
  }

  return (
    <>
      <div className="section-title" data-aos="fade-up">
        <span>Our Team</span>
        <h2>IOAI <b>Participants</b></h2>
        <div className="bar"></div>
        <p className="mt-3">Kenya&apos;s representatives at the International Olympiad in Artificial Intelligence</p>
      </div>

      {/* Year Filter Tabs - Always show so users know which year they're viewing */}
      <div className="year-filter-tabs text-center mb-5" data-aos="fade-up" data-aos-delay="100">
        <div className="btn-group" role="group">
          {years.map(year => {
            const count = participantsData[year]?.length || 0
            return (
              <button
                key={year}
                type="button"
                className={`btn ${selectedYear === year ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setSelectedYear(year)}
              >
                {year} <span className="badge bg-light text-dark ms-1">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Participants Grid */}
      <div className="row g-4" data-aos="fade-up" data-aos-delay="200">
        {currentParticipants.map((participant, index) => (
          <div key={participant.id} className="col-lg-3 col-md-4 col-sm-6" data-aos="zoom-in" data-aos-delay={100 * (index + 1)}>
            <div className="participant-card h-100">
              <div
                className="participant-photo"
                onClick={() => participant.photo_url && openModal(participant.photo_url, participant.name)}
                style={{ cursor: participant.photo_url ? 'pointer' : 'default' }}
              >
                {participant.photo_url ? (
                  <Image
                    src={participant.photo_url}
                    alt={participant.name || 'IOAI Participant'}
                    width={400}
                    height={400}
                    className="img-fluid"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="placeholder-photo bg-light d-flex align-items-center justify-content-center" style={{ height: '100%' }}>
                    <i className="icofont-user-alt-4" style={{ fontSize: '80px', color: '#ccc' }}></i>
                  </div>
                )}
              </div>

              <div className="participant-info text-center p-3">
                {participant.name && (
                  <h5 className="participant-name mb-2">{participant.name}</h5>
                )}
                {participant.school && (
                  <p className="participant-school text-muted small mb-0">{participant.school}</p>
                )}
                {participant.bio && (
                  <p className="participant-bio small text-muted mt-2">{participant.bio}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentParticipants.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted">No participants data available for {selectedYear}.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-wrapper mt-5" data-aos="fade-up">
          <nav aria-label="Participants pagination">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="icofont-rounded-left"></i> Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <i className="icofont-rounded-right"></i>
                </button>
              </li>
            </ul>
          </nav>

          <div className="text-center mt-3">
            <p className="text-muted small">
              Showing {startIndex + 1} - {Math.min(endIndex, totalParticipants)} of {totalParticipants} participants
            </p>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {modalImage && (
        <div
          className="image-modal-overlay"
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              cursor: 'default'
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              ×
            </button>
            <Image
              src={modalImage}
              alt={modalName || 'IOAI Participant'}
              width={1200}
              height={1200}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            {modalName && (
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '0',
                right: '0',
                textAlign: 'center',
                color: '#fff',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                {modalName}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
