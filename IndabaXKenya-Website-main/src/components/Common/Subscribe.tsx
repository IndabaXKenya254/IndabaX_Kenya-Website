"use client";

import React, { useState } from "react";
import { showSuccess, showError, showToast, showValidationError } from "@/lib/sweetalert";
import { validateEmail } from "@/lib/validations/form-validation";

const Subscribe: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email using centralized validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      showValidationError(emailValidation.error || 'Invalid email address');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setEmail("");
        showToast(
          'Successfully subscribed! Thank you for joining our community.',
          'success',
          'top-end',
          4000
        );
      } else {
        showError(
          'Subscription Failed',
          result.error?.message || 'Unable to subscribe at this time. Please try again later.'
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showError(
        'Subscription Failed',
        'Unable to subscribe at this time. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="subscribe-area ptb-10 bg-f9f9f9">
        <div className="container">
          <div className="subscribe-inner" style={{ color: '#1a1a1a' }}>
            <span style={{ color: '#ff5722' }}>Stay Updated</span>
            <h2 style={{ color: '#1a1a1a' }}>Subscribe to Our Newsletter</h2>
            <p className="subscribe-description" style={{ color: '#555' }}>
              Get the latest updates on IndabaX Kenya 2026, speaker announcements,
              workshop schedules, and exclusive AI content delivered to your inbox.
            </p>

            <form className="newsletter-form" onSubmit={handleSubmit}>
              <label htmlFor="newsletter-email" className="visually-hidden">
                Email Address
              </label>
              <input
                type="email"
                id="newsletter-email"
                className="form-control"
                placeholder="Enter your email address"
                name="EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                aria-describedby="privacy-note"
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
                aria-label={submitting ? "Subscribing to newsletter" : "Subscribe to newsletter"}
              >
                <span>{submitting ? "Subscribing..." : "Subscribe"}</span>
                {!submitting && <i className="icofont-paper-plane" aria-hidden="true"></i>}
              </button>
            </form>

            <p id="privacy-note" className="privacy-note" style={{ color: '#666' }}>
              <i className="icofont-lock" aria-hidden="true"></i> We respect your privacy.
              Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Subscribe;
