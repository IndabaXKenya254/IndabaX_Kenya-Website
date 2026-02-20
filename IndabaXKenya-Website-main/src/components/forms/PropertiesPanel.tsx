'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PROPERTIES PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Question configuration panel
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'
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

interface PropertiesPanelProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
  onClose: () => void
}

export function PropertiesPanel({ question, onUpdate, onClose }: PropertiesPanelProps) {
  // Issue #20: Display types that don't need "Required" option or standard fields
  const DISPLAY_TYPES = ['section_break', 'title_description', 'image', 'video']
  const isDisplayType = DISPLAY_TYPES.includes(question.type)

  // Render type-specific configuration component
  const renderTypeConfig = () => {
    switch (question.type) {
      case 'short_answer':
        return <ShortAnswer question={question} onUpdate={onUpdate} mode="builder" />
      case 'paragraph':
        return <Paragraph question={question} onUpdate={onUpdate} mode="builder" />
      case 'multiple_choice':
        return <MultipleChoice question={question} onUpdate={onUpdate} mode="builder" />
      case 'checkboxes':
        return <Checkboxes question={question} onUpdate={onUpdate} mode="builder" />
      case 'dropdown':
        return <Dropdown question={question} onUpdate={onUpdate} mode="builder" />
      case 'linear_scale':
        return <LinearScale question={question} onUpdate={onUpdate} mode="builder" />
      case 'multiple_choice_grid':
        return <MultipleChoiceGrid question={question} onUpdate={onUpdate} mode="builder" />
      case 'checkbox_grid':
        return <CheckboxGrid question={question} onUpdate={onUpdate} mode="builder" />
      case 'date':
        return <DateQuestion question={question} onUpdate={onUpdate} mode="builder" />
      case 'time':
        return <TimeQuestion question={question} onUpdate={onUpdate} mode="builder" />
      case 'file_upload':
        return <FileUpload question={question} onUpdate={onUpdate} mode="builder" />
      case 'title_description':
        return <TitleDescription question={question} onUpdate={onUpdate} mode="builder" />
      case 'image':
        return <ImageDisplay question={question} onUpdate={onUpdate} mode="builder" />
      case 'video':
        return <VideoDisplay question={question} onUpdate={onUpdate} mode="builder" />
      case 'section_break':
        return <SectionBreak question={question} onUpdate={onUpdate} mode="builder" />
      default:
        return (
          <div className="alert alert-warning">
            <small>
              <i className="icofont-warning me-1"></i>
              Unknown question type: {question.type}
            </small>
          </div>
        )
    }
  }

  return (
    <div className="properties-panel">
      <div className="properties-panel-header">
        <h6 className="mb-0">Question Settings</h6>
        <button
          className="btn btn-link text-muted p-0"
          onClick={onClose}
        >
          <i className="icofont-close"></i>
        </button>
      </div>

      <div className="properties-panel-body">
        {/* Basic Settings */}
        <div className="mb-3">
          <label className="form-label">
            {isDisplayType ? 'Title' : 'Question Title'}
          </label>
          <input
            type="text"
            className="form-control"
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={question.type === 'section_break' ? 'Section title...' : ''}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            {question.type === 'section_break' ? 'Section Description' : 'Description (optional)'}
          </label>
          <textarea
            className="form-control"
            rows={2}
            value={question.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder={question.type === 'section_break' ? 'Describe this section...' : ''}
          />
        </div>

        {/* Issue #20: Only show "Required" for answerable question types */}
        {!isDisplayType && (
          <div className="mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="isRequired"
                checked={question.is_required}
                onChange={(e) => onUpdate({ is_required: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="isRequired">
                Required Question
              </label>
            </div>
          </div>
        )}

        <hr />

        {/* Type-specific configuration */}
        <div className="mb-3">
          <h6 className="mb-3">
            {isDisplayType ? 'Display Options' : 'Question Configuration'}
          </h6>
          {renderTypeConfig()}
        </div>
      </div>
    </div>
  )
}
