'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - DONATIONS CONTENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Issue #20: Displays admin-editable donations content
// Follows same pattern as SponsorsGrid - fetches from API routes
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface DonationsContentItem {
  id: string
  section_key: string
  title: string | null
  subtitle: string | null
  description: string | null
  button_text: string | null
  button_link: string | null
  image_url: string | null
  icon: string | null
  display_order: number
  is_visible: boolean
}

interface PaymentMethod {
  id: string
  name: string
  description: string | null
  icon: string | null
  payment_type: string
  payment_details: Record<string, any>
  instructions: string | null
  is_enabled: boolean
  display_order: number
}

interface WhyCard {
  id: string
  title: string
  description: string
  icon: string | null
  image_url: string | null
  display_order: number
  is_visible: boolean
}

interface ImpactCard {
  id: string
  title: string
  description: string | null
  image_url: string | null
  display_order: number
  is_visible: boolean
}

interface DonationsData {
  content: Record<string, DonationsContentItem>
  paymentMethods: PaymentMethod[]
  whyCards: WhyCard[]
  impactCards: ImpactCard[]
}

const DonationsContent: React.FC = () => {
  const [data, setData] = useState<DonationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDonationsData = async () => {
      try {
        setLoading(true)
        setError(null)

        const timestamp = Date.now()
        const response = await fetch(`/api/donations?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch donations data')
        }

        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          throw new Error(result.error || 'Failed to load donations data')
        }
      } catch (err) {
        console.error('Error fetching donations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load donations')
      } finally {
        setLoading(false)
      }
    }

    fetchDonationsData()
  }, [])

  const getPaymentIcon = (type: string): string => {
    const icons: Record<string, string> = {
      mpesa: 'icofont-phone',
      bank_transfer: 'icofont-bank-alt',
      paypal: 'icofont-paypal',
      stripe: 'icofont-credit-card',
      card: 'icofont-credit-card',
      other: 'icofont-money',
    }
    return icons[type] || 'icofont-money'
  }

  const renderPaymentDetails = (method: PaymentMethod) => {
    const details = method.payment_details

    switch (method.payment_type) {
      case 'mpesa':
        return (
          <div className="payment-details">
            {details.paybill && (
              <p><strong>Paybill Number:</strong> {details.paybill}</p>
            )}
            {details.account_name && (
              <p><strong>Account Name:</strong> {details.account_name}</p>
            )}
          </div>
        )
      case 'bank_transfer':
        return (
          <div className="payment-details">
            {details.bank_name && (
              <p><strong>Bank:</strong> {details.bank_name}</p>
            )}
            {details.account_name && (
              <p><strong>Account Name:</strong> {details.account_name}</p>
            )}
            {details.account_number && (
              <p><strong>Account Number:</strong> {details.account_number}</p>
            )}
            {details.branch && (
              <p><strong>Branch:</strong> {details.branch}</p>
            )}
            {details.swift_code && (
              <p><strong>SWIFT Code:</strong> {details.swift_code}</p>
            )}
          </div>
        )
      case 'paypal':
        return (
          <div className="payment-details">
            {details.paypal_link && (
              <a
                href={details.paypal_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-2"
              >
                <i className="icofont-paypal me-2"></i>
                Donate via PayPal
              </a>
            )}
          </div>
        )
      default:
        return null
    }
  }

  // Loading state
  if (loading) {
    return (
      <section className="donations-loading ptb-120">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading donations information...</p>
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className="donations-error ptb-120">
        <div className="container text-center">
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning me-2"></i> {error}
          </div>
        </div>
      </section>
    )
  }

  if (!data) return null

  const { content, paymentMethods, whyCards, impactCards } = data
  const whyIntro = content['why_support_intro']
  const impactIntro = content['impact_intro']
  const contactSection = content['contact']

  return (
    <>
      {/* Why Support Section */}
      {whyCards.length > 0 && (
        <section className="why-support-area ptb-120">
          <div className="container">
            {whyIntro && (
              <div className="section-title" data-aos="fade-up">
                {whyIntro.subtitle && (
                  <span>{whyIntro.subtitle}</span>
                )}
                <h2>{whyIntro.title || 'Why Support IndabaX Kenya'}</h2>
                <div className="bar"></div>
                {whyIntro.description && (
                  <p className="section-description">{whyIntro.description}</p>
                )}
              </div>
            )}

            <div className="row">
              {whyCards.map((card, index) => (
                <div
                  key={card.id}
                  className="col-lg-6 col-md-6 mb-4"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="donation-why-card">
                    {card.icon && (
                      <div className="icon-wrapper">
                        <i className={card.icon}></i>
                      </div>
                    )}
                    <div className="content">
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Where Support Goes Section */}
      {impactCards.length > 0 && (
        <section className="impact-area ptb-120">
          <div className="container">
            {impactIntro && (
              <div className="section-title" data-aos="fade-up">
                {impactIntro.subtitle && (
                  <span>{impactIntro.subtitle}</span>
                )}
                <h2>{impactIntro.title || 'Where Your Support Goes'}</h2>
                <div className="bar"></div>
                {impactIntro.description && (
                  <p className="section-description">{impactIntro.description}</p>
                )}
              </div>
            )}

            <div className="row justify-content-center">
              {impactCards.map((card, index) => (
                <div
                  key={card.id}
                  className="col-lg-3 col-md-6 mb-4"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="donation-impact-card">
                    <div className="number-badge">
                      {index + 1}
                    </div>
                    <h3>{card.title}</h3>
                    {card.description && (
                      <p>{card.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Payment Methods Section */}
      {paymentMethods.length > 0 && (
        <section id="payment-methods" className="payment-methods-area ptb-120">
          <div className="container">
            <div className="section-title" data-aos="fade-up">
              <span>Make a Donation</span>
              <h2>How to Support Us</h2>
              <div className="bar"></div>
              <p className="section-description">Choose your preferred payment method below</p>
            </div>

            <div className="row justify-content-center">
              {paymentMethods.map((method, index) => (
                <div
                  key={method.id}
                  className="col-lg-4 col-md-6 mb-4"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="payment-method-card">
                    <div className="card-header">
                      <div className="icon-wrapper">
                        <i className={method.icon || getPaymentIcon(method.payment_type)}></i>
                      </div>
                      <div className="header-text">
                        <h3>{method.name}</h3>
                        {method.description && (
                          <small>{method.description}</small>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      {renderPaymentDetails(method)}

                      {method.instructions && (
                        <div className="payment-instructions">
                          <h6>
                            <i className="icofont-info-circle"></i>
                            Instructions
                          </h6>
                          <p>
                            {method.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Payment Methods Message */}
      {paymentMethods.length === 0 && (
        <section className="no-payment-area ptb-120">
          <div className="container">
            <div className="no-results" data-aos="fade-up">
              <i className="icofont-warning"></i>
              <h3>Payment Methods Coming Soon</h3>
              <p>
                We are currently setting up our donation channels. Please check back soon or contact us directly.
              </p>
              <Link href="/contact" className="btn btn-primary">
                <i className="icofont-envelope me-2"></i>
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {contactSection && (
        <section className="donate-contact-area ptb-120">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center" data-aos="fade-up">
                <div className="section-title">
                  {contactSection.subtitle && (
                    <span>{contactSection.subtitle}</span>
                  )}
                  <h2>{contactSection.title || 'Get In Touch'}</h2>
                  <div className="bar"></div>
                </div>
                {contactSection.description && (
                  <p className="lead">{contactSection.description}</p>
                )}
                {contactSection.button_text && contactSection.button_link && (
                  <Link href={contactSection.button_link} className="btn btn-primary btn-lg">
                    <i className="icofont-email me-2"></i>
                    {contactSection.button_text}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default DonationsContent
