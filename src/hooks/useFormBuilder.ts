// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM BUILDER HOOK
// ═══════════════════════════════════════════════════════════════════════
// State management for form builder
// Phase 3: Form Builder

import { useState, useCallback } from 'react'
import { nanoid } from 'nanoid'

export type QuestionType =
  | 'short_answer'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'linear_scale'
  | 'multiple_choice_grid'
  | 'checkbox_grid'
  | 'date'
  | 'time'
  | 'file_upload'
  | 'title_description'
  | 'image'
  | 'video'
  | 'section_break'

export interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  is_required: boolean
  order_index: number
  config: Record<string, any>
  validation_rules?: Record<string, any>
  conditional_logic?: Record<string, any>
}

export interface Template {
  id?: string
  name: string
  description?: string
  usage_type: 'initial_interest' | 'detailed_survey' | 'paper_submission' | 'custom'
  is_locked: boolean
  locked_to_event_id?: string | null
  settings: {
    validityPeriodDays: number
    autoSave: boolean
    allowResume: boolean
    showProgress: boolean
  }
}

export function useFormBuilder(initialTemplate?: Template, initialQuestions?: Question[]) {
  const [template, setTemplate] = useState<Template>(
    initialTemplate || {
      name: '',
      description: '',
      usage_type: 'custom',
      is_locked: false,
      settings: {
        validityPeriodDays: 7,
        autoSave: true,
        allowResume: true,
        showProgress: true,
      },
    }
  )

  const [questions, setQuestions] = useState<Question[]>(initialQuestions || [])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Get selected question
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || null

  // Update template
  const updateTemplate = useCallback((updates: Partial<Template>) => {
    setTemplate((prev) => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }, [])

  // Add question
  const addQuestion = useCallback(
    (type: QuestionType) => {
      const newQuestion: Question = {
        id: nanoid(),
        type,
        title: getDefaultTitle(type),
        description: '',
        is_required: false,
        order_index: questions.length,
        config: getDefaultConfig(type),
        validation_rules: {},
      }

      setQuestions((prev) => [...prev, newQuestion])
      setSelectedQuestionId(newQuestion.id)
      setHasUnsavedChanges(true)
    },
    [questions.length]
  )

  // Update question
  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    )
    setHasUnsavedChanges(true)
  }, [])

  // Delete question
  const deleteQuestion = useCallback((id: string) => {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== id)
      // Reindex remaining questions
      return filtered.map((q, index) => ({ ...q, order_index: index }))
    })
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null)
    }
    setHasUnsavedChanges(true)
  }, [selectedQuestionId])

  // Duplicate question
  const duplicateQuestion = useCallback((id: string) => {
    setQuestions((prev) => {
      const original = prev.find((q) => q.id === id)
      if (!original) return prev

      const duplicate: Question = {
        ...original,
        id: nanoid(),
        title: `${original.title} (Copy)`,
        order_index: prev.length,
      }

      return [...prev, duplicate]
    })
    setHasUnsavedChanges(true)
  }, [])

  // Reorder questions
  const reorderQuestions = useCallback((startIndex: number, endIndex: number) => {
    setQuestions((prev) => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)

      // Update order_index
      return result.map((q, index) => ({ ...q, order_index: index }))
    })
    setHasUnsavedChanges(true)
  }, [])

  // Reset form
  const reset = useCallback(() => {
    setQuestions([])
    setSelectedQuestionId(null)
    setHasUnsavedChanges(false)
  }, [])

  return {
    template,
    questions,
    selectedQuestion,
    selectedQuestionId,
    hasUnsavedChanges,
    updateTemplate,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    setSelectedQuestionId,
    setHasUnsavedChanges,
    reset,
  }
}

// Helper: Get default title for question type
function getDefaultTitle(type: QuestionType): string {
  const titles: Record<QuestionType, string> = {
    short_answer: 'Untitled Question',
    paragraph: 'Untitled Question',
    multiple_choice: 'Untitled Question',
    checkboxes: 'Untitled Question',
    dropdown: 'Untitled Question',
    linear_scale: 'Rate your experience',
    multiple_choice_grid: 'Untitled Grid',
    checkbox_grid: 'Untitled Grid',
    date: 'Select Date',
    time: 'Select Time',
    file_upload: 'Upload File',
    title_description: 'Section Title',
    image: 'Image',
    video: 'Video',
    section_break: 'Section Break',
  }
  return titles[type]
}

// Helper: Get default config for question type
function getDefaultConfig(type: QuestionType): Record<string, any> {
  const configs: Record<QuestionType, Record<string, any>> = {
    short_answer: {
      placeholder: 'Your answer',
      minLength: 0,
      maxLength: 500,
    },
    paragraph: {
      placeholder: 'Your answer',
      minLength: 0,
      maxLength: 5000,
    },
    multiple_choice: {
      options: ['Option 1'],
      allowOther: false,
      randomize: false,
    },
    checkboxes: {
      options: ['Option 1'],
      allowOther: false,
      randomize: false,
    },
    dropdown: {
      options: ['Option 1'],
    },
    linear_scale: {
      min: 1,
      max: 5,
      minLabel: 'Poor',
      maxLabel: 'Excellent',
    },
    multiple_choice_grid: {
      rows: ['Row 1'],
      columns: ['Column 1'],
    },
    checkbox_grid: {
      rows: ['Row 1'],
      columns: ['Column 1'],
    },
    date: {
      includeTime: false,
      minDate: null,
      maxDate: null,
      defaultToToday: false,
    },
    time: {
      format: '24h',
    },
    file_upload: {
      allowedTypes: ['pdf', 'doc', 'docx'],
      maxSize: 10485760, // 10MB
      maxFiles: 1,
    },
    title_description: {
      content: '',
      alignment: 'left',
    },
    image: {
      url: '',
      altText: '',
      width: '100%',
    },
    video: {
      url: '',
    },
    section_break: {
      title: 'Section Break',
      description: '',
      pageBreak: false,
    },
  }
  return configs[type] || {}
}
