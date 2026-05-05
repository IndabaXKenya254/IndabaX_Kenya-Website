'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════
// View and edit user profile information

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { validatePhone } from '@/lib/validations/form-validation'

// Issue #14: Country codes for phone number dropdown
const COUNTRY_CODES = [
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+237", country: "Cameroon", flag: "🇨🇲" },
  { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+211", country: "South Sudan", flag: "🇸🇸" },
  { code: "+249", country: "Sudan", flag: "🇸🇩" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+86", country: "China", flag: "🇨🇳" },
]

// Helper to parse existing phone number into country code and number
const parsePhoneNumber = (phone: string | null): { countryCode: string; phoneNumber: string } => {
  if (!phone) return { countryCode: '+254', phoneNumber: '' }

  // Try to match country code from our list
  for (const country of COUNTRY_CODES) {
    if (phone.startsWith(country.code)) {
      return {
        countryCode: country.code,
        phoneNumber: phone.slice(country.code.length).trim()
      }
    }
  }

  // Default to Kenya if no match
  return { countryCode: '+254', phoneNumber: phone.replace(/^\+?\d{1,3}/, '').trim() }
}

interface UserProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  organization: string | null
  bio: string | null
  linkedin_url: string | null
  twitter_url: string | null
  github_url: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Issue #5 FIX: Added all profile fields
  // Issue #14: Split phone into countryCode and phoneNumber
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+254',
    phoneNumber: '',
    organization: '',
    bio: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    website_url: '',
  })

  // Helper to combine country code and phone number
  const getFullPhone = () => {
    if (!formData.phoneNumber) return ''
    return `${formData.countryCode}${formData.phoneNumber.replace(/^0+/, '')}`
  }

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const result = await response.json()

      if (result.success && result.data) {
        setProfile(result.data)
        // Issue #5 FIX: Populate all profile fields
        // Issue #14: Parse phone into country code and number
        const { countryCode, phoneNumber } = parsePhoneNumber(result.data.phone)
        setFormData({
          name: result.data.name || '',
          countryCode,
          phoneNumber,
          organization: result.data.organization || '',
          bio: result.data.bio || '',
          linkedin_url: result.data.linkedin_url || '',
          twitter_url: result.data.twitter_url || '',
          github_url: result.data.github_url || '',
          website_url: result.data.website_url || '',
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Issue #14: Real-time phone validation
    if (name === 'phoneNumber') {
      if (value && value.trim()) {
        // Only allow digits
        if (!/^\d*$/.test(value.replace(/\s/g, ''))) {
          setPhoneError('Please enter digits only')
        } else if (value.replace(/\s/g, '').length < 9) {
          setPhoneError('Phone number must be at least 9 digits')
        } else {
          setPhoneError(null)
        }
      } else {
        setPhoneError(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate phone before submitting
    const fullPhone = getFullPhone()
    if (fullPhone) {
      const phoneValidation = validatePhone(fullPhone, false, true)
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error || 'Invalid phone number')
        return
      }
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Issue #14: Combine country code and phone number for submission
      const submitData = {
        name: formData.name,
        phone: fullPhone || null,
        organization: formData.organization,
        bio: formData.bio,
        linkedin_url: formData.linkedin_url,
        twitter_url: formData.twitter_url,
        github_url: formData.github_url,
        website_url: formData.website_url,
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Profile updated successfully!')
        setProfile(result.data)
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(result.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={['applicant', 'speaker', 'reviewer']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-2">My Profile</h2>
            <p className="text-muted">
              Manage your personal information and social links
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="icofont-warning me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="icofont-check-circled me-2"></i>
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Profile Form */}
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* Basic Information */}
                  <h5 className="mb-3">Basic Information</h5>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address <span className="text-muted">(cannot be changed)</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={profile?.email || ''}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">
                      Phone Number
                    </label>
                    {/* Issue #14: Country code dropdown + phone number input */}
                    <div style={{ display: 'flex', gap: '0' }}>
                      <select
                        name="countryCode"
                        className="form-control"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        style={{
                          width: '120px',
                          flex: '0 0 120px',
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          borderRight: 'none'
                        }}
                      >
                        {COUNTRY_CODES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        className={`form-control ${phoneError ? 'is-invalid' : formData.phoneNumber && !phoneError ? 'is-valid' : ''}`}
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="712 345 678"
                        style={{
                          flex: '1',
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0
                        }}
                      />
                    </div>
                    {/* Issue #14: Show validation error */}
                    {phoneError && (
                      <small className="text-danger d-block mt-1">
                        <i className="icofont-warning me-1"></i>
                        {phoneError}
                      </small>
                    )}
                    <small className="form-text text-muted">
                      Select country code, then enter number without leading zero
                    </small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="organization" className="form-label">
                      Institution / Organization
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder="University, Company, or Organization"
                    />
                  </div>

                  {/* Issue #5 FIX: Added bio field */}
                  <div className="mb-4">
                    <label htmlFor="bio" className="form-label">
                      Bio
                    </label>
                    <textarea
                      className="form-control"
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Tell us a bit about yourself..."
                    />
                    <small className="form-text text-muted">
                      A brief description about yourself (max 500 characters)
                    </small>
                  </div>

                  {/* Issue #5 FIX: Added social links section */}
                  <h5 className="mb-3 mt-4">Social Links</h5>

                  <div className="mb-3">
                    <label htmlFor="linkedin_url" className="form-label">
                      <i className="icofont-linkedin me-2 text-primary"></i>
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="linkedin_url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/your-profile"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="twitter_url" className="form-label">
                      <i className="icofont-twitter me-2 text-info"></i>
                      Twitter / X
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="twitter_url"
                      name="twitter_url"
                      value={formData.twitter_url}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/your-handle"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="github_url" className="form-label">
                      <i className="icofont-github me-2"></i>
                      GitHub
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="github_url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleInputChange}
                      placeholder="https://github.com/your-username"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="website_url" className="form-label">
                      <i className="icofont-web me-2 text-success"></i>
                      Personal Website
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="website_url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleInputChange}
                      placeholder="https://your-website.com"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="icofont-save me-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={fetchProfile}
                      disabled={saving}
                    >
                      <i className="icofont-refresh me-2"></i>
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Profile Summary Sidebar */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Profile Summary</h5>
                <div className="text-center mb-3">
                  <div
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center"
                    style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}
                  >
                    {formData.name ? formData.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
                <h6 className="text-center mb-1">{formData.name || 'No name set'}</h6>
                <p className="text-center text-muted small mb-3">{profile?.email}</p>

                <hr />

                <div className="mb-2">
                  <strong className="small">Institution:</strong>
                  <p className="mb-0 small text-muted">{formData.organization || 'Not specified'}</p>
                </div>

                <div className="mb-2">
                  <strong className="small">Phone:</strong>
                  <p className="mb-0 small text-muted">{getFullPhone() || 'Not specified'}</p>
                </div>

                <div className="mb-2">
                  <strong className="small">Member Since:</strong>
                  <p className="mb-0 small text-muted">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>

                {profile?.updated_at && (
                  <div className="mb-2">
                    <strong className="small">Last Updated:</strong>
                    <p className="mb-0 small text-muted">
                      {new Date(profile.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Issue #5 FIX: Display social links in sidebar */}
                {(formData.linkedin_url || formData.twitter_url || formData.github_url || formData.website_url) && (
                  <>
                    <hr />
                    <strong className="small">Social Links:</strong>
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {formData.linkedin_url && (
                        <a
                          href={formData.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                          title="LinkedIn"
                        >
                          <i className="icofont-linkedin"></i>
                        </a>
                      )}
                      {formData.twitter_url && (
                        <a
                          href={formData.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-info"
                          title="Twitter"
                        >
                          <i className="icofont-twitter"></i>
                        </a>
                      )}
                      {formData.github_url && (
                        <a
                          href={formData.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-dark"
                          title="GitHub"
                        >
                          <i className="icofont-github"></i>
                        </a>
                      )}
                      {formData.website_url && (
                        <a
                          href={formData.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-success"
                          title="Website"
                        >
                          <i className="icofont-web"></i>
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
