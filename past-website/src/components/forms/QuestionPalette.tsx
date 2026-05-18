'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - QUESTION PALETTE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Draggable palette of 15 question types
// Phase 3: Form Builder

import { useDraggable } from '@dnd-kit/core'
import { QuestionType } from '@/hooks/useFormBuilder'

interface QuestionTypeItem {
  type: QuestionType
  label: string
  icon: string
  category: 'Text' | 'Choice' | 'Scale' | 'Grid' | 'DateTime' | 'File' | 'Display'
}

const questionTypes: QuestionTypeItem[] = [
  // Text Questions
  { type: 'short_answer', label: 'Short Answer', icon: 'icofont-ui-text-loading', category: 'Text' },
  { type: 'paragraph', label: 'Paragraph', icon: 'icofont-paragraph', category: 'Text' },

  // Choice Questions
  { type: 'multiple_choice', label: 'Multiple Choice', icon: 'icofont-radio', category: 'Choice' },
  { type: 'checkboxes', label: 'Checkboxes', icon: 'icofont-check-alt', category: 'Choice' },
  { type: 'dropdown', label: 'Dropdown', icon: 'icofont-caret-down', category: 'Choice' },

  // Scale
  { type: 'linear_scale', label: 'Linear Scale', icon: 'icofont-chart-bar-graph', category: 'Scale' },

  // Grid
  { type: 'multiple_choice_grid', label: 'Multiple Choice Grid', icon: 'icofont-table', category: 'Grid' },
  { type: 'checkbox_grid', label: 'Checkbox Grid', icon: 'icofont-ui-check', category: 'Grid' },

  // Date & Time
  { type: 'date', label: 'Date', icon: 'icofont-calendar', category: 'DateTime' },
  { type: 'time', label: 'Time', icon: 'icofont-clock-time', category: 'DateTime' },

  // File
  { type: 'file_upload', label: 'File Upload', icon: 'icofont-upload-alt', category: 'File' },

  // Display
  { type: 'title_description', label: 'Title & Description', icon: 'icofont-text', category: 'Display' },
  { type: 'image', label: 'Image', icon: 'icofont-image', category: 'Display' },
  { type: 'video', label: 'Video', icon: 'icofont-play-alt-2', category: 'Display' },
  { type: 'section_break', label: 'Section Break', icon: 'icofont-minus', category: 'Display' },
]

// Group questions by category
const groupedQuestions = questionTypes.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = []
  }
  acc[item.category].push(item)
  return acc
}, {} as Record<string, QuestionTypeItem[]>)

const categoryOrder: Array<QuestionTypeItem['category']> = ['Text', 'Choice', 'Scale', 'Grid', 'DateTime', 'File', 'Display']

function DraggableQuestionType({ type, label, icon }: Omit<QuestionTypeItem, 'category'>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`question-palette-item ${isDragging ? 'dragging' : ''}`}
    >
      <i className={`${icon} me-2`}></i>
      <span>{label}</span>
    </div>
  )
}

export function QuestionPalette() {
  return (
    <div className="question-palette">
      <div className="question-palette-header">
        <h6 className="mb-0">
          <i className="icofont-ui-add me-2"></i>
          Add Question
        </h6>
        <small className="text-muted">Drag to add</small>
      </div>

      <div className="question-palette-body">
        {categoryOrder.map((category) => (
          <div key={category} className="question-palette-category">
            <div className="question-palette-category-header">
              {category}
            </div>
            <div className="question-palette-category-items">
              {groupedQuestions[category]?.map((item) => (
                <DraggableQuestionType
                  key={item.type}
                  type={item.type}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
