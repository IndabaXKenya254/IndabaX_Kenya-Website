"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSettings, useSocialLinks } from "@/contexts/SettingsContext";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useSettings();
  const socialLinks = useSocialLinks();

  // Default contact info if not set in settings
  const contactEmail = settings.contact_email || "info@deeplearningindabaxkenya.com";
  const contactAddress = settings.contact_address || "Nairobi, Kenya";

  // Issue #35: Redesigned footer to 4-column layout per client request
  return (
    <>
      <footer className="footer-area footer-redesigned">
        <div className="container">
          <div className="row">
            {/* Column 1: Logo & About */}
            <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
              <div className="single-footer-widget">
                <div className="footer-logo mb-3">
                  <Link href="/">
                    <Image
                      src="/images/logo.jpg"
                      alt="IndabaX Kenya Logo"
                      width={200}
                      height={63}
                      className="logo-image"
                    />
                  </Link>
                </div>
                <p className="footer-description">
                  IndabaX Kenya is part of the global Deep Learning Indaba movement,
                  strengthening AI and Machine Learning across Africa.
                </p>
                <ul className="social-links">
                  {socialLinks.twitter && (
                    <li>
                      <a
                        href={socialLinks.twitter}
                        className="twitter"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter"
                      >
                        <i className="icofont-twitter"></i>
                      </a>
                    </li>
                  )}
                  {socialLinks.linkedin && (
                    <li>
                      <a
                        href={socialLinks.linkedin}
                        className="linkedin"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                      >
                        <i className="icofont-linkedin"></i>
                      </a>
                    </li>
                  )}
                  {socialLinks.youtube && (
                    <li>
                      <a
                        href={socialLinks.youtube}
                        className="youtube"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                      >
                        <i className="icofont-youtube-play"></i>
                      </a>
                    </li>
                  )}
                  {socialLinks.instagram && (
                    <li>
                      <a
                        href={socialLinks.instagram}
                        className="instagram"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                      >
                        <i className="icofont-instagram"></i>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
              <div className="single-footer-widget">
                <h3>Quick Links</h3>
                <ul className="footer-links">
                  <li>
                    <Link href="/about-us">About Us</Link>
                  </li>
                  <li>
                    <Link href="/events">Events</Link>
                  </li>
                  <li>
                    <Link href="/speakers">Speakers</Link>
                  </li>
                  <li>
                    <Link href="/team">Our Team</Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 3: Resources */}
            <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
              <div className="single-footer-widget">
                <h3>Resources</h3>
                <ul className="footer-links">
                  <li>
                    <Link href="/gallery">Gallery</Link>
                  </li>
                  <li>
                    <Link href="/news">News & Updates</Link>
                  </li>
                  <li>
                    <Link href="/noai">NOAI</Link>
                  </li>
                  <li>
                    <Link href="/history">Previous Editions</Link>
                  </li>
                  {/* Issue #20: Internal donations page */}
                  <li>
                    <Link href="/donate">Donate / Sponsor</Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 4: Contact */}
            <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
              <div className="single-footer-widget">
                <h3>Contact Us</h3>
                <ul className="footer-contact-list">
                  <li className="contact-item">
                    <div className="contact-icon">
                      <i className="icofont-email"></i>
                    </div>
                    <div className="contact-text">
                      <span className="contact-label">Email</span>
                      <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                    </div>
                  </li>
                  <li className="contact-item">
                    <div className="contact-icon">
                      <i className="icofont-location-pin"></i>
                    </div>
                    <div className="contact-text">
                      <span className="contact-label">Location</span>
                      <span>{contactAddress}</span>
                    </div>
                  </li>
                  <li className="contact-item">
                    <div className="contact-icon">
                      <i className="icofont-web"></i>
                    </div>
                    <div className="contact-text">
                      <span className="contact-label">Website</span>
                      <a href="https://deeplearningindabaxkenya.com" target="_blank" rel="noopener noreferrer">
                        deeplearningindabaxkenya.com
                      </a>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright Row */}
            <div className="col-lg-12">
              <div className="copyright-area">
                <ul>
                  <li>
                    <Link href="/privacy-policy">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link href="/terms-conditions">Terms & Conditions</Link>
                  </li>
                </ul>

                <p>
                  © {currentYear} IndabaX Kenya. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
