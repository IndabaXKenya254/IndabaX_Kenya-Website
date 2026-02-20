"use client";

import React, { useState } from "react";
import { showSuccess, showError, showLoading, closeAlert, showValidationError } from "@/lib/sweetalert";
import { validateEmail, validateName, validateMessage } from "@/lib/validations/form-validation";

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      showValidationError(nameValidation.error || 'Invalid name');
      return;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      showValidationError(emailValidation.error || 'Invalid email address');
      return;
    }

    // Validate message
    const messageValidation = validateMessage(formData.message);
    if (!messageValidation.isValid) {
      showValidationError(messageValidation.error || 'Invalid message');
      return;
    }

    setSubmitting(true);
    showLoading('Sending your message...');

    try {
      // Send contact form submission to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      closeAlert();

      if (response.ok) {
        showSuccess(
          'Message Sent!',
          'Thank you for contacting us. We will get back to you within 24 hours.',
          3000
        );
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        const error = await response.json();
        showError('Send Failed', error.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      closeAlert();
      console.error('Contact form error:', error);
      showError(
        'Error',
        'An unexpected error occurred. Please try again or email us directly at info@deeplearningindabaxkenya.com'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="contact-area ptb-120">
        <div className="container">
          <div className="row align-items-start contact-form">
            <div className="col-lg-4 col-md-12">
              <div className="leave-your-message">
                {/* Issue #39 FIX: Email section removed per client request */}

                <h3>Leave Your Message</h3>
                <p>
                  If you have any questions about IndabaX Kenya 2026 or need
                  information about registration, speaking opportunities, or
                  sponsorship, simply use the form below. We try to respond to all
                  queries within 24 hours.
                </p>

                <div className="stay-connected">
                  <h3>Stay Connected</h3>
                  <ul>
                    <li>
                      <a href="https://www.linkedin.com/company/indabax-kenya" target="_blank">
                        <i className="icofont-linkedin"></i>
                        <span>Linkedin</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-lg-8 col-md-12">
              <form id="contactForm" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-lg-6 col-md-6">
                    <div className="form-group">
                      <label htmlFor="name">Name*</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-6">
                    <div className="form-group">
                      <label htmlFor="email">Email*</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-lg-12 col-md-12">
                    <div className="form-group">
                      <label htmlFor="subject">Subject (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="subject"
                        id="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        disabled={submitting}
                        placeholder="e.g., Registration Question, Sponsorship Inquiry"
                      />
                    </div>
                  </div>

                  <div className="col-lg-12 col-md-12">
                    <div className="form-group">
                      <label htmlFor="message">Message*</label>
                      <textarea
                        name="message"
                        className="form-control"
                        id="message"
                        cols={30}
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-lg-12 col-md-12">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactForm;
