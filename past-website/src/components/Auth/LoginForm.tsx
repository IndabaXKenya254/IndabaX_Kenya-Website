// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - LOGIN FORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Unified login form for admin and regular users
// Phase 2: Authentication Extension
// Issue #2 FIX: Added redirect after login support for email button links

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSwal, showSuccess, showError, showLoading, closeAlert } from "@/lib/sweetalert";
import { useAuth } from "@/contexts/AuthContext";

const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login, checkSession } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Issue #2 FIX: Get redirect URL from query params (supports 'redirect', 'callbackUrl', and 'returnUrl' from middleware)
  const redirectUrl = searchParams.get('redirect') || searchParams.get('callbackUrl') || searchParams.get('returnUrl') || null;

  // Reset redirecting state if user becomes null (session expired/invalid)
  useEffect(() => {
    if (!user && isRedirecting) {
      console.log('User became null while redirecting, resetting state');
      setIsRedirecting(false);
    }
  }, [user, isRedirecting]);

  // Redirect if already logged in
  useEffect(() => {
    // Don't redirect if still loading auth state
    if (authLoading) return;

    // Don't redirect if no user or already redirecting
    if (!user || isRedirecting) return;

    setIsRedirecting(true);

    // Issue #2 FIX: Check for redirect URL first, then use role-based default
    let redirectTo: string;
    if (redirectUrl && redirectUrl.startsWith('/')) {
      redirectTo = redirectUrl;
    } else {
      // Role-based redirect mapping (same as API)
      const redirectMap: Record<string, string> = {
        'applicant': '/dashboard',
        'speaker': '/dashboard',
        'reviewer': '/reviewer/dashboard',
        'admin': '/admin/dashboard'
      };
      redirectTo = redirectMap[user.role] || '/dashboard';
    }

    console.log('Redirecting to:', redirectTo);

    // Use window.location directly for more reliable redirect
    window.location.href = redirectTo;
  }, [user, authLoading, isRedirecting, redirectUrl]);

  // Note: AuthContext already validates session on mount with loading=true
  // No need to call checkSession here - it would cause duplicate requests

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (!formData.email || !formData.password) {
      showError("Validation Error", "Please enter both email and password");
      return;
    }

    setIsSubmitting(true);
    showLoading("Signing in...");

    try {
      const result = await login(formData.email, formData.password);

      closeAlert();

      if (result.success) {
        await showSuccess("Login Successful!", "Welcome back!", 1500);

        // Issue #2 FIX: Check for redirect URL from query params first
        if (redirectUrl && redirectUrl.startsWith('/')) {
          router.push(redirectUrl);
        } else if (result.redirectTo) {
          // Fall back to role-based URL from API response
          router.push(result.redirectTo);
        }
      } else if (result.errorCode === 'EMAIL_NOT_VERIFIED') {
        // Special handling for unverified email - show resend option
        const verificationResent = result.verificationResent;
        const Swal = await getSwal();
        Swal.fire({
          icon: verificationResent ? 'info' : 'warning',
          title: 'Email Not Verified',
          html: verificationResent
            ? '<p>Your email is not yet verified.</p><p><strong>We\'ve just sent a new verification link to your inbox.</strong></p><p>Please check your email (including spam/junk folder) and click the verification link, then try logging in again.</p>'
            : '<p>Please verify your email address before logging in.</p><p>Check your inbox for the verification link.</p>',
          showCancelButton: !verificationResent,
          confirmButtonText: 'OK',
          cancelButtonText: 'Resend Verification Email',
          confirmButtonColor: '#e30045',
          cancelButtonColor: '#6c757d',
          reverseButtons: true,
        }).then(async (swalResult: any) => {
          if (swalResult.dismiss === Swal.DismissReason.cancel) {
            // User clicked "Resend Verification Email"
            try {
              showLoading("Sending verification email...");
              const resendResponse = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
              });
              const resendData = await resendResponse.json();
              closeAlert();

              if (resendData.success) {
                if (resendData.data?.alreadyVerified) {
                  await showSuccess("Already Verified!", "Your email is already verified. Please try logging in again.");
                } else {
                  (await getSwal()).fire({
                    icon: 'success',
                    title: 'Verification Email Sent!',
                    html: '<p>A new verification link has been sent to your email.</p><p>Please check your inbox (and spam/junk folder) and click the link to verify your account.</p>',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#e30045',
                  });
                }
              } else {
                showError("Error", resendData.error?.message || "Failed to send verification email. Please try again.");
              }
            } catch {
              closeAlert();
              showError("Network Error", "Unable to send verification email. Please try again.");
            }
          }
        });
      } else {
        showError(
          "Login Failed",
          result.error || "Invalid email or password. Please try again."
        );
      }
    } catch (error) {
      closeAlert();
      console.error("Login error:", error);
      showError(
        "Network Error",
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth or redirecting (only if user exists)
  if (authLoading || (user && isRedirecting)) {
    return (
      <div className="registration-form-area ptb-120">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="text-center">
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">
                  {authLoading ? 'Checking session...' : 'Redirecting to dashboard...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-form-area ptb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="section-title text-center" data-aos="fade-up">
              <span>Welcome Back</span>
              <h2>
                Sign In to Your <b>Account</b>
              </h2>
              <div className="bar"></div>
              <p className="section-description">
                Access your dashboard, register for events, and manage your profile
              </p>
            </div>

            <div className="registration-form-wrapper" data-aos="fade-up">
              <form onSubmit={handleSubmit} className="registration-form">
                {/* Login Credentials */}
                <div className="form-section">
                  <h3>Login Credentials</h3>
                  <div className="row">
                    <div className="col-md-12">
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
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="col-md-12">
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
                            autoComplete="current-password"
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
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="d-flex justify-content-between align-items-center">
                        <label className="checkbox-label mb-0">
                          <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                            disabled={isSubmitting}
                          />
                          <span>Remember me</span>
                        </label>
                        <Link href="/forgot-password" className="text-primary">
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="icofont-spinner icofont-spin"></i> Signing
                        In...
                      </>
                    ) : (
                      <>
                        <i className="icofont-login"></i> Sign In
                      </>
                    )}
                  </button>
                </div>

                {/* Signup Link */}
                <div className="text-center mt-4">
                  <p className="mb-0">
                    Do not have an account?{" "}
                    <Link href="/register" className="text-primary fw-semibold">
                      Create Account
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
