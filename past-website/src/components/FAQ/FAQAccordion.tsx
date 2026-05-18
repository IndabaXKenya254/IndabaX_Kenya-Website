// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FAQ ACCORDION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Frequently Asked Questions with category filters and accordion
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { FAQ, ApiSuccessResponse } from "@/types/api";

const FAQAccordion: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openFAQId, setOpenFAQId] = useState<string | null>(null);

  // Fetch FAQs from API
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/faqs');

        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }

        const result: ApiSuccessResponse<FAQ[]> = await response.json();
        setFaqs(result.data);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load FAQs');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  // Extract unique categories
  const allCategories = useMemo(() => {
    const categories = Array.from(new Set((faqs || []).map((f) => f.category).filter((c): c is NonNullable<typeof c> => c !== null))).sort();
    return ["All", ...categories];
  }, [faqs]);

  // Filter FAQs
  const filteredFAQs = useMemo(() => {
    return (faqs || []).filter((faq) => {
      const matchesCategory =
        selectedCategory === "All" || faq.category === selectedCategory;

      const matchesSearch =
        searchQuery === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  // Group FAQs by category for display
  const groupedFAQs = useMemo(() => {
    const groups: { [key: string]: FAQ[] } = {};

    (filteredFAQs || []).forEach((faq) => {
      const categoryKey = faq.category || 'general';
      if (!groups[categoryKey]) {
        groups[categoryKey] = [];
      }
      groups[categoryKey].push(faq);
    });

    return groups;
  }, [filteredFAQs]);

  const toggleFAQ = (id: string) => {
    setOpenFAQId(openFAQId === id ? null : id);
  };

  return (
    <div className="faq-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Got Questions?</span>
          <h2>
            Frequently Asked <b>Questions</b>
          </h2>
          <div className="bar"></div>
          </div>

        {/* Filters */}
        <div className="faq-filters" data-aos="fade-up">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-12">
              <div className="filter-group">
                <label htmlFor="search">
                  <i className="icofont-search-1"></i> Search Questions
                </label>
                <input
                  type="text"
                  id="search"
                  className="form-control"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-6 col-md-12">
              <div className="filter-group">
                <label htmlFor="category">
                  <i className="icofont-folder"></i> Category
                </label>
                <select
                  id="category"
                  className="form-control"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {allCategories.map((category) => (
                    <option key={category} value={category}>
                      {category === "All" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="filter-results">
            <p>
              Showing <strong>{filteredFAQs?.length || 0}</strong> of{" "}
              <strong>{faqs?.length || 0}</strong> questions
            </p>
            {(selectedCategory !== "All" || searchQuery !== "") && (
              <button
                className="btn btn-text"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
              >
                <i className="icofont-close-circled"></i> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5" data-aos="fade-up">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading FAQs...</span>
            </div>
            <p className="mt-3">Loading FAQs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning"></i> {error}
          </div>
        )}

        {/* FAQ Accordion */}
        {!loading && !error && filteredFAQs && filteredFAQs.length > 0 ? (
          <div className="faq-accordion-area">
            {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
              <div key={category} className="faq-category-group">
                <h3 className="category-title">
                  <i className="icofont-folder-open"></i> {category}
                </h3>
                <div className="faq-list">
                  {(categoryFAQs || []).map((faq, index) => (
                    <div
                      key={faq.id}
                      className={`faq-item ${openFAQId === faq.id ? "active" : ""}`}
                    >
                      <button
                        className="faq-question"
                        onClick={() => toggleFAQ(faq.id)}
                        aria-expanded={openFAQId === faq.id}
                      >
                        <span className="question-text">
                          <i className="icofont-ui-messaging"></i>
                          {faq.question}
                        </span>
                        <span className="toggle-icon">
                          <i
                            className={`icofont-${openFAQId === faq.id ? "minus" : "plus"}`}
                          ></i>
                        </span>
                      </button>
                      <div
                        className={`faq-answer ${openFAQId === faq.id ? "open" : ""}`}
                      >
                        <div
                          className="answer-content"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="no-results" data-aos="fade-up">
            <i className="icofont-question-circle"></i>
            <h3>No questions found</h3>
            <p>Try adjusting your filters or search query.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : null}

        {/* Contact CTA */}
        <div className="faq-contact-cta" data-aos="fade-up">
          <div className="cta-content">
            <i className="icofont-envelope"></i>
            <h3>Still have questions?</h3>
            <p>
              Can&apos;t find the answer you&apos;re looking for? Our team is here to help!
            </p>
            <a href="mailto:info@deeplearningindabaxkenya.com" className="btn btn-primary">
              <i className="icofont-email"></i> Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQAccordion;
