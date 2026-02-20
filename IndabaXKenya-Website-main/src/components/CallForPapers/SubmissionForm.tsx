// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CALL FOR PAPERS SUBMISSION FORM
// ═══════════════════════════════════════════════════════════════════════
// Paper/workshop/poster submission form for IndabaX Kenya
// Connected to POST /api/papers with file upload
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useEffect } from "react";
import { showSuccess, showError, showLoading, closeAlert, showValidationError } from "@/lib/sweetalert";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { validateEmail, validateName, validateUrl } from "@/lib/validations/form-validation";

interface Event {
  id: string;
  title: string;
  slug: string;
  start_date: string;
}

const SubmissionForm: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    // Presenter Information (pre-filled from user if available)
    name: "",
    email: "",
    organization: "",
    bio: "",
    linkedin: "",
    // Submission Details
    eventId: "",
    submissionType: "talk",
    title: "",
    abstract: "",
    keywords: "",
    track: "",
    // Terms
    agreeToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('events')
          .select('id, title, slug, start_date')
          .in('status', ['published', 'upcoming'])
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Pre-fill email when available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        showError('Invalid File', 'Please upload a PDF file only.');
        e.target.value = '';
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        showError('File Too Large', 'Maximum file size is 10MB.');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    const formDataUpload = new FormData();
    formDataUpload.append('file', selectedFile);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await fetch('/api/papers/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      clearInterval(progressInterval);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      setUploadProgress(100);
      return result.data.path; // Return the storage path
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation using centralized validation utilities
    const errors = [];

    // Validate name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error!);
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error!);
    }

    // Validate organization
    if (!formData.organization.trim()) {
      errors.push('Organization is required');
    }

    // Validate LinkedIn URL (optional but must be valid if provided)
    if (formData.linkedin && formData.linkedin.trim()) {
      const linkedinValidation = validateUrl(formData.linkedin, false);
      if (!linkedinValidation.isValid) {
        errors.push('Please enter a valid LinkedIn URL');
      }
    }

    // Other required fields
    if (!formData.eventId) errors.push('Please select an event');
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      errors.push('Submission title must be at least 5 characters');
    }
    if (!formData.abstract.trim() || formData.abstract.trim().length < 50) {
      errors.push('Abstract must be at least 50 characters');
    }
    if (!formData.track.trim()) errors.push('Please select a track');
    if (!selectedFile) errors.push('Please upload your paper (PDF)');
    if (!formData.agreeToTerms) {
      errors.push('You must agree to the terms and conditions');
    }

    if (errors.length > 0) {
      showValidationError(errors);
      return;
    }

    setIsSubmitting(true);
    showLoading('Uploading your paper...');

    try {
      // Upload file first
      const paperPath = await uploadFile();

      if (!paperPath) {
        throw new Error('Failed to upload paper file');
      }

      closeAlert();
      showLoading('Submitting your paper...');

      // Submit paper
      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: formData.eventId,
          title: formData.title,
          abstract: formData.abstract,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
          paper_url: paperPath,
          supplementary_files: {
            presenter_name: formData.name,
            presenter_bio: formData.bio,
            linkedin: formData.linkedin,
            organization: formData.organization,
            submission_type: formData.submissionType,
            track: formData.track,
          }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Submission failed');
      }

      closeAlert();

      await showSuccess(
        'Submission Received!',
        `Thank you for your submission! Your paper ID is: ${result.data.id.slice(0, 8)}...\n\nYou can track your submission status in your dashboard.`,
        5000
      );

      // Reset form
      setUploadProgress(0);
      setSelectedFile(null);
      setFormData({
        name: "",
        email: user?.email || "",
        organization: "",
        bio: "",
        linkedin: "",
        eventId: "",
        submissionType: "talk",
        title: "",
        abstract: "",
        keywords: "",
        track: "",
        agreeToTerms: false,
      });

      // Redirect to dashboard
      window.location.href = '/dashboard/submissions';
    } catch (error) {
      closeAlert();
      console.error('Submission error:', error);
      showError(
        'Submission Failed',
        error instanceof Error ? error.message : 'An error occurred while submitting your paper. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cfp-form-area ptb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="section-title text-center" data-aos="fade-up">
              <span>Call for Papers</span>
              <h2>
                Submit Your <b>Proposal</b>
              </h2>
              <div className="bar"></div>
              <p className="section-description">
                Share your AI research, insights, or workshop ideas with the
                IndabaX Kenya community. We welcome talks, workshops, and
                posters on all aspects of machine learning and artificial
                intelligence.
              </p>
            </div>

            {settings.submission_deadline && (
              <div className="cfp-deadline" data-aos="fade-up">
                <i className="icofont-calendar"></i>
                <strong>Submission Deadline:</strong>{' '}
                {new Date(settings.submission_deadline).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            )}

            <div className="cfp-form-wrapper" data-aos="fade-up">
              <form onSubmit={handleSubmit} className="cfp-form">
                {/* Event Selection */}
                <div className="form-section">
                  <h3>Select Event</h3>
                  <div className="form-group">
                    <label htmlFor="eventId">
                      Event <span className="required">*</span>
                    </label>
                    {loadingEvents ? (
                      <div className="text-muted">Loading events...</div>
                    ) : events.length === 0 ? (
                      <div className="alert alert-warning">
                        No upcoming events accepting submissions. Please check back later.
                      </div>
                    ) : (
                      <select
                        id="eventId"
                        name="eventId"
                        className="form-control"
                        value={formData.eventId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select an event</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title} - {new Date(event.start_date).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Presenter Information */}
                <div className="form-section">
                  <h3>Presenter Information</h3>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="name">
                          Full Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="form-control"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Dr. Jane Doe"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="email">
                          Email Address <span className="required">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-control"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="jane.doe@university.edu"
                          readOnly={!!user?.email}
                        />
                        {user?.email && (
                          <small className="form-text text-muted">
                            Email from your account
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="organization">
                          Organization/Institution{" "}
                          <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="organization"
                          name="organization"
                          className="form-control"
                          value={formData.organization}
                          onChange={handleChange}
                          required
                          placeholder="University of Nairobi"
                        />
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="bio">
                          Short Bio <span className="required">*</span>
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          className="form-control"
                          rows={4}
                          value={formData.bio}
                          onChange={handleChange}
                          required
                          placeholder="Brief biography (2-3 sentences) highlighting your background and research interests..."
                        ></textarea>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="linkedin">LinkedIn Profile</label>
                        <input
                          type="url"
                          id="linkedin"
                          name="linkedin"
                          className="form-control"
                          value={formData.linkedin}
                          onChange={handleChange}
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Type */}
                <div className="form-section">
                  <h3>Submission Type</h3>
                  <div className="submission-types">
                    <label className="submission-option">
                      <input
                        type="radio"
                        name="submissionType"
                        value="talk"
                        checked={formData.submissionType === "talk"}
                        onChange={handleChange}
                      />
                      <div className="submission-card">
                        <i className="icofont-presentation"></i>
                        <h4>Talk</h4>
                        <p>30-45 minute presentation</p>
                      </div>
                    </label>

                    <label className="submission-option">
                      <input
                        type="radio"
                        name="submissionType"
                        value="workshop"
                        checked={formData.submissionType === "workshop"}
                        onChange={handleChange}
                      />
                      <div className="submission-card">
                        <i className="icofont-tools-alt-2"></i>
                        <h4>Workshop</h4>
                        <p>2-3 hour hands-on session</p>
                      </div>
                    </label>

                    <label className="submission-option">
                      <input
                        type="radio"
                        name="submissionType"
                        value="poster"
                        checked={formData.submissionType === "poster"}
                        onChange={handleChange}
                      />
                      <div className="submission-card">
                        <i className="icofont-id"></i>
                        <h4>Poster</h4>
                        <p>Visual research presentation</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submission Details */}
                <div className="form-section">
                  <h3>Submission Details</h3>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="title">
                          Title <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          className="form-control"
                          value={formData.title}
                          onChange={handleChange}
                          required
                          placeholder="Title of your talk/workshop/poster"
                        />
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="abstract">
                          Abstract <span className="required">*</span>
                        </label>
                        <textarea
                          id="abstract"
                          name="abstract"
                          className="form-control"
                          rows={8}
                          value={formData.abstract}
                          onChange={handleChange}
                          required
                          placeholder="Detailed abstract (250-500 words) describing your work, methodology, and key findings..."
                        ></textarea>
                        <small className="form-text">
                          {formData.abstract.split(" ").filter((w) => w).length}{" "}
                          / 500 words
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="keywords">
                          Keywords <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="keywords"
                          name="keywords"
                          className="form-control"
                          value={formData.keywords}
                          onChange={handleChange}
                          required
                          placeholder="machine learning, NLP, computer vision"
                        />
                        <small className="form-text">
                          Comma-separated (3-5 keywords)
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="track">
                          Track <span className="required">*</span>
                        </label>
                        <select
                          id="track"
                          name="track"
                          className="form-control"
                          value={formData.track}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Track</option>
                          <option value="nlp">Natural Language Processing</option>
                          <option value="cv">Computer Vision</option>
                          <option value="rl">Reinforcement Learning</option>
                          <option value="healthcare">Healthcare AI</option>
                          <option value="agriculture">AgriTech AI</option>
                          <option value="climate">Climate & Environment</option>
                          <option value="ethics">AI Ethics & Fairness</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="form-section">
                  <h3>Paper Document</h3>
                  <div className="form-group">
                    <label htmlFor="file">
                      Upload PDF <span className="required">*</span>
                    </label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="file"
                        name="file"
                        className="file-input"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        required
                      />
                      <label htmlFor="file" className="file-label">
                        <i className="icofont-cloud-upload"></i>
                        {selectedFile
                          ? selectedFile.name
                          : "Choose PDF file (max 10MB)"}
                      </label>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="upload-progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                        <span>{uploadProgress}%</span>
                      </div>
                    )}
                    {uploadProgress === 100 && (
                      <div className="upload-success">
                        <i className="icofont-check"></i> File uploaded
                        successfully
                      </div>
                    )}
                    <small className="form-text text-muted">
                      Your paper will be reviewed by our committee. Only PDF files accepted.
                    </small>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="form-section">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        required
                      />
                      <span>
                        I agree to the submission guidelines and confirm that
                        this work is original and has not been published
                        elsewhere
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting || !formData.agreeToTerms || events.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="icofont-spinner icofont-spin"></i>{" "}
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="icofont-paper-plane"></i> Submit Proposal
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;
