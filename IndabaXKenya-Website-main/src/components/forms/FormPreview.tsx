'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM PREVIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Preview how the form will look to respondents
// Phase 3: Form Builder
// Issue #22 FIX: Added multi-page navigation support
// Issue #25 FIX: Section breaks not numbered

import { useState, useMemo } from 'react'
import { Question, Template } from '@/hooks/useFormBuilder'
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

interface FormPreviewProps {
  template: Template
  questions: Question[]
  onClose: () => void
}

export function FormPreview({ template, questions, onClose }: FormPreviewProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [currentPage, setCurrentPage] = useState(0)

  // Issue #25 FIX: Display-only types that should NOT be numbered
  const DISPLAY_TYPES = ['section_break', 'title_description', 'image', 'video']

  // Issue #22 FIX: Split questions into pages based on section breaks with pageBreak
  // Section break with pageBreak appears at START of new page, not end of current page
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
    if (result[result.length - 1]?.length === 0) {
      result.pop()
    }

    return result
  }, [questions])

  const totalPages = pages.length
  const isMultiPage = totalPages > 1

  // Issue #25 FIX: Calculate question number excluding display elements
  const getQuestionNumber = (questionId: string): number | null => {
    const answerableQuestions = questions.filter(q => !DISPLAY_TYPES.includes(q.type))
    const questionIndex = answerableQuestions.findIndex(q => q.id === questionId)
    return questionIndex >= 0 ? questionIndex + 1 : null
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const renderQuestion = (question: Question) => {
    const value = responses[question.id]

    const commonProps = {
      question,
      value,
      onChange: (val: any) => handleResponseChange(question.id, val),
      mode: 'preview' as const,
    }

    switch (question.type) {
      case 'short_answer':
        return <ShortAnswer {...commonProps} />
      case 'paragraph':
        return <Paragraph {...commonProps} />
      case 'multiple_choice':
        return <MultipleChoice {...commonProps} />
      case 'checkboxes':
        return <Checkboxes {...commonProps} />
      case 'dropdown':
        return <Dropdown {...commonProps} />
      case 'linear_scale':
        return <LinearScale {...commonProps} />
      case 'multiple_choice_grid':
        return <MultipleChoiceGrid {...commonProps} />
      case 'checkbox_grid':
        return <CheckboxGrid {...commonProps} />
      case 'date':
        return <DateQuestion {...commonProps} />
      case 'time':
        return <TimeQuestion {...commonProps} />
      case 'file_upload':
        return <FileUpload {...commonProps} />
      case 'title_description':
        return <TitleDescription question={question} mode="preview" />
      case 'image':
        return <ImageDisplay question={question} mode="preview" />
      case 'video':
        return <VideoDisplay question={question} mode="preview" />
      case 'section_break':
        return <SectionBreak question={question} mode="preview" />
      default:
        return <div className="alert alert-warning">Unknown question type: {question.type}</div>
    }
  }

  return (
    <div className="form-preview-modal">
      <div className="form-preview-backdrop" onClick={onClose}></div>

      <div className="form-preview-container">
        {/* Header */}
        <div className="form-preview-header">
          <div>
            <h4 className="mb-1">Preview: {template.name}</h4>
            <small className="text-muted">This is how respondents will see your form</small>
          </div>
          <button className="btn btn-link text-dark p-0" onClick={onClose}>
            <i className="icofont-close" style={{ fontSize: '1.5rem' }}></i>
          </button>
        </div>

        {/* Preview Content */}
        <div className="form-preview-content">
          {/* Template Header */}
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="mb-3">{template.name}</h2>
              {template.description && (
                <p className="text-muted">{template.description}</p>
              )}
              <div className="d-flex gap-2 flex-wrap">
                <span className="badge bg-primary">{template.usage_type.replace(/_/g, ' ')}</span>
                {template.is_locked && (
                  <span className="badge bg-warning text-dark">
                    <i className="icofont-lock me-1"></i>
                    Locked
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Issue #22 FIX: Page indicator for multi-page forms */}
          {isMultiPage && (
            <div className="card mb-3 bg-light">
              <div className="card-body py-2 text-center">
                <strong>Page {currentPage + 1} of {totalPages}</strong>
              </div>
            </div>
          )}

          {/* Questions */}
          {questions.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="icofont-file-document" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                <p className="mt-3 text-muted mb-0">No questions added yet</p>
              </div>
            </div>
          ) : (
            // Issue #22 FIX: Show only current page questions
            (isMultiPage ? pages[currentPage] : questions).map((question) => {
              // Issue #25 FIX: Display types should not be in cards or numbered
              if (DISPLAY_TYPES.includes(question.type)) {
                return (
                  <div key={question.id} className="mb-4">
                    {renderQuestion(question)}
                  </div>
                )
              }

              // Issue #25 FIX: Get question number excluding display types
              const questionNumber = getQuestionNumber(question.id)

              // Input questions - with card wrapper and numbering
              return (
                <div key={question.id} className="card mb-3">
                  <div className="card-body">
                    {/* Question Title */}
                    <div className="mb-3">
                      <h6 className="mb-1">
                        {questionNumber}. {question.title}
                        {question.is_required && (
                          <span className="text-danger ms-1">*</span>
                        )}
                      </h6>
                      {question.description && (
                        <small className="text-muted">{question.description}</small>
                      )}
                    </div>

                    {/* Question Input */}
                    {renderQuestion(question)}

                    {/* Required Indicator */}
                    {question.is_required && (
                      <small className="text-muted d-block mt-2">
                        <span className="text-danger">*</span> This question is required
                      </small>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Issue #22 FIX: Navigation and Submit Buttons */}
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
                      onClick={handlePreviousPage}
                      disabled={currentPage === 0}
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
                        onClick={handleNextPage}
                      >
                        Next
                        <i className="icofont-rounded-right ms-2"></i>
                      </button>
                    ) : (
                      <button className="btn btn-success" disabled>
                        <i className="icofont-ui-check me-2"></i>
                        Submit Response
                      </button>
                    )}
                  </div>
                ) : (
                  // Single page: just submit button
                  <div className="text-center">
                    <button className="btn btn-primary btn-lg" disabled>
                      <i className="icofont-ui-check me-2"></i>
                      Submit Response
                    </button>
                  </div>
                )}
                <p className="text-muted small text-center mt-2 mb-0">
                  (Navigation and submit work in preview - responses not saved)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="form-preview-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            <i className="icofont-close-line me-2"></i>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
