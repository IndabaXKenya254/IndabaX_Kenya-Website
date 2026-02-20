'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SURVEY COMPLETION PAGE (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════
// Thank you page after survey submission

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function SurveyCompletePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [surveyInfo, setSurveyInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch survey info to show event details
  useEffect(() => {
    fetchSurveyInfo()
  }, [token])

  const fetchSurveyInfo = async () => {
    try {
      const response = await fetch(`/api/survey/${token}`)
      const result = await response.json()

      if (result.success) {
        setSurveyInfo(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch survey info:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-lg">
              <div className="card-body text-center p-5">
                {/* Success Icon */}
                <div className="mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10" style={{ width: '100px', height: '100px' }}>
                    <i className="icofont-check-circled text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                </div>

                {/* Title */}
                <h2 className="mb-3">Survey Submitted Successfully!</h2>

                {/* Message */}
                <p className="text-muted mb-4">
                  Thank you for completing the survey. Your responses have been recorded.
                </p>

                {/* Event Info */}
                {!loading && surveyInfo?.event && (
                  <div className="alert alert-info d-flex align-items-start text-start mb-4">
                    <i className="icofont-calendar text-primary me-3" style={{ fontSize: '2rem' }}></i>
                    <div>
                      <h6 className="mb-1">{surveyInfo.event.title}</h6>
                      <small className="text-muted">
                        {surveyInfo.event.start_date && new Date(surveyInfo.event.start_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </small>
                    </div>
                  </div>
                )}

                {/* What's Next */}
                <div className="border-top pt-4 mt-4">
                  <h5 className="mb-3">What Happens Next?</h5>
                  <ul className="list-unstyled text-start mx-auto" style={{ maxWidth: '400px' }}>
                    <li className="mb-3 d-flex align-items-start">
                      <i className="icofont-check text-success me-2 mt-1"></i>
                      <span>Our team will review your responses</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <i className="icofont-check text-success me-2 mt-1"></i>
                      <span>We will notify you via email about your application status</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <i className="icofont-check text-success me-2 mt-1"></i>
                      <span>This typically takes 5-7 business days</span>
                    </li>
                  </ul>
                </div>

                {/* Contact Info */}
                <div className="alert alert-light border mt-4">
                  <small className="text-muted">
                    <i className="icofont-info-circle me-2"></i>
                    Questions? Contact us at <strong>applications@deeplearningindabaxkenya.com</strong>
                  </small>
                </div>

                {/* Actions */}
                <div className="mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push('/')}
                  >
                    <i className="icofont-home me-2"></i>
                    Back to Homepage
                  </button>
                </div>

                {/* Note */}
                <p className="text-muted small mt-4 mb-0">
                  <i className="icofont-lock me-1"></i>
                  You cannot resubmit this survey. Your responses have been saved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
