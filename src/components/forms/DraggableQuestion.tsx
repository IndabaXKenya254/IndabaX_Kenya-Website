'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - DRAGGABLE QUESTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Individual question card with drag handle
// Phase 3: Form Builder

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Question, QuestionType } from '@/hooks/useFormBuilder'
import { showConfirmation } from '@/lib/sweetalert'

interface DraggableQuestionProps {
  question: Question
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

const questionTypeIcons: Record<QuestionType, string> = {
  short_answer: 'icofont-ui-text-loading',
  paragraph: 'icofont-paragraph',
  multiple_choice: 'icofont-radio',
  checkboxes: 'icofont-check-alt',
  dropdown: 'icofont-caret-down',
  linear_scale: 'icofont-chart-bar-graph',
  multiple_choice_grid: 'icofont-table',
  checkbox_grid: 'icofont-ui-check',
  date: 'icofont-calendar',
  time: 'icofont-clock-time',
  file_upload: 'icofont-upload-alt',
  title_description: 'icofont-text',
  image: 'icofont-image',
  video: 'icofont-play-alt-2',
  section_break: 'icofont-minus',
}

const questionTypeLabels: Record<QuestionType, string> = {
  short_answer: 'Short Answer',
  paragraph: 'Paragraph',
  multiple_choice: 'Multiple Choice',
  checkboxes: 'Checkboxes',
  dropdown: 'Dropdown',
  linear_scale: 'Linear Scale',
  multiple_choice_grid: 'Multiple Choice Grid',
  checkbox_grid: 'Checkbox Grid',
  date: 'Date',
  time: 'Time',
  file_upload: 'File Upload',
  title_description: 'Title & Description',
  image: 'Image',
  video: 'Video',
  section_break: 'Section Break',
}

export function DraggableQuestion({
  question,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: DraggableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-question ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(question.id)}
    >
      {/* Drag Handle */}
      <div className="question-drag-handle" {...attributes} {...listeners}>
        <i className="icofont-drag"></i>
      </div>

      {/* Question Content */}
      <div className="question-content">
        <div className="d-flex align-items-start">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className={questionTypeIcons[question.type]}></i>
              <small className="text-muted">{questionTypeLabels[question.type]}</small>
              {question.is_required && (
                <span className="badge bg-danger badge-sm">Required</span>
              )}
            </div>
            <h6 className="mb-1">{question.title || 'Untitled Question'}</h6>
            {question.description && (
              <p className="text-muted small mb-0">{question.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="question-actions">
        <button
          className="btn btn-sm btn-link text-muted"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate(question.id)
          }}
          title="Duplicate"
        >
          <i className="icofont-ui-copy"></i>
        </button>
        <button
          className="btn btn-sm btn-link text-danger"
          onClick={async (e) => {
            e.stopPropagation()
            // Issue #21 FIX: Use SweetAlert2 instead of native confirm() for reliability
            const confirmed = await showConfirmation(
              'Delete Question',
              'Are you sure you want to delete this question? This action cannot be undone.',
              'Delete',
              'Cancel'
            )
            if (confirmed) {
              onDelete(question.id)
            }
          }}
          title="Delete"
        >
          <i className="icofont-trash"></i>
        </button>
      </div>
    </div>
  )
}
