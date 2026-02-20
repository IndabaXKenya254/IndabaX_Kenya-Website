// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TEAM GRID COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Organizing team members display with circular cards and modal details
// Updated: Jan 3, 2026 - Added event filter dropdown
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { TeamMember, Event, ApiSuccessResponse } from "@/types/api";

const TeamGrid: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');

  // Fetch events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const result: ApiSuccessResponse<Event[]> = await response.json();
          setEvents(result.data);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch team members (with optional event_id filter)
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = eventFilter !== 'all'
          ? `/api/team?event_id=${eventFilter}`
          : '/api/team';
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch team members');
        }

        const result: ApiSuccessResponse<TeamMember[]> = await response.json();
        setTeam(result.data);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [eventFilter]);

  const openModal = (member: TeamMember) => {
    setSelectedMember(member);
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  return (
    <div className="team-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Meet The Team</span>
          <h2>
            Our <b>Organizers</b>
          </h2>
          <div className="bar"></div>
        </div>

        {/* Event Filter - Dropdown Style like Speakers */}
        <div className="team-filters mb-5" data-aos="fade-up">
          <div className="card shadow-sm">
            <div className="card-body py-4">
              <div className="row align-items-end justify-content-center g-3">
                {/* Event Dropdown */}
                <div className="col-lg-4 col-md-6">
                  <div className="filter-group">
                    <label htmlFor="eventFilter" className="form-label fw-semibold">
                      <i className="icofont-ui-calendar me-2"></i>Event
                    </label>
                    <select
                      id="eventFilter"
                      className="form-select"
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                    >
                      <option value="all">All Events ({team.length} members)</option>
                      {events.map(event => {
                        // Extract just the event name from title (remove theme text)
                        // Client feedback #4: Remove theme text, keep only event name
                        const titleParts = event.title.split(':');
                        const eventNameOnly = titleParts[0].trim();

                        return (
                          <option key={event.id} value={event.id}>
                            {eventNameOnly}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Filter Summary */}
              {eventFilter !== 'all' && (
                <div className="text-center mt-3 pt-3 border-top">
                  <span className="text-muted me-2">
                    Showing {team.length} team member{team.length !== 1 ? 's' : ''} for this event
                  </span>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setEventFilter('all')}
                  >
                    <i className="icofont-close-circled me-1"></i>
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5" data-aos="fade-up">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading team...</span>
            </div>
            <p className="mt-3">Loading team members...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning"></i> {error}
          </div>
        )}

        {/* Team Grid - Circular Cards */}
        {!loading && !error && team.length > 0 ? (
          <div className="row justify-content-center">
            {team.map((member, index) => (
              <div
                key={member.id}
                className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4"
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay={index * 50}
              >
                <div
                  className="team-circle-card"
                  onClick={() => openModal(member)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="circle-image-wrapper">
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={member.name}
                        width={200}
                        height={200}
                        className="circle-image"
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    ) : (
                      <div className="circle-placeholder">
                        <i className="icofont-user-alt-4" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                      </div>
                    )}
                    <div className="circle-overlay">
                      <i className="icofont-eye" style={{ fontSize: '2rem', color: '#fff' }}></i>
                    </div>
                  </div>
                  <div className="circle-info text-center mt-3">
                    <h5 className="member-name mb-1" style={{ fontSize: '1rem', fontWeight: '600' }}>{member.name}</h5>
                    <p className="member-role mb-0" style={{ fontSize: '0.875rem', color: '#666' }}>{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="text-center py-5">
            <p>No team members found.</p>
          </div>
        ) : null}

      </div>

      {/* Team Member Details Modal */}
      {selectedMember && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-content" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="modal-header border-0" style={{ backgroundColor: '#f8f9fa' }}>
                <h5 className="modal-title w-100 text-center" style={{ fontWeight: '700', fontSize: '1.5rem' }}>
                  Team Member Profile
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4">
                {/* Profile Image - Centered */}
                <div className="d-flex justify-content-center mb-4">
                  {selectedMember.photo_url ? (
                    <div
                      style={{
                        width: '180px',
                        height: '180px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '5px solid #007bff',
                        boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)',
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={selectedMember.photo_url}
                        alt={selectedMember.name}
                        width={180}
                        height={180}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '180px',
                        height: '180px',
                        borderRadius: '50%',
                        backgroundColor: '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '5px solid #007bff',
                        flexShrink: 0,
                      }}
                    >
                      <i className="icofont-user-alt-4" style={{ fontSize: '5rem', color: '#6c757d' }}></i>
                    </div>
                  )}
                </div>

                {/* Name and Role */}
                <div className="text-center mb-4">
                  <h3 style={{ fontWeight: '700', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                    {selectedMember.name}
                  </h3>
                  <p
                    className="text-muted mb-3"
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      color: '#007bff',
                    }}
                  >
                    {selectedMember.role}
                  </p>

                  {/* Social Links */}
                  {(selectedMember.linkedin_url || selectedMember.twitter_url) && (
                    <div className="d-flex justify-content-center gap-3 mb-4">
                      {selectedMember.linkedin_url && (
                        <a
                          href={selectedMember.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ borderRadius: '25px', padding: '8px 20px' }}
                        >
                          <i className="icofont-linkedin"></i> LinkedIn
                        </a>
                      )}
                      {selectedMember.twitter_url && (
                        <a
                          href={selectedMember.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-info btn-sm"
                          style={{ borderRadius: '25px', padding: '8px 20px', color: 'white' }}
                        >
                          <i className="icofont-twitter"></i> Twitter
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio */}
                {selectedMember.bio && (
                  <div className="mb-3">
                    <h6
                      style={{
                        fontWeight: '600',
                        fontSize: '1rem',
                        marginBottom: '1rem',
                        color: '#495057',
                        borderBottom: '2px solid #007bff',
                        paddingBottom: '0.5rem',
                      }}
                    >
                      <i className="icofont-info-circle me-2"></i>About
                    </h6>
                    <p
                      style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.7',
                        color: '#6c757d',
                        textAlign: 'justify',
                      }}
                    >
                      {selectedMember.bio}
                    </p>
                  </div>
                )}

              </div>
              <div className="modal-footer border-0" style={{ backgroundColor: '#f8f9fa', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={closeModal}
                  style={{ borderRadius: '25px', padding: '10px 30px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Styles for Circular Cards */}
      <style jsx>{`
        .team-circle-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          padding: 1rem;
        }

        .team-circle-card:hover {
          transform: translateY(-10px);
        }

        .circle-image-wrapper {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0 auto;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid #007bff;
          box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
          transition: all 0.3s ease;
        }

        .team-circle-card:hover .circle-image-wrapper {
          border-color: #0056b3;
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
        }

        .circle-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .circle-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 123, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .team-circle-card:hover .circle-overlay {
          opacity: 1;
        }

        .member-name {
          color: #333;
          transition: color 0.3s ease;
        }

        .team-circle-card:hover .member-name {
          color: #007bff;
        }

        @media (max-width: 768px) {
          .circle-image-wrapper {
            width: 120px;
            height: 120px;
          }

          .member-name {
            font-size: 0.9rem !important;
          }

          .member-role {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamGrid;
