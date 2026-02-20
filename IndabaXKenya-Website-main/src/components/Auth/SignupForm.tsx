// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SIGNUP FORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// User account creation form matching the professional design style
// Phase 2: Authentication Extension

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showSuccess, showError, showLoading, closeAlert, showValidationError } from "@/lib/sweetalert";
import { validateEmail, validateName, validatePassword, validatePhone } from "@/lib/validations/form-validation";

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
];

const SignupForm: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    countryCode: "+254", // Default to Kenya
    phoneNumber: "", // Just the number part
    agreeToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Combine country code and phone number
  const getFullPhone = () => {
    if (!formData.phoneNumber) return "";
    return `${formData.countryCode}${formData.phoneNumber.replace(/^0+/, '')}`; // Remove leading zeros
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Issue #14: Real-time phone validation
    if (name === "phoneNumber") {
      if (value && value.trim()) {
        // Validate the full phone number with country code
        const fullPhone = `${formData.countryCode}${value.replace(/^0+/, '')}`;
        const phoneValidation = validatePhone(fullPhone, false, true);
        setPhoneError(phoneValidation.isValid ? null : "Please enter a valid phone number (digits only)");
      } else {
        setPhoneError(null); // Clear error if field is empty (optional field)
      }
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

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.push(passwordValidation.error!);
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    // Validate phone (optional but must be valid if provided)
    const fullPhone = getFullPhone();
    if (fullPhone) {
      const phoneValidation = validatePhone(fullPhone, false, true);
      if (!phoneValidation.isValid) {
        errors.push(phoneValidation.error!);
      }
    }

    // Terms and conditions
    if (!formData.agreeToTerms) {
      errors.push("You must agree to the terms and conditions");
    }

    if (errors.length > 0) {
      showValidationError(errors);
      return;
    }

    setIsSubmitting(true);
    showLoading("Creating your account...");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          organization: formData.organization || undefined,
          phone: getFullPhone() || undefined,
        }),
      });

      const data = await response.json();

      closeAlert();

      if (response.ok && data.success) {
        await showSuccess(
          "Account Created Successfully!",
          "Please check your email to verify your account before logging in.",
          3000
        );
        router.push("/verify-email?email=" + encodeURIComponent(formData.email));
      } else {
        showError(
          "Registration Failed",
          data.error?.message || "Failed to create account. Please try again."
        );
      }
    } catch (error) {
      closeAlert();
      console.error("Registration error:", error);
      showError(
        "Network Error",
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-form-area ptb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="section-title text-center" data-aos="fade-up">
              <span>Join Us</span>
              <h2>
                Create Your <b>Account</b>
              </h2>
              <div className="bar"></div>
              <p className="section-description">
                Sign up to register for events, submit papers, and connect with
                the IndabaX Kenya community.
              </p>
            </div>

            <div className="registration-form-wrapper" data-aos="fade-up">
              <form onSubmit={handleSubmit} className="registration-form">
                {/* Account Information */}
                <div className="form-section">
                  <h3>Account Information</h3>
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
                          placeholder="John Doe"
                          disabled={isSubmitting}
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
                          placeholder="john.doe@example.com"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="password">
                          Password <span className="required">*</span>
                        </label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            className="form-control"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isSubmitting}
                          >
                            <i
                              className={
                                showPassword
                                  ? "icofont-eye-blocked"
                                  : "icofont-eye"
                              }
                            ></i>
                          </button>
                        </div>
                        <small className="form-text text-muted">
                          Min 8 characters, including uppercase, number, and
                          special character
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="confirmPassword">
                          Confirm Password <span className="required">*</span>
                        </label>
                        <div className="password-input-wrapper">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            className="form-control"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={isSubmitting}
                          >
                            <i
                              className={
                                showConfirmPassword
                                  ? "icofont-eye-blocked"
                                  : "icofont-eye"
                              }
                            ></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Information */}
                <div className="form-section">
                  <h3>Additional Information (Optional)</h3>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="organization">
                          Organization/Institution
                        </label>
                        <input
                          type="text"
                          id="organization"
                          name="organization"
                          className="form-control"
                          value={formData.organization}
                          onChange={handleChange}
                          placeholder="University of Nairobi"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        {/* Issue #14: Country code dropdown + phone number input */}
                        <div style={{ display: 'flex', gap: '0' }}>
                          <select
                            name="countryCode"
                            className="form-control"
                            value={formData.countryCode}
                            onChange={handleChange}
                            disabled={isSubmitting}
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
                            id="phoneNumber"
                            name="phoneNumber"
                            className={`form-control ${phoneError ? 'is-invalid' : formData.phoneNumber && !phoneError ? 'is-valid' : ''}`}
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="712 345 678"
                            disabled={isSubmitting}
                            style={{
                              flex: '1',
                              borderTopLeftRadius: 0,
                              borderBottomLeftRadius: 0
                            }}
                          />
                        </div>
                        {/* Issue #14 FIX: Show validation error */}
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
                    </div>
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
                        disabled={isSubmitting}
                      />
                      <span>
                        I agree to the{" "}
                        <a href="/terms-conditions" target="_blank">
                          Terms & Conditions
                        </a>{" "}
                        and{" "}
                        <a href="/privacy-policy" target="_blank">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting || !formData.agreeToTerms}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="icofont-spinner icofont-spin"></i>{" "}
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="icofont-user-alt-4"></i> Create Account
                      </>
                    )}
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center mt-4">
                  <p className="mb-0">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary fw-semibold">
                      Sign In
                    </Link>
                  </p>
                </div>

                {/* Event Registration Info */}
                <div className="alert alert-info mt-4" role="alert">
                  <strong>Note:</strong> After creating your account and verifying your email,
                  you can register for events from your dashboard or the events page.
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
