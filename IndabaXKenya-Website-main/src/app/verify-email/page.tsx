'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL VERIFICATION PAGE
// ═══════════════════════════════════════════════════════════════════════
// Handle email verification with clear UI feedback
// Phase 2: Authentication Extension - Custom Verification System

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Layouts/Navbar'
import PageBanner from '@/components/Common/PageBanner'
import Footer from '@/components/Layouts/Footer'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  // Issue #12 FIX: Show timeout message if verification takes too long
  const [verifyingToken, setVerifyingToken] = useState(false)
  const [longWait, setLongWait] = useState(false)
  const [verificationState, setVerificationState] = useState<{
    status: 'success' | 'error' | 'pending' | 'already_verified'
    title: string
    message: string
    icon: string
    iconColor: string
  }>({
    status: 'pending',
    title: 'Check Your Email',
    message: 'We sent a verification link to your email address. Please check your inbox and click the link to verify your account.',
    icon: 'icofont-email',
    iconColor: 'text-primary',
  })

  const email = searchParams.get('email')

  const handleResendEmail = async () => {
    if (!email || resending) return

    setResending(true)
    setResendMessage(null)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.data?.alreadyVerified) {
          setResendMessage({ type: 'success', text: 'Your email is already verified! You can login now.' })
        } else {
          setResendMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' })
        }
      } else {
        setResendMessage({ type: 'error', text: data.error?.message || 'Failed to send email. Please try again.' })
      }
    } catch (error) {
      setResendMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setResending(false)
    }
  }

  useEffect(() => {
    // CRITICAL: If user lands here with a token parameter (from old emails),
    // redirect them to the API route to process verification
    const token = searchParams.get('token')
    let longWaitTimer: ReturnType<typeof setTimeout> | null = null
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null

    if (token) {
      console.log('[VERIFY PAGE] Token detected, redirecting to API route...')
      setVerifyingToken(true)
      // Issue #12 FIX: Show "still working" message after 5 seconds
      longWaitTimer = setTimeout(() => setLongWait(true), 5000)
      // Issue #12 FIX: Show error after 30 seconds if page hasn't redirected
      timeoutTimer = setTimeout(() => {
        setVerifyingToken(false)
        setVerificationState({
          status: 'error',
          title: 'Verification Timeout',
          message: 'The verification is taking longer than expected. The process may still be completing in the background. Please check your email or try logging in.',
          icon: 'icofont-warning',
          iconColor: 'text-warning',
        })
      }, 30000)
      window.location.href = `/api/auth/verify-email?token=${token}`
    }

    // Check for status/error query parameters from verification API
    const status = searchParams.get('status')
    const error = searchParams.get('error')

    if (status === 'success') {
      setVerificationState({
        status: 'success',
        title: 'Email Verified Successfully!',
        message: 'Your email has been verified. You can now login and access all features.',
        icon: 'icofont-check-circled',
        iconColor: 'text-success',
      })
    } else if (status === 'already_verified') {
      setVerificationState({
        status: 'already_verified',
        title: 'Already Verified',
        message: 'This email has already been verified. You can proceed to login.',
        icon: 'icofont-info-circle',
        iconColor: 'text-info',
      })
    } else if (error === 'missing_token') {
      setVerificationState({
        status: 'error',
        title: 'Invalid Verification Link',
        message: 'The verification link is missing the required token. Please check your email and click the correct link.',
        icon: 'icofont-close-circled',
        iconColor: 'text-danger',
      })
    } else if (error === 'invalid_token') {
      setVerificationState({
        status: 'error',
        title: 'Invalid Token',
        message: 'The verification token is invalid or not found. Please check your email and try again.',
        icon: 'icofont-close-circled',
        iconColor: 'text-danger',
      })
    } else if (error === 'expired_token') {
      setVerificationState({
        status: 'error',
        title: 'Link Expired',
        message: 'This verification link has expired (24 hours). Please request a new verification email.',
        icon: 'icofont-clock-time',
        iconColor: 'text-warning',
      })
    } else if (error === 'verification_failed') {
      setVerificationState({
        status: 'error',
        title: 'Verification Failed',
        message: 'An error occurred while verifying your email. Please try again or contact support.',
        icon: 'icofont-close-circled',
        iconColor: 'text-danger',
      })
    } else if (error === 'server_error') {
      setVerificationState({
        status: 'error',
        title: 'Server Error',
        message: 'An unexpected error occurred. Please try again later or contact support.',
        icon: 'icofont-warning',
        iconColor: 'text-danger',
      })
    }

    // Issue #12 FIX: Proper cleanup for timers
    return () => {
      if (longWaitTimer) clearTimeout(longWaitTimer)
      if (timeoutTimer) clearTimeout(timeoutTimer)
    }
  }, [searchParams])

  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Email Verification"
        shortText="Verify your email address to activate your account"
        homePageUrl="/"
        homePageText="Home"
        activePageText="Verify Email"
        bgImg="/images/main-bg2.jpg"
      />

      <div className="registration-form-area ptb-120 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="registration-form-wrapper" data-aos="fade-up">
                <div className="card shadow-sm">
                  <div className="card-body p-5 text-center">
                    {/* Issue #12 FIX: Show loading state when verifying token */}
                    {verifyingToken && (
                      <div className="mb-4">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                          <span className="visually-hidden">Verifying...</span>
                        </div>
                        <h3 className="h4 mb-2">Verifying your email...</h3>
                        {longWait && (
                          <p className="text-muted">
                            Still working — this may take a moment. Please don&apos;t close this page.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status Icon - 100px */}
                    <div className="mb-4">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle bg-opacity-10"
                        style={{
                          width: '100px',
                          height: '100px',
                          backgroundColor:
                            verificationState.status === 'success' ? '#28a745' :
                            verificationState.status === 'already_verified' ? '#17a2b8' :
                            verificationState.status === 'error' ? '#dc3545' : '#007bff',
                        }}
                      >
                        <i
                          className={`${verificationState.icon} ${verificationState.iconColor}`}
                          style={{ fontSize: '60px' }}
                        ></i>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="h3 mb-4">{verificationState.title}</h2>

                    {/* Message */}
                    <p className="text-muted mb-4">{verificationState.message}</p>

                    {/* Email display */}
                    {email && verificationState.status === 'pending' && (
                      <div className="alert alert-secondary mb-4">
                        <strong>Email:</strong> {email}
                      </div>
                    )}

                    {/* Resend Message */}
                    {resendMessage && (
                      <div className={`alert alert-${resendMessage.type === 'success' ? 'success' : 'danger'} mb-4`}>
                        {resendMessage.text}
                      </div>
                    )}

                    {/* Additional Info for Pending Status */}
                    {verificationState.status === 'pending' && (
                      <div className="alert alert-info text-start mb-4" role="alert">
                        <strong>
                          <i className="icofont-info-circle"></i> Did not receive the email?
                        </strong>
                        <ul className="mb-0 mt-2">
                          <li>Check your spam/junk folder</li>
                          <li>Make sure you entered the correct email address</li>
                          <li>Wait a few minutes for the email to arrive</li>
                          <li>Contact support if the problem persists</li>
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="d-grid gap-3">
                      {(verificationState.status === 'success' || verificationState.status === 'already_verified') && (
                        <Link href="/login" className="btn btn-success btn-lg">
                          <i className="icofont-login"></i> Go to Login
                        </Link>
                      )}

                      {verificationState.status === 'error' && (
                        <>
                          {email && (
                            <button
                              onClick={handleResendEmail}
                              disabled={resending}
                              className="btn btn-warning btn-lg"
                            >
                              {resending ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <i className="icofont-refresh me-2"></i>
                                  Resend Verification Email
                                </>
                              )}
                            </button>
                          )}
                          <Link href="/register" className="btn btn-primary btn-lg">
                            <i className="icofont-user-alt-3"></i> Register Again
                          </Link>
                          <Link href="/contact" className="btn btn-outline-secondary btn-lg">
                            <i className="icofont-support"></i> Contact Support
                          </Link>
                        </>
                      )}

                      {verificationState.status === 'pending' && (
                        <>
                          {email && (
                            <button
                              onClick={handleResendEmail}
                              disabled={resending}
                              className="btn btn-warning btn-lg"
                            >
                              {resending ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <i className="icofont-refresh me-2"></i>
                                  Resend Verification Email
                                </>
                              )}
                            </button>
                          )}
                          <Link href="/login" className="btn btn-primary btn-lg">
                            <i className="icofont-login"></i> Go to Login
                          </Link>
                          <Link href="/contact" className="btn btn-outline-secondary btn-lg">
                            <i className="icofont-support"></i> Contact Support
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
