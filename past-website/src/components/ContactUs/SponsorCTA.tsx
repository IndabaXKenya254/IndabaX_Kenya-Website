// ═══════════════════════════════════════════════════════════════════════
// SPONSOR CTA SECTION - Contact Page
// ═══════════════════════════════════════════════════════════════════════
// Issue #19: "Contact us if you want to become a sponsor" section

import React from "react";
import Link from "next/link";

const SponsorCTA: React.FC = () => {
  return (
    <div
      className="sponsor-cta-area"
      style={{
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        borderBottom: '1px solid #e9ecef',
        paddingTop: '100px',
        paddingBottom: '100px',
        marginTop: '40px',
        marginBottom: '40px'
      }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-8 col-md-12">
            <div className="sponsor-cta-content">
              <span
                style={{
                  display: 'inline-block',
                  color: '#e30045',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}
              >
                Partner With Us
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '15px', color: '#1a1a2e' }}>
                Want to Become a Sponsor?
              </h2>
              <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#666', marginBottom: '20px' }}>
                Join leading organizations in supporting AI education and innovation in Kenya.
                As a sponsor, you'll gain visibility among Africa's brightest AI talents,
                connect with industry leaders, and contribute to building the future of AI on the continent.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '8px 0', fontSize: '15px', color: '#444' }}>
                  <i className="icofont-check-circled" style={{ color: '#28a745', marginRight: '10px', fontSize: '18px' }}></i>
                  Brand visibility at Kenya's premier AI conference
                </li>
                <li style={{ padding: '8px 0', fontSize: '15px', color: '#444' }}>
                  <i className="icofont-check-circled" style={{ color: '#28a745', marginRight: '10px', fontSize: '18px' }}></i>
                  Access to top AI talent and researchers
                </li>
                <li style={{ padding: '8px 0', fontSize: '15px', color: '#444' }}>
                  <i className="icofont-check-circled" style={{ color: '#28a745', marginRight: '10px', fontSize: '18px' }}></i>
                  Networking opportunities with industry leaders
                </li>
                <li style={{ padding: '8px 0', fontSize: '15px', color: '#444' }}>
                  <i className="icofont-check-circled" style={{ color: '#28a745', marginRight: '10px', fontSize: '18px' }}></i>
                  Support AI education and youth development
                </li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4 col-md-12">
            <div
              className="sponsor-cta-buttons text-center"
              style={{
                padding: '30px',
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                marginTop: '0'
              }}
            >
              <div className="sponsor-icon mb-4">
                <i className="icofont-handshake-deal" style={{ fontSize: '80px', color: '#e30045' }}></i>
              </div>
              <Link href="/donate" className="btn btn-primary btn-lg mb-3 d-block">
                View Sponsorship Tiers
                <i className="icofont-double-right ms-2"></i>
              </Link>
              <p className="text-muted small mb-0">
                Or use the contact form above to reach out directly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorCTA;
