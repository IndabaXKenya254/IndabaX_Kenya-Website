// ═══════════════════════════════════════════════════════════════════════
// NOAI FAQ ACCORDION
// ═══════════════════════════════════════════════════════════════════════
// Displays NOAI-specific FAQs from database

'use client';

import { useState, useEffect } from 'react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function NOAIFAQAccordion() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/faqs?classification=noai');
      const result = await response.json();
      
      if (result.success && result.data) {
        setFaqs(result.data);
      }
    } catch (error) {
      console.error('Error fetching NOAI FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="faq-area ptb-120">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading FAQs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="faq-area ptb-120">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="section-title" data-aos="fade-up">
                <span>NOAI FAQ</span>
                <h2>Frequently Asked <b>Questions</b></h2>
                <div className="bar"></div>
              </div>
              <div className="text-center" data-aos="fade-up">
                <div className="alert alert-info">
                  <i className="icofont-info-circle me-2"></i>
                  No FAQs available at the moment. Please check back later or <a href="/contact">contact us</a> with your questions.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categoryLabels: Record<string, string> = {
    general: 'General Information',
    registration: 'Registration & Application',
    accommodation: 'Accommodation',
    travel: 'Travel',
  };

  return (
    <div className="noai-faq-area ptb-120">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <span>NOAI FAQ</span>
          <h2>Frequently Asked <b>Questions</b></h2>
          <div className="bar"></div>
        </div>

        <div className="row">
          {/* Main Content */}
          <div className="col-lg-8 col-md-12">
            <div className="noai-faq-content" data-aos="fade-right">
              {Object.keys(groupedFaqs).map((category, categoryIndex) => (
                <div key={category} className="faq-category-section">
                  <div className="category-header">
                    <i className="icofont-question-circle"></i>
                    <h3>{categoryLabels[category] || category}</h3>
                  </div>

                  <div className="accordion noai-accordion" id={`faqAccordion-${category}`}>
                    {groupedFaqs[category].map((faq, index) => (
                      <div className="accordion-item" key={faq.id}>
                        <h4 className="accordion-header" id={`heading-${category}-${index}`}>
                          <button
                            className={`accordion-button ${activeId === faq.id ? '' : 'collapsed'}`}
                            type="button"
                            onClick={() => toggleAccordion(faq.id)}
                            aria-expanded={activeId === faq.id}
                          >
                            <i className="icofont-thin-right me-2"></i>
                            {faq.question}
                          </button>
                        </h4>
                        <div
                          id={`collapse-${category}-${index}`}
                          className={`accordion-collapse collapse ${activeId === faq.id ? 'show' : ''}`}
                          aria-labelledby={`heading-${category}-${index}`}
                        >
                          <div className="accordion-body" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="still-have-questions" data-aos="fade-up">
                <div className="question-card">
                  <i className="icofont-question-circle"></i>
                  <h4>Still have questions?</h4>
                  <p>Can&apos;t find the answer you&apos;re looking for? Feel free to reach out to our team.</p>
                  <a href="mailto:abigail@deeplearningindaba.com" className="btn btn-primary">
                    <i className="icofont-email me-2"></i>
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4 col-md-12">
            <div className="noai-faq-sidebar" data-aos="fade-left">
              {/* Quick Navigation */}
              <div className="sidebar-card">
                <h4><i className="icofont-navigation-menu me-2"></i>Quick Navigation</h4>
                <div className="category-list">
                  {Object.keys(groupedFaqs).map(category => (
                    <a
                      key={category}
                      href={`#faqAccordion-${category}`}
                      className="category-link"
                    >
                      <i className="icofont-rounded-right"></i>
                      {categoryLabels[category] || category}
                      <span className="count">{groupedFaqs[category].length}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="sidebar-card">
                <h4><i className="icofont-link me-2"></i>NOAI Resources</h4>
                <div className="d-grid gap-2">
                  <a href="/noai" className="btn btn-primary">
                    <i className="icofont-home me-2"></i>
                    NOAI Home
                  </a>
                  <a href="/noai/ioai" className="btn btn-primary">
                    <i className="icofont-trophy me-2"></i>
                    About IOAI
                  </a>
                  {/* Issue #40 FIX: Apply Now button removed per client request */}
                </div>
              </div>

              {/* Contact Card */}
              <div className="sidebar-card contact-card">
                <h4><i className="icofont-support me-2"></i>Need Help?</h4>
                <p>Have specific questions about your application or the competition?</p>
                <a href="mailto:abigail@deeplearningindaba.com" className="contact-link">
                  <i className="icofont-email"></i>
                  abigail@deeplearningindaba.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
