'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert } from '@/components/admin/ui'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError } from '@/lib/sweetalert'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface SettingsState {
  // Site Information
  site_name: string
  site_description: string
  site_keywords: string
  site_logo_url: string

  // General Settings
  registration_popup_enabled: boolean
  site_maintenance_mode: boolean

  // Event Settings
  event_registration_enabled: boolean
  event_registration_deadline: string
  current_event_year: string

  // Banner & Event Configuration
  banner_event_title: string
  banner_event_subtitle: string
  banner_event_location: string
  banner_event_date: string
  banner_event_end_date: string
  banner_show_countdown: boolean
  banner_show_video: boolean
  banner_video_url: string
  banner_registration_url: string
  banner_submit_paper_url: string

  // Popup Configuration
  popup_enabled: boolean
  popup_title: string
  popup_content: string
  popup_delay: number
  popup_button_text: string
  popup_button_link: string
  popup_highlights: string

  // Contact Information
  contact_email: string
  contact_phone: string
  contact_address: string

  // Social Media
  social_twitter: string
  social_linkedin: string
  social_facebook: string
  social_instagram: string
  social_youtube: string
  social_github: string

  // Newsletter
  newsletter_enabled: boolean
  newsletter_provider: string

  // Homepage Hero Section
  hero_title_line1: string
  hero_title_line2: string
  hero_stats: string
  hero_description: string
  hero_background_image: string

  // Homepage About Section
  about_subtitle: string
  about_title: string
  about_paragraphs: string
  about_image1: string
  about_image2: string
}

// Tab configuration
const TABS = [
  { id: 'general', label: 'General', icon: 'icofont-settings' },
  { id: 'event', label: 'Event & Banner', icon: 'icofont-calendar' },
  { id: 'homepage', label: 'Homepage', icon: 'icofont-home' },
  { id: 'popup', label: 'Popup', icon: 'icofont-megaphone' },
  { id: 'contact', label: 'Contact & Social', icon: 'icofont-phone' },
]

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showPopupPreview, setShowPopupPreview] = useState(false)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
  const [uploadingAboutImage1, setUploadingAboutImage1] = useState(false)
  const [uploadingAboutImage2, setUploadingAboutImage2] = useState(false)
  const [settings, setSettings] = useState<SettingsState>({
    // Site Information
    site_name: 'IndabaX Kenya',
    site_description: '',
    site_keywords: '',
    site_logo_url: '',

    // General Settings
    registration_popup_enabled: false,
    site_maintenance_mode: false,

    // Event Settings
    event_registration_enabled: true,
    event_registration_deadline: '',
    current_event_year: new Date().getFullYear().toString(),

    // Banner & Event Configuration
    banner_event_title: '',
    banner_event_subtitle: '',
    banner_event_location: '',
    banner_event_date: '',
    banner_event_end_date: '',
    banner_show_countdown: true,
    banner_show_video: true,
    banner_video_url: '',
    banner_registration_url: '/register',
    banner_submit_paper_url: '/submit',

    // Popup Configuration
    popup_enabled: true,
    popup_title: 'Register for IndabaX Kenya 2026',
    popup_content: '• Join 500+ AI enthusiasts<br>• Network with researchers<br>• Free workshops & talks',
    popup_delay: 3,
    popup_button_text: 'Register Now',
    popup_button_link: '/register',
    popup_highlights: '3 Days of AI Excellence\n50+ Expert Speakers\nFREE for Students Only\nLimited Seats Available',

    // Contact Information
    contact_email: '',
    contact_phone: '',
    contact_address: '',

    // Social Media
    social_twitter: '',
    social_linkedin: '',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    social_github: '',

    // Newsletter
    newsletter_enabled: true,
    newsletter_provider: 'mailchimp',

    // Homepage Hero Section
    hero_title_line1: "Building Africa's",
    hero_title_line2: 'AI & Machine Learning Community',
    hero_stats: '500+ AI Enthusiasts|East Africa\'s Premier AI Conference',
    hero_description: 'IndabaX Kenya is part of the global Deep Learning Indaba movement, dedicated to strengthening machine learning and artificial intelligence across Africa through world-class conferences, workshops, and community building.',
    hero_background_image: '/images/main-bg1.jpg',

    // Homepage About Section
    about_subtitle: 'About IndabaX Kenya',
    about_title: "Empowering Africa's AI Future",
    about_paragraphs: "IndabaX Kenya is East Africa's premier gathering for machine learning and artificial intelligence enthusiasts, researchers, and practitioners. As part of the global Deep Learning Indaba movement, we bring together Africa's brightest minds to advance AI research, education, and applications across the continent.\n\nSince our inception, IndabaX Kenya has grown into a vibrant community of over 500+ participants from 20+ countries. We host annual conferences featuring cutting-edge research presentations, hands-on workshops, keynote talks from world-renowned experts, and networking opportunities that foster collaboration and innovation in AI.\n\nOur mission is to strengthen machine learning and AI in Kenya and across Africa by creating inclusive spaces for learning, sharing knowledge, and building solutions that address local challenges using global best practices.",
    about_image1: '/images/about1.jpg',
    about_image2: '/images/about2.jpg',
  })

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const result = await adminApi.settings.list()
      if (result.success && result.data) {
        const data: any = result.data
        // Convert array of settings to object
        const settingsObj: any = {}
        if (Array.isArray(data)) {
          data.forEach((setting: any) => {
            // Handle JSONB values properly
            let value = setting.value
            if (typeof value === 'object' && value !== null) {
              // If it's a JSON object with a single value, extract it
              value = value.value !== undefined ? value.value : value
            }
            settingsObj[setting.key] = value
          })
        }

      // Parse boolean values correctly
      const parseBool = (val: any) => {
        if (typeof val === 'boolean') return val
        if (typeof val === 'string') return val === 'true'
        return false
      }

      // Parse banner settings (it's stored as a JSON object)
      let bannerData: any = {}
      if (settingsObj.banner) {
        try {
          const rawBanner = settingsObj.banner
          if (typeof rawBanner === 'string') {
            bannerData = JSON.parse(rawBanner)
          } else if (typeof rawBanner === 'object' && rawBanner !== null) {
            bannerData = rawBanner
          }
        } catch (e) {
          console.error('Failed to parse banner data:', e, settingsObj.banner)
          bannerData = {}
        }
      }

      // Parse popup settings (it's stored as a JSON object)
      let popupData: any = {}
      if (settingsObj.popup) {
        try {
          const rawPopup = settingsObj.popup
          if (typeof rawPopup === 'string') {
            popupData = JSON.parse(rawPopup)
          } else if (typeof rawPopup === 'object' && rawPopup !== null) {
            popupData = rawPopup
          }
        } catch (e) {
          console.error('Failed to parse popup data:', e, settingsObj.popup)
          popupData = {}
        }
      }

      setSettings({
        // Site Information
        site_name: settingsObj.site_name || 'IndabaX Kenya',
        site_description: settingsObj.site_description || '',
        site_keywords: settingsObj.site_keywords || '',
        site_logo_url: settingsObj.site_logo_url || '',

        // General Settings
        registration_popup_enabled: parseBool(settingsObj.registration_popup_enabled),
        site_maintenance_mode: parseBool(settingsObj.site_maintenance_mode),

        // Event Settings
        event_registration_enabled: parseBool(settingsObj.event_registration_enabled ?? true),
        event_registration_deadline: settingsObj.event_registration_deadline || '',
        current_event_year: settingsObj.current_event_year || new Date().getFullYear().toString(),

        // Banner & Event Configuration
        banner_event_title: String(bannerData?.eventTitle || ''),
        banner_event_subtitle: String(bannerData?.eventSubtitle || ''),
        banner_event_location: String(bannerData?.eventLocation || ''),
        banner_event_date: String(bannerData?.eventDate || ''),
        banner_event_end_date: String(bannerData?.eventEndDate || ''),
        banner_show_countdown: parseBool(bannerData?.showCountdown ?? true),
        banner_show_video: parseBool(bannerData?.showVideo ?? true),
        banner_video_url: String(bannerData?.videoUrl || ''),
        banner_registration_url: String(bannerData?.registrationUrl || '/register'),
        banner_submit_paper_url: String(bannerData?.submitPaperUrl || '/submit'),

        // Popup Configuration
        popup_enabled: parseBool(popupData?.enabled ?? true),
        popup_title: String(popupData?.title || 'Register for IndabaX Kenya 2026'),
        popup_content: String(popupData?.content || ''),
        popup_delay: Number(popupData?.delay) || 3,
        popup_button_text: String(popupData?.buttonText || 'Register Now'),
        popup_button_link: String(popupData?.buttonLink || '/register'),
        popup_highlights: Array.isArray(popupData?.highlights) && popupData.highlights.length > 0
          ? popupData.highlights.join('\n')
          : '3 Days of AI Excellence\n50+ Expert Speakers\nFREE for Students Only\nLimited Seats Available',

        // Contact Information
        contact_email: settingsObj.contact_email || '',
        contact_phone: settingsObj.contact_phone || '',
        contact_address: settingsObj.contact_address || '',

        // Social Media
        social_twitter: settingsObj.social_twitter || '',
        social_linkedin: settingsObj.social_linkedin || '',
        social_facebook: settingsObj.social_facebook || '',
        social_instagram: settingsObj.social_instagram || '',
        social_youtube: settingsObj.social_youtube || '',
        social_github: settingsObj.social_github || '',

        // Newsletter
        newsletter_enabled: parseBool(settingsObj.newsletter_enabled ?? true),
        newsletter_provider: settingsObj.newsletter_provider || 'mailchimp',

        // Homepage Hero Section
        hero_title_line1: settingsObj.hero_title_line1 || "Building Africa's",
        hero_title_line2: settingsObj.hero_title_line2 || 'AI & Machine Learning Community',
        hero_stats: settingsObj.hero_stats || '500+ AI Enthusiasts|East Africa\'s Premier AI Conference',
        hero_description: settingsObj.hero_description || 'IndabaX Kenya is part of the global Deep Learning Indaba movement, dedicated to strengthening machine learning and artificial intelligence across Africa through world-class conferences, workshops, and community building.',
        hero_background_image: settingsObj.hero_background_image || '/images/main-bg1.jpg',

        // Homepage About Section
        about_subtitle: settingsObj.about_subtitle || 'About IndabaX Kenya',
        about_title: settingsObj.about_title || "Empowering Africa's AI Future",
        about_paragraphs: settingsObj.about_paragraphs || "IndabaX Kenya is East Africa's premier gathering...",
        about_image1: settingsObj.about_image1 || '/images/about1.jpg',
        about_image2: settingsObj.about_image2 || '/images/about2.jpg',
      })

        // Set logo preview if logo URL exists
        if (settingsObj.site_logo_url) {
          setLogoPreview(settingsObj.site_logo_url)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showError('Load Error', 'Failed to load settings. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setAlert(null)

    try {
      // Validate email if provided
      if (settings.contact_email && !isValidEmail(settings.contact_email)) {
        setAlert({ type: 'danger', message: 'Invalid contact email address' })
        setSaving(false)
        return
      }

      // Separate banner and popup settings from other settings
      const {
        banner_event_title,
        banner_event_subtitle,
        banner_event_location,
        banner_event_date,
        banner_event_end_date,
        banner_show_countdown,
        banner_show_video,
        banner_video_url,
        banner_registration_url,
        banner_submit_paper_url,
        popup_enabled,
        popup_title,
        popup_content,
        popup_delay,
        popup_button_text,
        popup_button_link,
        popup_highlights,
        registration_popup_enabled, // Excluded - no longer used (popup.enabled controls public page)
        ...otherSettings
      } = settings

      // Create banner JSON object
      const bannerData = {
        eventTitle: banner_event_title || '',
        eventSubtitle: banner_event_subtitle || '',
        eventLocation: banner_event_location || '',
        eventDate: banner_event_date || '',
        eventEndDate: banner_event_end_date || '',
        showCountdown: Boolean(banner_show_countdown),
        showVideo: Boolean(banner_show_video),
        videoUrl: banner_video_url || '',
        registrationUrl: banner_registration_url || '/register',
        submitPaperUrl: banner_submit_paper_url || '/submit',
      }

      let bannerJson = ''
      try {
        bannerJson = JSON.stringify(bannerData)
      } catch (error) {
        console.error('Failed to stringify banner data:', error)
        showError('Save Failed', 'Failed to format banner settings')
        setSaving(false)
        return
      }

      // Create popup JSON object
      const popupData = {
        enabled: Boolean(popup_enabled),
        title: popup_title || 'Register for IndabaX Kenya 2026',
        content: popup_content || '',
        delay: Number(popup_delay) || 3,
        buttonText: popup_button_text || 'Register Now',
        buttonLink: popup_button_link || '/register',
        highlights: popup_highlights
          ? popup_highlights.split('\n').filter(h => h.trim())
          : []
      }

      let popupJson = ''
      try {
        popupJson = JSON.stringify(popupData)
      } catch (error) {
        console.error('Failed to stringify popup data:', error)
        showError('Save Failed', 'Failed to format popup settings')
        setSaving(false)
        return
      }

      const updates = [
        adminApi.settings.update('banner', { value: bannerJson }),
        adminApi.settings.update('popup', { value: popupJson }),
        ...Object.entries(otherSettings).map(([key, value]) =>
          adminApi.settings.update(key, { value })
        )
      ]

      const results = await Promise.all(updates)
      const allSuccessful = results.every((r) => r.success)

      if (allSuccessful) {
        showSuccess('Settings Saved!', 'All settings have been updated successfully')
        loadSettings() // Reload to confirm
      } else {
        showError('Save Failed', 'Failed to save some settings. Please try again.')
      }
    } catch (error) {
      showError('Error', 'An error occurred while saving settings')
    }
    setSaving(false)
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleChange = (e: any) => {
    if (!e || !e.target) {
      console.error('Invalid event object in handleChange:', e)
      return
    }
    const { name, value, type, checked } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showError('Invalid File Type', 'Please upload a PNG, JPEG, SVG, or WebP image')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showError('File Too Large', 'Logo must be less than 2MB')
      return
    }

    setUploadingLogo(true)
    try {
      const result = await adminApi.upload.siteLogo(file)

      if (result.success && result.data) {
        const logoUrl = result.data.url
        setSettings((prev) => ({ ...prev, site_logo_url: logoUrl }))
        setLogoPreview(logoUrl)
        showSuccess('Logo Uploaded!', 'Site logo has been uploaded successfully')
      } else {
        showError('Upload Failed', result.error || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      showError('Upload Error', 'An error occurred while uploading the logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleHomepageImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    imageType: 'hero_background_image' | 'about_image1' | 'about_image2'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showError('Invalid File Type', 'Please upload a PNG, JPEG, or WebP image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Image must be less than 5MB')
      return
    }

    // Set uploading state
    if (imageType === 'hero_background_image') setUploadingHeroImage(true)
    else if (imageType === 'about_image1') setUploadingAboutImage1(true)
    else if (imageType === 'about_image2') setUploadingAboutImage2(true)

    try {
      const result = await adminApi.upload.homepageImage(file)

      if (result.success && result.data) {
        const imageUrl = result.data.url
        setSettings((prev) => ({ ...prev, [imageType]: imageUrl }))
        showSuccess('Image Uploaded!', 'Homepage image has been uploaded successfully')
      } else {
        showError('Upload Failed', result.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Homepage image upload error:', error)
      showError('Upload Error', 'An error occurred while uploading the image')
    } finally {
      if (imageType === 'hero_background_image') setUploadingHeroImage(false)
      else if (imageType === 'about_image1') setUploadingAboutImage1(false)
      else if (imageType === 'about_image2') setUploadingAboutImage2(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading settings...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab()
      case 'event':
        return renderEventTab()
      case 'homepage':
        return renderHomepageTab()
      case 'popup':
        return renderPopupTab()
      case 'contact':
        return renderContactTab()
      default:
        return null
    }
  }

  // General Tab Content
  const renderGeneralTab = () => (
    <>
      {/* Site Information */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-info-circle me-2"></i>
            Site Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Site Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                name="site_name"
                value={settings.site_name}
                onChange={handleChange}
                placeholder="IndabaX Kenya"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">SEO Keywords</label>
              <input
                type="text"
                className="form-control"
                name="site_keywords"
                value={settings.site_keywords}
                onChange={handleChange}
                placeholder="AI, machine learning, IndabaX, Kenya"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Site Description</label>
            <textarea
              className="form-control"
              name="site_description"
              value={settings.site_description}
              onChange={handleChange}
              rows={2}
              placeholder="A premier conference on artificial intelligence..."
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Site Logo</label>
            {(logoPreview || settings.site_logo_url) && (
              <div className="mb-2 p-2 border rounded bg-light d-inline-block me-3">
                <img
                  src={logoPreview || settings.site_logo_url}
                  alt="Site Logo"
                  style={{ maxHeight: '60px', maxWidth: '150px', objectFit: 'contain' }}
                />
              </div>
            )}
            <div className="input-group" style={{ maxWidth: '400px' }}>
              <input
                type="file"
                className="form-control"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              {uploadingLogo && <span className="input-group-text"><span className="spinner-border spinner-border-sm"></span></span>}
            </div>
            <small className="text-muted">PNG, JPEG, SVG, or WebP (max 2MB)</small>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-settings me-2"></i>
            General Settings
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              {/* Popup toggle removed - Use the "Popup" tab to enable/disable the registration popup */}
            </div>
            <div className="col-md-6">
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="site_maintenance_mode"
                  name="site_maintenance_mode"
                  checked={settings.site_maintenance_mode}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="site_maintenance_mode">
                  <strong>Maintenance Mode</strong>
                  <div className="text-muted small">Site will be inaccessible</div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Settings */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-email me-2"></i>
            Newsletter
          </h5>
        </div>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="newsletter_enabled"
                  name="newsletter_enabled"
                  checked={settings.newsletter_enabled}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="newsletter_enabled">
                  <strong>Enable Newsletter</strong>
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                name="newsletter_provider"
                value={settings.newsletter_provider}
                onChange={handleChange}
              >
                <option value="mailchimp">Mailchimp</option>
                <option value="sendinblue">Sendinblue</option>
                <option value="convertkit">ConvertKit</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Event Tab Content
  const renderEventTab = () => (
    <>
      {/* Event Settings */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-calendar me-2"></i>
            Event Settings
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="event_registration_enabled"
                  name="event_registration_enabled"
                  checked={settings.event_registration_enabled}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="event_registration_enabled">
                  <strong>Enable Registration</strong>
                </label>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Registration Deadline</label>
              <input
                type="date"
                className="form-control"
                name="event_registration_deadline"
                value={settings.event_registration_deadline}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Current Event Year</label>
              <select
                className="form-select"
                name="current_event_year"
                value={settings.current_event_year}
                onChange={handleChange}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Configuration */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-ui-home me-2"></i>
            Banner Configuration
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Event Title</label>
              <input
                type="text"
                className="form-control"
                name="banner_event_title"
                value={settings.banner_event_title}
                onChange={handleChange}
                placeholder="IndabaX Kenya 2026"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Event Subtitle</label>
              <input
                type="text"
                className="form-control"
                name="banner_event_subtitle"
                value={settings.banner_event_subtitle}
                onChange={handleChange}
                placeholder="ML & AI Conference"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Event Location</label>
            <input
              type="text"
              className="form-control"
              name="banner_event_location"
              value={settings.banner_event_location}
              onChange={handleChange}
              placeholder="KICC, Nairobi, Kenya"
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                name="banner_event_date"
                value={settings.banner_event_date}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                name="banner_event_end_date"
                value={settings.banner_event_end_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="banner_show_countdown"
                  name="banner_show_countdown"
                  checked={settings.banner_show_countdown}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="banner_show_countdown">
                  Show Countdown Timer
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="banner_show_video"
                  name="banner_show_video"
                  checked={settings.banner_show_video}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="banner_show_video">
                  Show Banner Video
                </label>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">YouTube Video ID</label>
            <input
              type="text"
              className="form-control"
              name="banner_video_url"
              value={settings.banner_video_url}
              onChange={handleChange}
              placeholder="bk7McNUjWgw"
            />
            <small className="text-muted">Just the ID from the YouTube URL</small>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Registration URL</label>
              <input
                type="text"
                className="form-control"
                name="banner_registration_url"
                value={settings.banner_registration_url}
                onChange={handleChange}
                placeholder="/register"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Submit Paper URL</label>
              <input
                type="text"
                className="form-control"
                name="banner_submit_paper_url"
                value={settings.banner_submit_paper_url}
                onChange={handleChange}
                placeholder="/submit"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Homepage Tab Content
  const renderHomepageTab = () => (
    <>
      {/* Hero Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-flag me-2"></i>
            Hero Section
          </h5>
        </div>
        <div className="card-body">
          <div className="alert alert-info small mb-3">
            <i className="icofont-info-circle me-2"></i>
            The hero section is the main banner visitors see when they land on the homepage.
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Title Line 1</label>
              <input
                type="text"
                className="form-control"
                name="hero_title_line1"
                value={settings.hero_title_line1}
                onChange={handleChange}
                placeholder="Building Africa's"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Title Line 2 (highlighted)</label>
              <input
                type="text"
                className="form-control"
                name="hero_title_line2"
                value={settings.hero_title_line2}
                onChange={handleChange}
                placeholder="AI & Machine Learning Community"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Stats Line</label>
            <input
              type="text"
              className="form-control"
              name="hero_stats"
              value={settings.hero_stats}
              onChange={handleChange}
              placeholder="500+ AI Enthusiasts|East Africa's Premier AI Conference"
            />
            <small className="text-muted">Separate two stats with a pipe character ( | )</small>
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <div className="bg-white border rounded">
              <ReactQuill
                theme="snow"
                value={settings.hero_description}
                onChange={(value) => {
                  setSettings(prev => ({ ...prev, hero_description: value }))
                }}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
                placeholder="IndabaX Kenya is part of the global Deep Learning Indaba movement..."
              />
            </div>
            <small className="text-muted">Use the toolbar to format text, add lists, and links</small>
          </div>

          <div className="mb-3">
            <label className="form-label">Background Image</label>
            <div className="row align-items-center">
              <div className="col-md-3">
                {settings.hero_background_image && (
                  <div className="border rounded p-2 bg-light">
                    <img
                      src={settings.hero_background_image}
                      alt="Hero Background"
                      style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </div>
                )}
              </div>
              <div className="col-md-9">
                <div className="input-group">
                  <input
                    type="file"
                    className="form-control"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => handleHomepageImageUpload(e, 'hero_background_image')}
                    disabled={uploadingHeroImage}
                  />
                  {uploadingHeroImage && (
                    <span className="input-group-text">
                      <span className="spinner-border spinner-border-sm"></span>
                    </span>
                  )}
                </div>
                <small className="text-muted">Recommended: 1920x1080px, PNG/JPEG/WebP (max 5MB)</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-info-circle me-2"></i>
            About Section
          </h5>
        </div>
        <div className="card-body">
          <div className="alert alert-info small mb-3">
            <i className="icofont-info-circle me-2"></i>
            The about section appears below the hero banner on the homepage.
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Subtitle</label>
              <input
                type="text"
                className="form-control"
                name="about_subtitle"
                value={settings.about_subtitle}
                onChange={handleChange}
                placeholder="About IndabaX Kenya"
              />
            </div>
            <div className="col-md-8 mb-3">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                name="about_title"
                value={settings.about_title}
                onChange={handleChange}
                placeholder="Empowering Africa's AI Future"
              />
              <small className="text-muted">Use &lt;b&gt;text&lt;/b&gt; for bold in title</small>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Content</label>
            <div className="bg-white border rounded">
              <ReactQuill
                theme="snow"
                value={settings.about_paragraphs}
                onChange={(value) => {
                  setSettings(prev => ({ ...prev, about_paragraphs: value }))
                }}
                modules={{
                  toolbar: [
                    [{ 'header': [2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
                placeholder="Write about IndabaX Kenya..."
                style={{ minHeight: '200px' }}
              />
            </div>
            <small className="text-muted">Use the toolbar to format text with headings, lists, bold, italic, and links</small>
          </div>

          {/* About Section Images */}
          <div className="row mt-4">
            <div className="col-md-6 mb-3">
              <label className="form-label">Main Image (Large)</label>
              {settings.about_image1 && (
                <div className="border rounded p-2 bg-light mb-2">
                  <img
                    src={settings.about_image1}
                    alt="About Image 1"
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </div>
              )}
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleHomepageImageUpload(e, 'about_image1')}
                  disabled={uploadingAboutImage1}
                />
                {uploadingAboutImage1 && (
                  <span className="input-group-text">
                    <span className="spinner-border spinner-border-sm"></span>
                  </span>
                )}
              </div>
              <small className="text-muted">The larger background image</small>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Secondary Image (Overlay)</label>
              {settings.about_image2 && (
                <div className="border rounded p-2 bg-light mb-2">
                  <img
                    src={settings.about_image2}
                    alt="About Image 2"
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </div>
              )}
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleHomepageImageUpload(e, 'about_image2')}
                  disabled={uploadingAboutImage2}
                />
                {uploadingAboutImage2 && (
                  <span className="input-group-text">
                    <span className="spinner-border spinner-border-sm"></span>
                  </span>
                )}
              </div>
              <small className="text-muted">The smaller overlay image</small>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Popup Tab Content
  const renderPopupTab = () => (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="icofont-megaphone me-2"></i>
          Registration Popup
        </h5>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowPopupPreview(true)}
        >
          <i className="icofont-eye me-1"></i>
          Preview
        </button>
      </div>
      <div className="card-body">
        <div className="form-check form-switch mb-4">
          <input
            className="form-check-input"
            type="checkbox"
            id="popup_enabled"
            name="popup_enabled"
            checked={settings.popup_enabled}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="popup_enabled">
            <strong>Enable Registration Popup</strong>
            <span className="text-muted ms-2">Controls whether the popup appears on public pages. Changes reflect immediately.</span>
          </label>
        </div>

        <div className="row">
          <div className="col-md-8 mb-3">
            <label className="form-label">Popup Title</label>
            <input
              type="text"
              className="form-control"
              name="popup_title"
              value={settings.popup_title}
              onChange={handleChange}
              placeholder="Register for IndabaX Kenya 2026"
            />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Delay (seconds)</label>
            <input
              type="number"
              className="form-control"
              name="popup_delay"
              value={settings.popup_delay}
              onChange={handleChange}
              min="0"
              max="60"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Popup Content</label>
          <div className="bg-white border rounded">
            <ReactQuill
              theme="snow"
              value={settings.popup_content}
              onChange={(value) => {
                setSettings(prev => ({ ...prev, popup_content: value }))
              }}
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                ]
              }}
              placeholder="Join 500+ AI enthusiasts..."
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Button Text</label>
            <input
              type="text"
              className="form-control"
              name="popup_button_text"
              value={settings.popup_button_text}
              onChange={handleChange}
              placeholder="Register Now"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Button Link</label>
            <input
              type="text"
              className="form-control"
              name="popup_button_link"
              value={settings.popup_button_link}
              onChange={handleChange}
              placeholder="/register"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Highlights (one per line)</label>
          <textarea
            className="form-control"
            name="popup_highlights"
            value={settings.popup_highlights}
            onChange={handleChange}
            rows={4}
            placeholder="3 Days of AI Excellence&#10;50+ Expert Speakers&#10;FREE for Students"
          />
          <small className="text-muted">Each line appears as a checkmark item</small>
        </div>
      </div>
    </div>
  )

  // Contact Tab Content
  const renderContactTab = () => (
    <>
      {/* Contact Information */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-phone me-2"></i>
            Contact Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="contact_email"
                value={settings.contact_email}
                onChange={handleChange}
                placeholder="contact@deeplearningindabaxkenya.com"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                name="contact_phone"
                value={settings.contact_phone}
                onChange={handleChange}
                placeholder="+254 700 000 000"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              name="contact_address"
              value={settings.contact_address}
              onChange={handleChange}
              rows={2}
              placeholder="University of Nairobi, Kenya"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="icofont-share me-2"></i>
            Social Media Links
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <i className="icofont-twitter me-2"></i>Twitter/X
              </label>
              <input
                type="url"
                className="form-control"
                name="social_twitter"
                value={settings.social_twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/indabaxkenya"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <i className="icofont-linkedin me-2"></i>LinkedIn
              </label>
              <input
                type="url"
                className="form-control"
                name="social_linkedin"
                value={settings.social_linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/indabaxkenya"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <i className="icofont-facebook me-2"></i>Facebook
              </label>
              <input
                type="url"
                className="form-control"
                name="social_facebook"
                value={settings.social_facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/indabaxkenya"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <i className="icofont-instagram me-2"></i>Instagram
              </label>
              <input
                type="url"
                className="form-control"
                name="social_instagram"
                value={settings.social_instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/indabaxkenya"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <i className="icofont-youtube-play me-2"></i>YouTube
              </label>
              <input
                type="url"
                className="form-control"
                name="social_youtube"
                value={settings.social_youtube}
                onChange={handleChange}
                placeholder="https://youtube.com/@indabaxkenya"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <i className="icofont-github me-2"></i>GitHub
              </label>
              <input
                type="url"
                className="form-control"
                name="social_github"
                value={settings.social_github}
                onChange={handleChange}
                placeholder="https://github.com/indabaxkenya"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Site Settings</h2>
            <p className="text-muted mb-0">Configure site-wide settings and preferences</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="icofont-save me-2"></i>
                Save All Settings
              </>
            )}
          </button>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-4">
          {TABS.map(tab => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <i className={`${tab.icon} me-2`}></i>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>

        {/* Save Button at Bottom */}
        <div className="d-flex gap-2 mt-4 mb-4">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="icofont-save me-2"></i>
                Save All Settings
              </>
            )}
          </button>
          <button
            className="btn btn-outline-secondary btn-lg"
            onClick={loadSettings}
            disabled={saving || loading}
          >
            <i className="icofont-refresh me-2"></i>
            Reset
          </button>
        </div>
      </div>

      {/* Popup Preview Modal */}
      {showPopupPreview && (
        <div className="registration-popup-overlay" onClick={() => setShowPopupPreview(false)}>
          <div
            className="registration-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="popup-close-btn"
              onClick={() => setShowPopupPreview(false)}
              aria-label="Close preview"
            >
              <i className="icofont-close"></i>
            </button>

            <div className="popup-header">
              <div className="popup-icon">
                <i className="icofont-megaphone"></i>
              </div>
              <h2>{settings.popup_title || 'Register for IndabaX Kenya 2026'}</h2>
            </div>

            <div className="popup-body">
              <div dangerouslySetInnerHTML={{ __html: settings.popup_content }} />

              {settings.popup_highlights && settings.popup_highlights.trim() && (
                <ul className="popup-highlights">
                  {settings.popup_highlights.split('\n').filter(h => h.trim()).map((highlight, index) => (
                    <li key={index}>
                      <i className="icofont-check-circled"></i> {highlight}
                    </li>
                  ))}
                </ul>
              )}

              <div className="popup-actions">
                <button className="btn btn-primary btn-lg">
                  {settings.popup_button_text || 'Register Now'}
                  <i className="icofont-double-right"></i>
                </button>
              </div>

              <button className="dont-show-again">
                Don&apos;t show this again
              </button>

              <div className="alert alert-warning mt-3 small">
                <i className="icofont-info-circle me-2"></i>
                Preview only. Links to: <strong>{settings.popup_button_link}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
