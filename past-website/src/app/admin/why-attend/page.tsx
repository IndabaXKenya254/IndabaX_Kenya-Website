'use client';

// ═══════════════════════════════════════════════════════════════════════
// ADMIN - WHY ATTEND CARDS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════
// Issue #44: Admin page to manage "Why Choose IndabaX Kenya" section
// Now includes section header editing

import React, { useState, useEffect } from 'react';
import { getSwal } from '@/lib/sweetalert';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';

interface WhyAttendCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SectionHeader {
  subtitle: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  is_visible: boolean;
}

// Common Icofont icons for selection
const ICON_OPTIONS = [
  { value: 'icofont-users-alt-4', label: 'Users' },
  { value: 'icofont-certificate', label: 'Certificate' },
  { value: 'icofont-network', label: 'Network' },
  { value: 'icofont-ui-file', label: 'Document' },
  { value: 'icofont-rocket-alt-2', label: 'Rocket' },
  { value: 'icofont-certificate-alt-1', label: 'Certificate Alt' },
  { value: 'icofont-star', label: 'Star' },
  { value: 'icofont-brain', label: 'Brain' },
  { value: 'icofont-laptop', label: 'Laptop' },
  { value: 'icofont-globe', label: 'Globe' },
  { value: 'icofont-trophy', label: 'Trophy' },
  { value: 'icofont-lightbulb', label: 'Lightbulb' },
  { value: 'icofont-handshake-deal', label: 'Handshake' },
  { value: 'icofont-calendar', label: 'Calendar' },
  { value: 'icofont-mic', label: 'Microphone' },
];

// Color presets
const COLOR_PRESETS = [
  '#FF2D55', '#00ACEE', '#FFA500', '#9C27B0', '#4CAF50', '#FF6B6B',
  '#006700', '#2196F3', '#E91E63', '#00BCD4', '#795548', '#607D8B'
];

export default function WhyAttendAdminPage() {
  const [cards, setCards] = useState<WhyAttendCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<WhyAttendCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    icon: 'icofont-star',
    title: '',
    description: '',
    color: '#006700',
    sort_order: 0,
    is_active: true
  });

  // Section header state
  const [headerData, setHeaderData] = useState<SectionHeader>({
    subtitle: 'Why Attend',
    title: 'Why Choose IndabaX Kenya',
    description: '',
    button_text: 'Register for IndabaX',
    button_link: '/register',
    is_visible: true
  });
  const [savingHeader, setSavingHeader] = useState(false);

  // Fetch cards and header on mount
  useEffect(() => {
    fetchCards();
    fetchHeader();
  }, []);

  const fetchHeader = async () => {
    try {
      const response = await fetch('/api/admin/why-attend-header');
      const result = await response.json();
      if (result.success && result.data) {
        setHeaderData(result.data);
      }
    } catch (error) {
      console.error('Error fetching header:', error);
    }
  };

  const saveHeader = async () => {
    const Swal = await getSwal();
    setSavingHeader(true);
    try {
      const response = await fetch('/api/admin/why-attend-header', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(headerData)
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Header Saved!',
          text: 'Section header has been updated successfully.',
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
        text: error instanceof Error ? error.message : 'Failed to save header'
      });
    } finally {
      setSavingHeader(false);
    }
  };

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/admin/why-attend');
      const result = await response.json();
      if (result.success) {
        setCards(result.data);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCard(null);
    setFormData({
      icon: 'icofont-star',
      title: '',
      description: '',
      color: '#006700',
      sort_order: cards.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (card: WhyAttendCard) => {
    setEditingCard(card);
    setFormData({
      icon: card.icon,
      title: card.title,
      description: card.description,
      color: card.color,
      sort_order: card.sort_order,
      is_active: card.is_active
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const Swal = await getSwal();

    try {
      const url = editingCard
        ? `/api/admin/why-attend/${editingCard.id}`
        : '/api/admin/why-attend';

      const method = editingCard ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: editingCard ? 'Card Updated!' : 'Card Created!',
          text: `The card "${formData.title}" has been ${editingCard ? 'updated' : 'created'} successfully.`,
          timer: 2000,
          showConfirmButton: false
        });
        closeModal();
        fetchCards();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to save card'
      });
    }
  };

  const handleDelete = async (card: WhyAttendCard) => {
    const Swal = await getSwal();
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Card?',
      text: `Are you sure you want to delete "${card.title}"? This cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/why-attend/${card.id}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The card has been deleted.',
            timer: 1500,
            showConfirmButton: false
          });
          fetchCards();
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete card'
        });
      }
    }
  };

  const toggleActive = async (card: WhyAttendCard) => {
    try {
      const response = await fetch(`/api/admin/why-attend/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...card,
          is_active: !card.is_active
        })
      });

      const result = await response.json();

      if (result.success) {
        fetchCards();
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
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
          <h1 className="h3 mb-1">Why Choose IndabaX Section</h1>
          <p className="text-muted mb-0">
            Manage the header and cards displayed in the "Why Choose IndabaX Kenya" section on the homepage.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="icofont-plus me-2"></i>
          Add New Card
        </button>
      </div>

      {/* Section Header Editor */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="icofont-pencil-alt-5 me-2"></i>
            Section Header
          </h5>
          <button
            className="btn btn-sm btn-primary"
            onClick={saveHeader}
            disabled={savingHeader}
          >
            {savingHeader ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="icofont-save me-1"></i>
                Save Header
              </>
            )}
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Subtitle</label>
              <input
                type="text"
                className="form-control"
                value={headerData.subtitle}
                onChange={(e) => setHeaderData({ ...headerData, subtitle: e.target.value })}
                placeholder="e.g., Why Attend"
              />
              <small className="text-muted">Small text above the title</small>
            </div>
            <div className="col-md-8 mb-3">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-control"
                value={headerData.title}
                onChange={(e) => setHeaderData({ ...headerData, title: e.target.value })}
                placeholder="e.g., Why Choose IndabaX Kenya"
              />
              <small className="text-muted">The year will be appended automatically</small>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={2}
              value={headerData.description}
              onChange={(e) => setHeaderData({ ...headerData, description: e.target.value })}
              placeholder="Brief description of what makes IndabaX unique..."
            ></textarea>
          </div>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Button Text</label>
              <input
                type="text"
                className="form-control"
                value={headerData.button_text}
                onChange={(e) => setHeaderData({ ...headerData, button_text: e.target.value })}
                placeholder="e.g., Register for IndabaX"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Button Link</label>
              <input
                type="text"
                className="form-control"
                value={headerData.button_link}
                onChange={(e) => setHeaderData({ ...headerData, button_link: e.target.value })}
                placeholder="/register"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">&nbsp;</label>
              <div className="form-check mt-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="header_is_visible"
                  checked={headerData.is_visible}
                  onChange={(e) => setHeaderData({ ...headerData, is_visible: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="header_is_visible">
                  Show section on homepage
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Order</th>
                  <th style={{ width: '80px' }}>Icon</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th style={{ width: '80px' }}>Color</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="icofont-info-circle me-2"></i>
                      No cards found. Click "Add New Card" to create one.
                    </td>
                  </tr>
                ) : (
                  cards.map((card) => (
                    <tr key={card.id} className={!card.is_active ? 'table-secondary' : ''}>
                      <td>
                        <span className="badge bg-light text-dark">{card.sort_order}</span>
                      </td>
                      <td>
                        <div
                          className="d-flex align-items-center justify-content-center rounded"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: `${card.color}20`
                          }}
                        >
                          <i className={card.icon} style={{ color: card.color, fontSize: '20px' }}></i>
                        </div>
                      </td>
                      <td>
                        <strong>{card.title}</strong>
                      </td>
                      <td>
                        <small className="text-muted">
                          {card.description.length > 100
                            ? `${card.description.substring(0, 100)}...`
                            : card.description}
                        </small>
                      </td>
                      <td>
                        <div
                          className="rounded"
                          style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: card.color,
                            border: '2px solid #ddd'
                          }}
                          title={card.color}
                        ></div>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${card.is_active ? 'btn-success' : 'btn-outline-secondary'}`}
                          onClick={() => toggleActive(card)}
                        >
                          {card.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openEditModal(card)}
                            title="Edit"
                          >
                            <i className="icofont-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(card)}
                            title="Delete"
                          >
                            <i className="icofont-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="card mt-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-eye me-2"></i>
            Live Preview
          </h5>
        </div>
        <div className="card-body bg-light">
          <div className="row justify-content-center">
            {cards.filter(c => c.is_active).map((card, index) => (
              <div className="col-lg-4 col-md-6 mb-4" key={card.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body text-center">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: `${card.color}20`
                      }}
                    >
                      <i className={card.icon} style={{ color: card.color, fontSize: '28px' }}></i>
                    </div>
                    <h5>{card.title}</h5>
                    <p className="text-muted small">{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCard ? 'Edit Card' : 'Add New Card'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Sort Order</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Icon</label>
                      <select
                        className="form-select"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2">
                        <i className={formData.icon} style={{ fontSize: '24px', color: formData.color }}></i>
                        <small className="text-muted ms-2">{formData.icon}</small>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Color</label>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`btn btn-sm p-0 ${formData.color === color ? 'border-dark border-2' : ''}`}
                            style={{
                              width: '30px',
                              height: '30px',
                              backgroundColor: color,
                              borderRadius: '4px'
                            }}
                            onClick={() => setFormData({ ...formData, color })}
                          ></button>
                        ))}
                      </div>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="is_active">
                        Active (visible on homepage)
                      </label>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="border rounded p-3 bg-light">
                    <h6 className="text-muted mb-3">Preview:</h6>
                    <div className="text-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: `${formData.color}20`
                        }}
                      >
                        <i className={formData.icon} style={{ color: formData.color, fontSize: '28px' }}></i>
                      </div>
                      <h5>{formData.title || 'Card Title'}</h5>
                      <p className="text-muted small mb-0">
                        {formData.description || 'Card description will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCard ? 'Update Card' : 'Create Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
