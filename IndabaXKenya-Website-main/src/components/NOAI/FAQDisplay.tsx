// ═══════════════════════════════════════════════════════════════════════
// FAQ Display - Client Component for accordion interactivity
// ═══════════════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  display_order: number
}

interface Props {
  faqs: FAQ[]
}

export default function FAQDisplay({ faqs }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0) // First item open by default

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  if (faqs.length === 0) {
    return null
  }

  return (
    <>
      <div className="section-title" data-aos="fade-up">
        <span>Got Questions?</span>
        <h2>Frequently Asked <b>Questions</b></h2>
        <div className="bar"></div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="accordion" id="noaiFAQAccordion" data-aos="fade-up" data-aos-delay="100">
            {faqs.map((faq, index) => (
              <div key={faq.id} className="accordion-item mb-3">
                <h2 className="accordion-header" id={`heading${index}`}>
                  <button
                    className={`accordion-button ${activeIndex === index ? '' : 'collapsed'}`}
                    type="button"
                    onClick={() => toggleAccordion(index)}
                    aria-expanded={activeIndex === index}
                    aria-controls={`collapse${index}`}
                  >
                    {faq.question}
                  </button>
                </h2>
                <div
                  id={`collapse${index}`}
                  className={`accordion-collapse collapse ${activeIndex === index ? 'show' : ''}`}
                  aria-labelledby={`heading${index}`}
                  data-bs-parent="#noaiFAQAccordion"
                >
                  <div className="accordion-body" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
