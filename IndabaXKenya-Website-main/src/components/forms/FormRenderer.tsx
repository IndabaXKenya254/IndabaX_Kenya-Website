'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM RENDERER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Renders forms to end users (respondents)
// Phase 4: Registration Flow

import { useState, useEffect, useMemo } from 'react'
import { Question, Template } from '@/hooks/useFormBuilder'
import { useAutoSave, formatLastSaved } from '@/hooks/useAutoSave'
import { validatePhone } from '@/lib/validations/form-validation'
import {
  ShortAnswer,
  Paragraph,
  MultipleChoice,
  Checkboxes,
  Dropdown,
  LinearScale,
  MultipleChoiceGrid,
  CheckboxGrid,
  DateQuestion,
  TimeQuestion,
  FileUpload,
  TitleDescription,
  ImageDisplay,
  VideoDisplay,
  SectionBreak,
} from './question-types'

interface FormRendererProps {
  template: Template
  questions: Question[]
  initialResponses?: Record<string, any>
  onResponseChange?: (responses: Record<string, any>) => void
  onSubmit?: (responses: Record<string, any>) => void
  disabled?: boolean
  showProgress?: boolean
  submitButtonText?: string
  hideSubmitButton?: boolean
  // Auto-save options
  autoSave?: boolean
  autoSaveDelay?: number
  onAutoSave?: (responses: Record<string, any>) => Promise<void>
  // Issue #31: localStorage draft key (enables offline draft saving)
  draftKey?: string
}

export function FormRenderer({
  template,
  questions,
  initialResponses = {},
  onResponseChange,
  onSubmit,
  disabled = false,
  showProgress = true,
  submitButtonText = 'Submit',
  hideSubmitButton = false,
  autoSave = false,
  autoSaveDelay = 2000,
  onAutoSave,
  draftKey,
}: FormRendererProps) {
  // Issue #31 FIX: Restore draft from localStorage on mount
  const [responses, setResponses] = useState<Record<string, any>>(() => {
    if (draftKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`form-draft-${draftKey}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Merge: initialResponses as base, localStorage draft on top
          return { ...initialResponses, ...parsed }
        }
      } catch {
        // Corrupted draft, ignore
      }
    }
    return initialResponses
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [draftRestored, setDraftRestored] = useState(false)

  // Issue #31 FIX: Check if draft was restored from localStorage
  useEffect(() => {
    if (draftKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`form-draft-${draftKey}`)
      if (saved) setDraftRestored(true)
    }
  }, [draftKey])

  // Auto-save functionality
  const { isSaving, lastSaved, error: autoSaveError } = useAutoSave(responses, {
    delay: autoSaveDelay,
    enabled: autoSave && !!onAutoSave,
    onSave: onAutoSave,
    onError: (error) => {
      console.error('Auto-save error:', error)
    },
  })

  // Update parent when responses change
  useEffect(() => {
    onResponseChange?.(responses)
  }, [responses, onResponseChange])

  // Issue #22 FIX: Display-only types that should NOT be numbered
  const DISPLAY_TYPES = ['section_break', 'title_description', 'image', 'video']

  // Issue #22 FIX: Calculate question number excluding display elements
  const getQuestionNumber = (questionId: string): number | null => {
    const answerableQuestions = questions.filter(q => !DISPLAY_TYPES.includes(q.type))
    const questionIndex = answerableQuestions.findIndex(q => q.id === questionId)
    return questionIndex >= 0 ? questionIndex + 1 : null
  }

  // Split questions into pages based on section breaks with pageBreak
  // Issue #22 FIX: Section break with pageBreak appears at START of new page, not end of current page
  const pages = useMemo(() => {
    const result: Question[][] = [[]]
    let currentPageIndex = 0

    questions.forEach(question => {
      // If this is a section break with pageBreak=true, start new page BEFORE adding it
      // This ensures the section header appears at the beginning of the new page
      if (question.type === 'section_break' && question.config?.pageBreak === true) {
        // Only create new page if current page has questions
        if (result[currentPageIndex].length > 0) {
          currentPageIndex++
          result[currentPageIndex] = []
        }
      }

      // Add question to current page
      result[currentPageIndex].push(question)
    })

    // Remove empty last page if exists
    if (result[result.length - 1].length === 0) {
      result.pop()
    }

    return result
  }, [questions])

  const totalPages = pages.length
  const isMultiPage = totalPages > 1

  // Calculate progress
  const requiredQuestions = questions.filter(q => q.is_required)
  const answeredRequired = requiredQuestions.filter(q => {
    const response = responses[q.id]
    if (response === undefined || response === null || response === '') return false
    if (Array.isArray(response) && response.length === 0) return false
    return true
  })
  const progress = requiredQuestions.length > 0
    ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
    : 100

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => {
      const updated = { ...prev, [questionId]: value }

      // Issue #31 FIX: Save draft to localStorage immediately
      if (draftKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`form-draft-${draftKey}`, JSON.stringify(updated))
        } catch {
          // Storage full or unavailable, ignore
        }
      }

      return updated
    })

    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }

    // Clear draft-restored banner
    if (draftRestored) setDraftRestored(false)
  }

  // Issue #8 FIX: Return both validation result and errors for immediate access
  const validateResponses = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}

    questions.forEach(question => {
      if (question.is_required) {
        const response = responses[question.id]

        // Check if empty
        if (response === undefined || response === null || response === '') {
          errors[question.id] = 'This question is required'
        } else if (Array.isArray(response) && response.length === 0) {
          errors[question.id] = 'Please select at least one option'
        }
      }

      // Additional validation based on question type and validation_rules
      const response = responses[question.id]
      const validationRules = question.validation_rules || {}

      if (response && question.type === 'short_answer') {
        const config = question.config || {}
        const minLength = config.minLength || validationRules.minLength
        const maxLength = config.maxLength || validationRules.maxLength

        if (minLength && response.length < minLength) {
          errors[question.id] = `Answer must be at least ${minLength} characters`
        }
        if (maxLength && response.length > maxLength) {
          errors[question.id] = `Answer must not exceed ${maxLength} characters`
        }

        // Issue #8 FIX: Validate based on validationType
        const validationType = config.validationType

        if (validationType === 'email' && !errors[question.id]) {
          // Email validation regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(response)) {
            errors[question.id] = 'Please enter a valid email address'
          }
        }

        if (validationType === 'phone' && !errors[question.id]) {
          // Issue #14: Phone validation with country code requirement
          const phoneValidation = validatePhone(response, false, true)
          if (!phoneValidation.isValid) {
            errors[question.id] = phoneValidation.error || 'Phone must include country code (e.g., +254 for Kenya)'
          }
        }

        if (validationType === 'url' && !errors[question.id]) {
          // URL validation
          try {
            new URL(response)
          } catch {
            errors[question.id] = 'Please enter a valid URL (e.g., https://example.com)'
          }
        }

        if (validationType === 'number' && !errors[question.id]) {
          // Number validation
          if (!/^\d+$/.test(response)) {
            errors[question.id] = 'Please enter numbers only'
          }
        }
      }

      if (response && question.type === 'paragraph') {
        const config = question.config || {}
        const minLength = config.minLength || validationRules.minLength
        const maxLength = config.maxLength || validationRules.maxLength

        if (minLength && response.length < minLength) {
          errors[question.id] = `Answer must be at least ${minLength} characters`
        }
        if (maxLength && response.length > maxLength) {
          errors[question.id] = `Answer must not exceed ${maxLength} characters`
        }
      }

      // Issue #43 FIX: Validate grid questions — all rows must have a selection
      if (question.is_required && (question.type === 'multiple_choice_grid' || question.type === 'checkbox_grid')) {
        const gridConfig = question.config || {}
        const gridRows = gridConfig.rows || []
        const gridResponse = (response || {}) as Record<string, any>

        if (gridRows.length > 0) {
          const unansweredRows = gridRows.filter((row: string) => {
            const answer = gridResponse[row]
            if (answer === undefined || answer === null || answer === '') return true
            if (Array.isArray(answer) && answer.length === 0) return true
            return false
          })

          if (unansweredRows.length > 0) {
            errors[question.id] = `Please answer all rows (${unansweredRows.length} unanswered)`
          }
        }
      }
    })

    setValidationErrors(errors)
    // Issue #8 FIX: Return errors object so caller can access it immediately
    return { isValid: Object.keys(errors).length === 0, errors }
  }

  // Issue #8 FIX: validateCurrentPage now returns errors object for immediate access
  // Issue #26 FIX: Also validate email/phone/url/number types, not just required fields
  const validateCurrentPage = (): { isValid: boolean; errors: Record<string, string> } => {
    if (!isMultiPage) return validateResponses()

    const currentPageQuestions = pages[currentPage]
    const errors: Record<string, string> = {}

    currentPageQuestions.forEach(question => {
      const response = responses[question.id]

      // Check required fields
      if (question.is_required) {
        if (response === undefined || response === null || response === '') {
          errors[question.id] = 'This question is required'
        } else if (Array.isArray(response) && response.length === 0) {
          errors[question.id] = 'Please select at least one option'
        }
      }

      // Issue #26 FIX: Validate based on validationType (email, phone, url, number)
      // Only validate if there's a response (non-required fields can be empty)
      if (response && question.type === 'short_answer') {
        const config = question.config || {}
        const validationRules = question.validation_rules || {}
        const validationType = config.validationType

        // Length validations
        const minLength = config.minLength || validationRules.minLength
        const maxLength = config.maxLength || validationRules.maxLength

        if (minLength && response.length < minLength) {
          errors[question.id] = `Answer must be at least ${minLength} characters`
        }
        if (maxLength && response.length > maxLength) {
          errors[question.id] = `Answer must not exceed ${maxLength} characters`
        }

        // Email validation
        if (validationType === 'email' && !errors[question.id]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(response)) {
            errors[question.id] = 'Please enter a valid email address'
          }
        }

        // Phone validation
        if (validationType === 'phone' && !errors[question.id]) {
          const phoneRegex = /^[\d\s\-+()]{7,20}$/
          if (!phoneRegex.test(response)) {
            errors[question.id] = 'Please enter a valid phone number'
          }
        }

        // URL validation
        if (validationType === 'url' && !errors[question.id]) {
          try {
            new URL(response)
          } catch {
            errors[question.id] = 'Please enter a valid URL (e.g., https://example.com)'
          }
        }

        // Number validation
        if (validationType === 'number' && !errors[question.id]) {
          if (!/^\d+$/.test(response)) {
            errors[question.id] = 'Please enter numbers only'
          }
        }
      }

      // Paragraph length validation
      if (response && question.type === 'paragraph') {
        const config = question.config || {}
        const validationRules = question.validation_rules || {}
        const minLength = config.minLength || validationRules.minLength
        const maxLength = config.maxLength || validationRules.maxLength

        if (minLength && response.length < minLength) {
          errors[question.id] = `Answer must be at least ${minLength} characters`
        }
        if (maxLength && response.length > maxLength) {
          errors[question.id] = `Answer must not exceed ${maxLength} characters`
        }
      }

      // Issue #43 FIX: Validate grid questions — all rows must have a selection
      if (question.is_required && (question.type === 'multiple_choice_grid' || question.type === 'checkbox_grid')) {
        const gridConfig = question.config || {}
        const gridRows = gridConfig.rows || []
        const gridResponse = (response || {}) as Record<string, any>

        if (gridRows.length > 0) {
          const unansweredRows = gridRows.filter((row: string) => {
            const answer = gridResponse[row]
            if (answer === undefined || answer === null || answer === '') return true
            if (Array.isArray(answer) && answer.length === 0) return true
            return false
          })

          if (unansweredRows.length > 0) {
            errors[question.id] = `Please answer all rows (${unansweredRows.length} unanswered)`
          }
        }
      }
    })

    setValidationErrors(errors)
    return { isValid: Object.keys(errors).length === 0, errors }
  }

  // Issue #8 FIX: Scroll to first error using the errors returned by validation
  const scrollToFirstError = (errors: Record<string, string>) => {
    const firstErrorId = Object.keys(errors)[0]
    if (firstErrorId) {
      // Use setTimeout to ensure DOM has updated with error styles
      setTimeout(() => {
        const element = document.getElementById(`question-${firstErrorId}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }

  const handleNext = () => {
    const { isValid, errors } = validateCurrentPage()
    if (!isValid) {
      scrollToFirstError(errors)
      return
    }

    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (disabled || submitting) return

    // Issue #8 FIX: Use returned errors object for immediate access
    const { isValid, errors } = validateResponses()
    if (!isValid) {
      scrollToFirstError(errors)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit?.(responses)
      // Issue #31 FIX: Clear localStorage draft on successful submission
      if (draftKey && typeof window !== 'undefined') {
        localStorage.removeItem(`form-draft-${draftKey}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const value = responses[question.id]
    const error = validationErrors[question.id]

    const commonProps = {
      question,
      value,
      onChange: (val: any) => handleResponseChange(question.id, val),
      mode: 'response' as const,
    }

    // Non-input display elements (no question wrapper needed, no numbering)
    if (question.type === 'title_description') {
      return (
        <div key={question.id} className="mb-4">
          <TitleDescription question={question} mode="response" />
        </div>
      )
    }

    if (question.type === 'image') {
      return (
        <div key={question.id} className="mb-4">
          <ImageDisplay question={question} mode="response" />
        </div>
      )
    }

    if (question.type === 'video') {
      return (
        <div key={question.id} className="mb-4">
          <VideoDisplay question={question} mode="response" />
        </div>
      )
    }

    if (question.type === 'section_break') {
      return (
        <div key={question.id} className="mb-4">
          <SectionBreak question={question} mode="response" />
        </div>
      )
    }

    // Issue #22 FIX: Get question number excluding display types
    const questionNumber = getQuestionNumber(question.id)

    // Input questions - with card wrapper
    return (
      <div key={question.id} id={`question-${question.id}`} className="card mb-3">
        <div className="card-body">
          {/* Question Title */}
          <div className="mb-3">
            <h6 className="mb-1">
              {questionNumber}. {question.title}
              {question.is_required && <span className="text-danger ms-1">*</span>}
            </h6>
            {question.description && (
              <small className="text-muted">{question.description}</small>
            )}
          </div>

          {/* Question Input */}
          <div>
            {question.type === 'short_answer' && <ShortAnswer {...commonProps} />}
            {question.type === 'paragraph' && <Paragraph {...commonProps} />}
            {question.type === 'multiple_choice' && <MultipleChoice {...commonProps} />}
            {question.type === 'checkboxes' && <Checkboxes {...commonProps} />}
            {question.type === 'dropdown' && <Dropdown {...commonProps} />}
            {question.type === 'linear_scale' && <LinearScale {...commonProps} />}
            {question.type === 'multiple_choice_grid' && <MultipleChoiceGrid {...commonProps} />}
            {question.type === 'checkbox_grid' && <CheckboxGrid {...commonProps} />}
            {question.type === 'date' && <DateQuestion {...commonProps} />}
            {question.type === 'time' && <TimeQuestion {...commonProps} />}
            {question.type === 'file_upload' && <FileUpload {...commonProps} />}
          </div>

          {/* Validation Error */}
          {error && (
            <div className="alert alert-danger mt-2 mb-0 py-2">
              <small>
                <i className="icofont-warning me-1"></i>
                {error}
              </small>
            </div>
          )}

          {/* Required Indicator */}
          {question.is_required && !error && (
            <small className="text-muted d-block mt-2">
              <span className="text-danger">*</span> This question is required
            </small>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="form-renderer">
      {/* Template Header */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="mb-3">{template.name}</h2>
          {template.description && (
            <p className="text-muted mb-0">{template.description}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && requiredQuestions.length > 0 && (
        <div className="card mb-4">
          <div className="card-body py-3">
            {/* Page indicator for multi-page forms */}
            {isMultiPage && (
              <div className="text-center mb-3">
                <small className="text-muted">
                  <strong>Page {currentPage + 1} of {totalPages}</strong>
                </small>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">
                <strong>Progress:</strong> {answeredRequired.length} of {requiredQuestions.length} required questions
              </small>
              <small className="text-muted">
                <strong>{progress}%</strong>
              </small>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            {/* Auto-save indicator */}
            {autoSave && (
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className={`${autoSaveError ? 'text-danger' : 'text-muted'}`}>
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" style={{ width: '0.8rem', height: '0.8rem' }}></span>
                      Saving...
                    </>
                  ) : autoSaveError ? (
                    <>
                      <i className="icofont-warning me-1"></i>
                      Failed to save
                    </>
                  ) : (
                    <>
                      <i className="icofont-check me-1"></i>
                      Last saved {formatLastSaved(lastSaved)}
                    </>
                  )}
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue #31 FIX: Draft restored notice */}
      {draftRestored && (
        <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
          <i className="icofont-info-circle me-2"></i>
          <div className="flex-grow-1">
            <strong>Draft restored.</strong> Your previous answers have been loaded.
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-info ms-2"
            onClick={() => {
              setResponses(initialResponses)
              setDraftRestored(false)
              if (draftKey && typeof window !== 'undefined') {
                localStorage.removeItem(`form-draft-${draftKey}`)
              }
            }}
          >
            Discard Draft
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="icofont-file-document" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
            <p className="mt-3 text-muted mb-0">No questions in this form</p>
          </div>
        </div>
      ) : isMultiPage ? (
        // Multi-page: show only current page
        // Issue #22 FIX: No longer passing index - question numbering calculated internally
        pages[currentPage].map((question) => renderQuestion(question))
      ) : (
        // Single page: show all questions
        // Issue #22 FIX: No longer passing index - question numbering calculated internally
        questions.map((question) => renderQuestion(question))
      )}

      {/* Navigation and Submit */}
      {questions.length > 0 && (
        <div className="card">
          <div className="card-body">
            {isMultiPage ? (
              // Multi-page navigation
              <div className="d-flex justify-content-between align-items-center">
                {/* Previous Button */}
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handlePrevious}
                  disabled={currentPage === 0 || disabled}
                >
                  <i className="icofont-rounded-left me-2"></i>
                  Previous
                </button>

                {/* Page Indicator */}
                <span className="text-muted">
                  Page {currentPage + 1} of {totalPages}
                </span>

                {/* Next or Submit Button */}
                {currentPage < totalPages - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={disabled}
                  >
                    Next
                    <i className="icofont-rounded-right ms-2"></i>
                  </button>
                ) : !hideSubmitButton ? (
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={disabled || submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="icofont-ui-check me-2"></i>
                        {submitButtonText}
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            ) : (
              // Single page: just submit button
              !hideSubmitButton && (
                <div className="text-center">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={disabled || submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="icofont-ui-check me-2"></i>
                        {submitButtonText}
                      </>
                    )}
                  </button>
                </div>
              )
            )}

            {/* Validation Error Message */}
            {Object.keys(validationErrors).length > 0 && (
              <p className="text-danger small text-center mt-3 mb-0">
                <i className="icofont-warning me-1"></i>
                Please answer all required questions before {isMultiPage && currentPage < totalPages - 1 ? 'continuing' : 'submitting'}
              </p>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
