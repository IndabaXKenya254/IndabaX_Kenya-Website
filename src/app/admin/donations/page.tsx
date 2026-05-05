'use client';

// ═══════════════════════════════════════════════════════════════════════
// ADMIN - DONATIONS MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════
// Issue #20: Admin page to manage donations page content
// Tabs: Payment Methods, Why Support Cards, Impact Cards, Content Sections

import React, { useState, useEffect } from 'react';
import { getSwal } from '@/lib/sweetalert';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';

// ═══════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  details: string;
  icon: string;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface WhySupportCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface ImpactCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  stat_value: string;
  stat_label: string;
  color: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

type TabType = 'payment_methods' | 'why_cards' | 'impact_cards' | 'content';

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const ICON_OPTIONS = [
  { value: 'icofont-credit-card', label: 'Credit Card' },
  { value: 'icofont-bank', label: 'Bank' },
  { value: 'icofont-money', label: 'Money' },
  { value: 'icofont-wallet', label: 'Wallet' },
  { value: 'icofont-ui-call', label: 'Phone/Mobile' },
  { value: 'icofont-globe', label: 'Globe' },
  { value: 'icofont-heart', label: 'Heart' },
  { value: 'icofont-gift', label: 'Gift' },
  { value: 'icofont-users-alt-4', label: 'Users' },
  { value: 'icofont-certificate', label: 'Certificate' },
  { value: 'icofont-network', label: 'Network' },
  { value: 'icofont-rocket-alt-2', label: 'Rocket' },
  { value: 'icofont-star', label: 'Star' },
  { value: 'icofont-brain', label: 'Brain' },
  { value: 'icofont-laptop', label: 'Laptop' },
  { value: 'icofont-trophy', label: 'Trophy' },
  { value: 'icofont-lightbulb', label: 'Lightbulb' },
  { value: 'icofont-handshake-deal', label: 'Handshake' },
  { value: 'icofont-chart-growth', label: 'Growth Chart' },
  { value: 'icofont-graduate', label: 'Graduate' },
  { value: 'icofont-building', label: 'Building' },
  { value: 'icofont-check-circled', label: 'Check Circle' },
];

const COLOR_PRESETS = [
  '#FF2D55', '#00ACEE', '#FFA500', '#9C27B0', '#4CAF50', '#FF6B6B',
  '#006700', '#2196F3', '#E91E63', '#00BCD4', '#795548', '#607D8B'
];

const PAYMENT_TYPE_OPTIONS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' },
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function DonationsAdminPage() {
  // State for each data type
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [whyCards, setWhyCards] = useState<WhySupportCard[]>([]);
  const [impactCards, setImpactCards] = useState<ImpactCard[]>([]);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('payment_methods');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form data for each type
  const [paymentFormData, setPaymentFormData] = useState({
    name: '',
    type: 'mpesa',
    details: '',
    icon: 'icofont-money',
    is_enabled: true,
    display_order: 0,
  });

  const [whyCardFormData, setWhyCardFormData] = useState({
    icon: 'icofont-heart',
    title: '',
    description: '',
    color: '#006700',
    display_order: 0,
    is_visible: true,
  });

  const [impactCardFormData, setImpactCardFormData] = useState({
    icon: 'icofont-users-alt-4',
    title: '',
    description: '',
    stat_value: '',
    stat_label: '',
    color: '#006700',
    display_order: 0,
    is_visible: true,
  });

  const [contentFormData, setContentFormData] = useState({
    section_key: '',
    title: '',
    subtitle: '',
    content: '',
    is_visible: true,
    display_order: 0,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchData('payment_methods'),
        fetchData('why_cards'),
        fetchData('impact_cards'),
        fetchData('content'),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (type: TabType) => {
    try {
      const response = await fetch(`/api/admin/donations?type=${type}`);
      const result = await response.json();
      if (result.data) {
        switch (type) {
          case 'payment_methods':
            setPaymentMethods(result.data);
            break;
          case 'why_cards':
            setWhyCards(result.data);
            break;
          case 'impact_cards':
            setImpactCards(result.data);
            break;
          case 'content':
            setContentSections(result.data);
            break;
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL HANDLING
  // ═══════════════════════════════════════════════════════════════════════

  const openAddModal = () => {
    setEditingItem(null);
    resetFormData();
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    populateFormData(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    resetFormData();
  };

  const resetFormData = () => {
    switch (activeTab) {
      case 'payment_methods':
        setPaymentFormData({
          name: '',
          type: 'mpesa',
          details: '',
          icon: 'icofont-money',
          is_enabled: true,
          display_order: paymentMethods.length + 1,
        });
        break;
      case 'why_cards':
        setWhyCardFormData({
          icon: 'icofont-heart',
          title: '',
          description: '',
          color: '#006700',
          display_order: whyCards.length + 1,
          is_visible: true,
        });
        break;
      case 'impact_cards':
        setImpactCardFormData({
          icon: 'icofont-users-alt-4',
          title: '',
          description: '',
          stat_value: '',
          stat_label: '',
          color: '#006700',
          display_order: impactCards.length + 1,
          is_visible: true,
        });
        break;
      case 'content':
        setContentFormData({
          section_key: '',
          title: '',
          subtitle: '',
          content: '',
          is_visible: true,
          display_order: contentSections.length + 1,
        });
        break;
    }
  };

  const populateFormData = (item: any) => {
    switch (activeTab) {
      case 'payment_methods':
        setPaymentFormData({
          name: item.name || '',
          type: item.type || 'mpesa',
          details: item.details || '',
          icon: item.icon || 'icofont-money',
          is_enabled: item.is_enabled ?? true,
          display_order: item.display_order || 0,
        });
        break;
      case 'why_cards':
        setWhyCardFormData({
          icon: item.icon || 'icofont-heart',
          title: item.title || '',
          description: item.description || '',
          color: item.color || '#006700',
          display_order: item.display_order || 0,
          is_visible: item.is_visible ?? true,
        });
        break;
      case 'impact_cards':
        setImpactCardFormData({
          icon: item.icon || 'icofont-users-alt-4',
          title: item.title || '',
          description: item.description || '',
          stat_value: item.stat_value || '',
          stat_label: item.stat_label || '',
          color: item.color || '#006700',
          display_order: item.display_order || 0,
          is_visible: item.is_visible ?? true,
        });
        break;
      case 'content':
        setContentFormData({
          section_key: item.section_key || '',
          title: item.title || '',
          subtitle: item.subtitle || '',
          content: item.content || '',
          is_visible: item.is_visible ?? true,
          display_order: item.display_order || 0,
        });
        break;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const Swal = await getSwal();

    let formData: any;
    switch (activeTab) {
      case 'payment_methods':
        formData = paymentFormData;
        break;
      case 'why_cards':
        formData = whyCardFormData;
        break;
      case 'impact_cards':
        formData = impactCardFormData;
        break;
      case 'content':
        formData = contentFormData;
        break;
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { type: activeTab, id: editingItem.id, ...formData }
        : { type: activeTab, ...formData };

      const response = await fetch('/api/admin/donations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.data || result.success) {
        await Swal.fire({
          icon: 'success',
          title: editingItem ? 'Updated!' : 'Created!',
          text: `The item has been ${editingItem ? 'updated' : 'created'} successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });
        closeModal();
        fetchData(activeTab);
      } else {
        throw new Error(result.error || 'Operation failed');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to save item',
      });
    }
  };

  const handleDelete = async (item: any) => {
    const Swal = await getSwal();
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Item?',
      text: `Are you sure you want to delete "${item.name || item.title || item.section_key}"? This cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `/api/admin/donations?type=${activeTab}&id=${item.id}`,
          { method: 'DELETE' }
        );

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The item has been deleted.',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchData(activeTab);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete item',
        });
      }
    }
  };

  const toggleStatus = async (item: any, field: 'is_enabled' | 'is_visible') => {
    try {
      const response = await fetch('/api/admin/donations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          id: item.id,
          [field]: !item[field],
        }),
      });

      const result = await response.json();

      if (result.data || result.success) {
        fetchData(activeTab);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case 'payment_methods':
        return 'Payment Methods';
      case 'why_cards':
        return 'Why Support Cards';
      case 'impact_cards':
        return 'Impact Cards';
      case 'content':
        return 'Content Sections';
    }
  };

  const getTabIcon = (tab: TabType): string => {
    switch (tab) {
      case 'payment_methods':
        return 'icofont-credit-card';
      case 'why_cards':
        return 'icofont-heart';
      case 'impact_cards':
        return 'icofont-chart-growth';
      case 'content':
        return 'icofont-ui-text-loading';
    }
  };

  const getItemCount = (tab: TabType): number => {
    switch (tab) {
      case 'payment_methods':
        return paymentMethods.length;
      case 'why_cards':
        return whyCards.length;
      case 'impact_cards':
        return impactCards.length;
      case 'content':
        return contentSections.length;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <DashboardLayout allowedRoles={['admin']}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Donations Management</h1>
          <p className="text-muted mb-0">
            Manage payment methods, why support cards, impact statistics, and content sections.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="icofont-plus me-2"></i>
          Add New
        </button>
      </div>

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs mb-4">
        {(['payment_methods', 'why_cards', 'impact_cards', 'content'] as TabType[]).map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <i className={`${getTabIcon(tab)} me-2`}></i>
              {getTabLabel(tab)}
              <span className="badge bg-secondary ms-2">{getItemCount(tab)}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div className="card">
        <div className="card-body">
          {/* Payment Methods Tab */}
          {activeTab === 'payment_methods' && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Order</th>
                    <th style={{ width: '60px' }}>Icon</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <i className="icofont-info-circle me-2"></i>
                        No payment methods found. Click "Add New" to create one.
                      </td>
                    </tr>
                  ) : (
                    paymentMethods.map((item) => (
                      <tr key={item.id} className={!item.is_enabled ? 'table-secondary' : ''}>
                        <td>
                          <span className="badge bg-light text-dark">{item.display_order}</span>
                        </td>
                        <td>
                          <i className={item.icon} style={{ fontSize: '24px' }}></i>
                        </td>
                        <td><strong>{item.name}</strong></td>
                        <td>
                          <span className="badge bg-info">{item.type}</span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {item.details && item.details.length > 50
                              ? `${item.details.substring(0, 50)}...`
                              : item.details || '-'}
                          </small>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${item.is_enabled ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => toggleStatus(item, 'is_enabled')}
                          >
                            {item.is_enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openEditModal(item)}
                              title="Edit"
                            >
                              <i className="icofont-edit"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(item)}
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
          )}

          {/* Why Support Cards Tab */}
          {activeTab === 'why_cards' && (
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
                  {whyCards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <i className="icofont-info-circle me-2"></i>
                        No why support cards found. Click "Add New" to create one.
                      </td>
                    </tr>
                  ) : (
                    whyCards.map((card) => (
                      <tr key={card.id} className={!card.is_visible ? 'table-secondary' : ''}>
                        <td>
                          <span className="badge bg-light text-dark">{card.display_order}</span>
                        </td>
                        <td>
                          <div
                            className="d-flex align-items-center justify-content-center rounded"
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: `${card.color}20`,
                            }}
                          >
                            <i className={card.icon} style={{ color: card.color, fontSize: '20px' }}></i>
                          </div>
                        </td>
                        <td><strong>{card.title}</strong></td>
                        <td>
                          <small className="text-muted">
                            {card.description.length > 80
                              ? `${card.description.substring(0, 80)}...`
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
                              border: '2px solid #ddd',
                            }}
                            title={card.color}
                          ></div>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${card.is_visible ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => toggleStatus(card, 'is_visible')}
                          >
                            {card.is_visible ? 'Visible' : 'Hidden'}
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
          )}

          {/* Impact Cards Tab */}
          {activeTab === 'impact_cards' && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Order</th>
                    <th style={{ width: '80px' }}>Icon</th>
                    <th>Title</th>
                    <th>Statistic</th>
                    <th>Description</th>
                    <th style={{ width: '80px' }}>Color</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {impactCards.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <i className="icofont-info-circle me-2"></i>
                        No impact cards found. Click "Add New" to create one.
                      </td>
                    </tr>
                  ) : (
                    impactCards.map((card) => (
                      <tr key={card.id} className={!card.is_visible ? 'table-secondary' : ''}>
                        <td>
                          <span className="badge bg-light text-dark">{card.display_order}</span>
                        </td>
                        <td>
                          <div
                            className="d-flex align-items-center justify-content-center rounded"
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: `${card.color}20`,
                            }}
                          >
                            <i className={card.icon} style={{ color: card.color, fontSize: '20px' }}></i>
                          </div>
                        </td>
                        <td><strong>{card.title}</strong></td>
                        <td>
                          <span className="badge bg-primary fs-6">{card.stat_value}</span>
                          <br />
                          <small className="text-muted">{card.stat_label}</small>
                        </td>
                        <td>
                          <small className="text-muted">
                            {card.description && card.description.length > 60
                              ? `${card.description.substring(0, 60)}...`
                              : card.description || '-'}
                          </small>
                        </td>
                        <td>
                          <div
                            className="rounded"
                            style={{
                              width: '30px',
                              height: '30px',
                              backgroundColor: card.color,
                              border: '2px solid #ddd',
                            }}
                            title={card.color}
                          ></div>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${card.is_visible ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => toggleStatus(card, 'is_visible')}
                          >
                            {card.is_visible ? 'Visible' : 'Hidden'}
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
          )}

          {/* Content Sections Tab */}
          {activeTab === 'content' && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Order</th>
                    <th>Section Key</th>
                    <th>Title</th>
                    <th>Subtitle</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentSections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <i className="icofont-info-circle me-2"></i>
                        No content sections found. Click "Add New" to create one.
                      </td>
                    </tr>
                  ) : (
                    contentSections.map((section) => (
                      <tr key={section.id} className={!section.is_visible ? 'table-secondary' : ''}>
                        <td>
                          <span className="badge bg-light text-dark">{section.display_order}</span>
                        </td>
                        <td>
                          <code>{section.section_key}</code>
                        </td>
                        <td><strong>{section.title}</strong></td>
                        <td>
                          <small className="text-muted">
                            {section.subtitle && section.subtitle.length > 60
                              ? `${section.subtitle.substring(0, 60)}...`
                              : section.subtitle || '-'}
                          </small>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${section.is_visible ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => toggleStatus(section, 'is_visible')}
                          >
                            {section.is_visible ? 'Visible' : 'Hidden'}
                          </button>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openEditModal(section)}
                              title="Edit"
                            >
                              <i className="icofont-edit"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(section)}
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
          )}
        </div>
      </div>

      {/* Preview Section for Cards */}
      {(activeTab === 'why_cards' || activeTab === 'impact_cards') && (
        <div className="card mt-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="icofont-eye me-2"></i>
              Live Preview
            </h5>
          </div>
          <div className="card-body bg-light">
            <div className="row justify-content-center">
              {activeTab === 'why_cards' &&
                whyCards.filter((c) => c.is_visible).map((card) => (
                  <div className="col-lg-4 col-md-6 mb-4" key={card.id}>
                    <div className="card h-100 shadow-sm">
                      <div className="card-body text-center">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: `${card.color}20`,
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
              {activeTab === 'impact_cards' &&
                impactCards.filter((c) => c.is_visible).map((card) => (
                  <div className="col-lg-3 col-md-6 mb-4" key={card.id}>
                    <div className="card h-100 shadow-sm text-center">
                      <div className="card-body">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: `${card.color}20`,
                          }}
                        >
                          <i className={card.icon} style={{ color: card.color, fontSize: '28px' }}></i>
                        </div>
                        <h2 className="mb-0" style={{ color: card.color }}>{card.stat_value}</h2>
                        <p className="text-muted mb-2">{card.stat_label}</p>
                        <h6>{card.title}</h6>
                        {card.description && (
                          <p className="text-muted small mb-0">{card.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'Edit' : 'Add New'} {getTabLabel(activeTab).slice(0, -1)}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Payment Methods Form */}
                  {activeTab === 'payment_methods' && (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={paymentFormData.name}
                            onChange={(e) =>
                              setPaymentFormData({ ...paymentFormData, name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Type *</label>
                          <select
                            className="form-select"
                            value={paymentFormData.type}
                            onChange={(e) =>
                              setPaymentFormData({ ...paymentFormData, type: e.target.value })
                            }
                          >
                            {PAYMENT_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Details</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={paymentFormData.details}
                          onChange={(e) =>
                            setPaymentFormData({ ...paymentFormData, details: e.target.value })
                          }
                          placeholder="Account number, instructions, etc."
                        ></textarea>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Icon</label>
                          <select
                            className="form-select"
                            value={paymentFormData.icon}
                            onChange={(e) =>
                              setPaymentFormData({ ...paymentFormData, icon: e.target.value })
                            }
                          >
                            {ICON_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="mt-2">
                            <i className={paymentFormData.icon} style={{ fontSize: '24px' }}></i>
                            <small className="text-muted ms-2">{paymentFormData.icon}</small>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Display Order</label>
                          <input
                            type="number"
                            className="form-control"
                            value={paymentFormData.display_order}
                            onChange={(e) =>
                              setPaymentFormData({
                                ...paymentFormData,
                                display_order: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="is_enabled"
                          checked={paymentFormData.is_enabled}
                          onChange={(e) =>
                            setPaymentFormData({ ...paymentFormData, is_enabled: e.target.checked })
                          }
                        />
                        <label className="form-check-label" htmlFor="is_enabled">
                          Enabled (visible on donations page)
                        </label>
                      </div>
                    </>
                  )}

                  {/* Why Support Cards Form */}
                  {activeTab === 'why_cards' && (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Title *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={whyCardFormData.title}
                            onChange={(e) =>
                              setWhyCardFormData({ ...whyCardFormData, title: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Display Order</label>
                          <input
                            type="number"
                            className="form-control"
                            value={whyCardFormData.display_order}
                            onChange={(e) =>
                              setWhyCardFormData({
                                ...whyCardFormData,
                                display_order: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description *</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={whyCardFormData.description}
                          onChange={(e) =>
                            setWhyCardFormData({ ...whyCardFormData, description: e.target.value })
                          }
                          required
                        ></textarea>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Icon</label>
                          <select
                            className="form-select"
                            value={whyCardFormData.icon}
                            onChange={(e) =>
                              setWhyCardFormData({ ...whyCardFormData, icon: e.target.value })
                            }
                          >
                            {ICON_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="mt-2">
                            <i
                              className={whyCardFormData.icon}
                              style={{ fontSize: '24px', color: whyCardFormData.color }}
                            ></i>
                            <small className="text-muted ms-2">{whyCardFormData.icon}</small>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Color</label>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            {COLOR_PRESETS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`btn btn-sm p-0 ${
                                  whyCardFormData.color === color ? 'border-dark border-2' : ''
                                }`}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  backgroundColor: color,
                                  borderRadius: '4px',
                                }}
                                onClick={() => setWhyCardFormData({ ...whyCardFormData, color })}
                              ></button>
                            ))}
                          </div>
                          <input
                            type="color"
                            className="form-control form-control-color"
                            value={whyCardFormData.color}
                            onChange={(e) =>
                              setWhyCardFormData({ ...whyCardFormData, color: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="is_visible_why"
                          checked={whyCardFormData.is_visible}
                          onChange={(e) =>
                            setWhyCardFormData({ ...whyCardFormData, is_visible: e.target.checked })
                          }
                        />
                        <label className="form-check-label" htmlFor="is_visible_why">
                          Visible (shown on donations page)
                        </label>
                      </div>
                      {/* Preview */}
                      <div className="border rounded p-3 bg-light mt-3">
                        <h6 className="text-muted mb-3">Preview:</h6>
                        <div className="text-center">
                          <div
                            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                            style={{
                              width: '60px',
                              height: '60px',
                              backgroundColor: `${whyCardFormData.color}20`,
                            }}
                          >
                            <i
                              className={whyCardFormData.icon}
                              style={{ color: whyCardFormData.color, fontSize: '28px' }}
                            ></i>
                          </div>
                          <h5>{whyCardFormData.title || 'Card Title'}</h5>
                          <p className="text-muted small mb-0">
                            {whyCardFormData.description || 'Card description will appear here...'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Impact Cards Form */}
                  {activeTab === 'impact_cards' && (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Title *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={impactCardFormData.title}
                            onChange={(e) =>
                              setImpactCardFormData({ ...impactCardFormData, title: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Display Order</label>
                          <input
                            type="number"
                            className="form-control"
                            value={impactCardFormData.display_order}
                            onChange={(e) =>
                              setImpactCardFormData({
                                ...impactCardFormData,
                                display_order: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Statistic Value *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={impactCardFormData.stat_value}
                            onChange={(e) =>
                              setImpactCardFormData({ ...impactCardFormData, stat_value: e.target.value })
                            }
                            placeholder="e.g., 500+, 95%, $10K"
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Statistic Label *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={impactCardFormData.stat_label}
                            onChange={(e) =>
                              setImpactCardFormData({ ...impactCardFormData, stat_label: e.target.value })
                            }
                            placeholder="e.g., Students Trained, Success Rate"
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={impactCardFormData.description}
                          onChange={(e) =>
                            setImpactCardFormData({ ...impactCardFormData, description: e.target.value })
                          }
                          placeholder="Optional additional description"
                        ></textarea>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Icon</label>
                          <select
                            className="form-select"
                            value={impactCardFormData.icon}
                            onChange={(e) =>
                              setImpactCardFormData({ ...impactCardFormData, icon: e.target.value })
                            }
                          >
                            {ICON_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="mt-2">
                            <i
                              className={impactCardFormData.icon}
                              style={{ fontSize: '24px', color: impactCardFormData.color }}
                            ></i>
                            <small className="text-muted ms-2">{impactCardFormData.icon}</small>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Color</label>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            {COLOR_PRESETS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`btn btn-sm p-0 ${
                                  impactCardFormData.color === color ? 'border-dark border-2' : ''
                                }`}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  backgroundColor: color,
                                  borderRadius: '4px',
                                }}
                                onClick={() => setImpactCardFormData({ ...impactCardFormData, color })}
                              ></button>
                            ))}
                          </div>
                          <input
                            type="color"
                            className="form-control form-control-color"
                            value={impactCardFormData.color}
                            onChange={(e) =>
                              setImpactCardFormData({ ...impactCardFormData, color: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="is_visible_impact"
                          checked={impactCardFormData.is_visible}
                          onChange={(e) =>
                            setImpactCardFormData({ ...impactCardFormData, is_visible: e.target.checked })
                          }
                        />
                        <label className="form-check-label" htmlFor="is_visible_impact">
                          Visible (shown on donations page)
                        </label>
                      </div>
                      {/* Preview */}
                      <div className="border rounded p-3 bg-light mt-3">
                        <h6 className="text-muted mb-3">Preview:</h6>
                        <div className="text-center">
                          <div
                            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                            style={{
                              width: '60px',
                              height: '60px',
                              backgroundColor: `${impactCardFormData.color}20`,
                            }}
                          >
                            <i
                              className={impactCardFormData.icon}
                              style={{ color: impactCardFormData.color, fontSize: '28px' }}
                            ></i>
                          </div>
                          <h2 className="mb-0" style={{ color: impactCardFormData.color }}>
                            {impactCardFormData.stat_value || '0'}
                          </h2>
                          <p className="text-muted mb-2">
                            {impactCardFormData.stat_label || 'Statistic Label'}
                          </p>
                          <h6>{impactCardFormData.title || 'Impact Title'}</h6>
                          {impactCardFormData.description && (
                            <p className="text-muted small mb-0">{impactCardFormData.description}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Content Sections Form */}
                  {activeTab === 'content' && (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Section Key *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={contentFormData.section_key}
                            onChange={(e) =>
                              setContentFormData({ ...contentFormData, section_key: e.target.value })
                            }
                            placeholder="e.g., hero, intro, cta"
                            required
                          />
                          <small className="text-muted">
                            Unique identifier for this section (lowercase, no spaces)
                          </small>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Display Order</label>
                          <input
                            type="number"
                            className="form-control"
                            value={contentFormData.display_order}
                            onChange={(e) =>
                              setContentFormData({
                                ...contentFormData,
                                display_order: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={contentFormData.title}
                          onChange={(e) =>
                            setContentFormData({ ...contentFormData, title: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subtitle</label>
                        <input
                          type="text"
                          className="form-control"
                          value={contentFormData.subtitle}
                          onChange={(e) =>
                            setContentFormData({ ...contentFormData, subtitle: e.target.value })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Content</label>
                        <textarea
                          className="form-control"
                          rows={5}
                          value={contentFormData.content}
                          onChange={(e) =>
                            setContentFormData({ ...contentFormData, content: e.target.value })
                          }
                          placeholder="Main content text (supports HTML)"
                        ></textarea>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="is_visible_content"
                          checked={contentFormData.is_visible}
                          onChange={(e) =>
                            setContentFormData({ ...contentFormData, is_visible: e.target.checked })
                          }
                        />
                        <label className="form-check-label" htmlFor="is_visible_content">
                          Visible (shown on donations page)
                        </label>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Update' : 'Create'}
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
