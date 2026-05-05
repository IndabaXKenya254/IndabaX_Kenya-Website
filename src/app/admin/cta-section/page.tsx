'use client';

// ═══════════════════════════════════════════════════════════════════════
// ADMIN - CTA SECTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════
// Issue #44: Admin page to manage "Secure Your Spot" CTA section

import React, { useState, useEffect } from 'react';
import { getSwal } from '@/lib/sweetalert';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';

interface Highlight {
  icon: string;
  text: string;
}

interface CTASection {
  badge_text: string;
  heading: string;
  description: string;
  button_text: string;
  button_link: string;
  background_image: string;
  highlights: Highlight[];
  is_visible: boolean;
}

// Common Icofont icons for highlights
const ICON_OPTIONS = [
  { value: 'icofont-check-circled', label: 'Check Circle' },
  { value: 'icofont-star', label: 'Star' },
  { value: 'icofont-users-alt-4', label: 'Users' },
  { value: 'icofont-certificate', label: 'Certificate' },
  { value: 'icofont-network', label: 'Network' },
  { value: 'icofont-rocket-alt-2', label: 'Rocket' },
  { value: 'icofont-brain', label: 'Brain' },
  { value: 'icofont-laptop', label: 'Laptop' },
  { value: 'icofont-globe', label: 'Globe' },
  { value: 'icofont-trophy', label: 'Trophy' },
  { value: 'icofont-lightbulb', label: 'Lightbulb' },
  { value: 'icofont-calendar', label: 'Calendar' },
  { value: 'icofont-mic', label: 'Microphone' },
  { value: 'icofont-medal', label: 'Medal' },
  { value: 'icofont-location-pin', label: 'Location' },
];

export default function CTASectionAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CTASection>({
    badge_text: "Don't Miss Out!",
    heading: "Secure Your Spot at IndabaX Kenya",
    description: "",
    button_text: "Register Now",
    button_link: "/register",
    background_image: "/images/buy-tickets-bg.jpg",
    highlights: [],
    is_visible: true
  });

  useEffect(() => {
    fetchCTASection();
  }, []);

  const fetchCTASection = async () => {
    try {
      const response = await fetch('/api/admin/cta-section');
      const result = await response.json();
      if (result.success && result.data) {
        setFormData(result.data);
      }
    } catch (error) {
      console.error('Error fetching CTA section:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const Swal = await getSwal();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/cta-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Saved!',
          text: 'CTA section has been updated successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to save CTA section'
      });
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = () => {
    setFormData({
      ...formData,
      highlights: [
        ...formData.highlights,
        { icon: 'icofont-check-circled', text: '' }
      ]
    });
  };

  const removeHighlight = (index: number) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index)
    });
  };

  const updateHighlight = (index: number, field: keyof Highlight, value: string) => {
    const updatedHighlights = [...formData.highlights];
    updatedHighlights[index] = { ...updatedHighlights[index], [field]: value };
    setFormData({ ...formData, highlights: updatedHighlights });
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">CTA Section</h1>
          <p className="text-muted mb-0">
            Manage the "Secure Your Spot" call-to-action section on the homepage.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Left Column - Form Fields */}
          <div className="col-lg-7">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="icofont-pencil-alt-5 me-2"></i>
                  Content
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Badge Text</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.badge_text}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                      placeholder="e.g., Don't Miss Out!"
                    />
                    <small className="text-muted">Small text above the heading</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="form-check mt-4">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="is_visible"
                        checked={formData.is_visible}
                        onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="is_visible">
                        Visible on homepage
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Heading *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.heading}
                    onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                    placeholder="e.g., Secure Your Spot at IndabaX Kenya"
                    required
                  />
                  <small className="text-muted">The year will be appended automatically from settings</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what attendees will get..."
                  ></textarea>
                  <small className="text-muted">HTML tags like &lt;strong&gt; are supported</small>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Button Text *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      placeholder="e.g., Register Now"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Button Link</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.button_link}
                      onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                      placeholder="/register"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Background Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.background_image}
                    onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
                    placeholder="/images/buy-tickets-bg.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Highlights Section */}
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="icofont-list me-2"></i>
                  Highlights
                </h5>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={addHighlight}
                >
                  <i className="icofont-plus me-1"></i> Add Highlight
                </button>
              </div>
              <div className="card-body">
                {formData.highlights.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="icofont-info-circle d-block mb-2" style={{ fontSize: '32px' }}></i>
                    No highlights yet. Click "Add Highlight" to create one.
                  </div>
                ) : (
                  <div className="list-group">
                    {formData.highlights.map((highlight, index) => (
                      <div key={index} className="list-group-item">
                        <div className="row align-items-center">
                          <div className="col-md-3">
                            <select
                              className="form-select form-select-sm"
                              value={highlight.icon}
                              onChange={(e) => updateHighlight(index, 'icon', e.target.value)}
                            >
                              {ICON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-1 text-center">
                            <i className={highlight.icon} style={{ fontSize: '20px', color: '#006700' }}></i>
                          </div>
                          <div className="col-md-7">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={highlight.text}
                              onChange={(e) => updateHighlight(index, 'text', e.target.value)}
                              placeholder="e.g., 50+ Expert Speakers"
                            />
                          </div>
                          <div className="col-md-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeHighlight(index)}
                              title="Remove"
                            >
                              <i className="icofont-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="col-lg-5">
            <div className="card sticky-top" style={{ top: '90px', zIndex: 100 }}>
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="icofont-eye me-2"></i>
                  Live Preview
                </h5>
              </div>
              <div className="card-body p-0">
                <div
                  className="position-relative text-white p-4"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(255, 45, 85, 0.9) 0%, rgba(0, 172, 238, 0.85) 100%), url(${formData.background_image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '400px'
                  }}
                >
                  {formData.badge_text && (
                    <span
                      style={{
                        color: '#fff',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontSize: '12px',
                        display: 'inline-block',
                        marginBottom: '15px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '8px 20px',
                        borderRadius: '8px'
                      }}
                    >
                      {formData.badge_text}
                    </span>
                  )}
                  <h4
                    className="text-white mb-3"
                    style={{
                      fontWeight: 'bold',
                      lineHeight: 1.3,
                      textShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {formData.heading || 'Your Heading Here'}
                  </h4>
                  {formData.description && (
                    <p
                      className="mb-3"
                      style={{
                        color: 'rgba(255, 255, 255, 0.95)',
                        fontSize: '14px',
                        lineHeight: 1.8,
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}
                      dangerouslySetInnerHTML={{ __html: formData.description }}
                    ></p>
                  )}
                  {formData.highlights.length > 0 && (
                    <ul
                      className="cta-highlights"
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: '0 0 20px 0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10px'
                      }}
                    >
                      {formData.highlights.map((h, i) => (
                        <li
                          key={i}
                          style={{
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <i className={h.icon} style={{ fontSize: '18px', flexShrink: 0 }}></i>
                          {h.text || 'Highlight text...'}
                        </li>
                      ))}
                    </ul>
                  )}
                  <span
                    style={{
                      padding: '16px 40px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      borderRadius: '10px',
                      background: '#fff',
                      color: '#006700',
                      border: 'none',
                      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {formData.button_text || 'Button Text'}
                    <i className="icofont-double-right" style={{ color: '#006700' }}></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="card mt-3">
          <div className="card-body d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={fetchCTASection}
              disabled={saving}
            >
              <i className="icofont-refresh me-1"></i>
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="icofont-save me-1"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
