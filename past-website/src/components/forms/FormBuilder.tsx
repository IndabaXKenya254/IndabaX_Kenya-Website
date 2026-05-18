'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM BUILDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Main form builder with drag-and-drop interface
// Phase 3: Form Builder

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useFormBuilder, Question, QuestionType, Template } from '@/hooks/useFormBuilder'
import { QuestionPalette } from './QuestionPalette'
import { FormCanvas } from './FormCanvas'
import { PropertiesPanel } from './PropertiesPanel'
import { FormPreview } from './FormPreview'

interface FormBuilderProps {
  template?: Template
  questions?: Question[]
  onSave?: (template: Template, questions: Question[]) => void
}

export function FormBuilder({ template: initialTemplate, questions: initialQuestions, onSave }: FormBuilderProps) {
  const formBuilder = useFormBuilder(initialTemplate, initialQuestions)
  const {
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
  } = formBuilder

  const [activeId, setActiveId] = useState<string | null>(null)
  const [showProperties, setShowProperties] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    // Check if dragging from palette (adding new question)
    if ((active.id as string).startsWith('palette-')) {
      const questionType = (active.id as string).replace('palette-', '') as QuestionType
      addQuestion(questionType)
      setActiveId(null)
      return
    }

    // Reordering existing questions
    if (active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id)
      const newIndex = questions.findIndex((q) => q.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderQuestions(oldIndex, newIndex)
      }
    }

    setActiveId(null)
  }

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(template, questions)
    }
    setHasUnsavedChanges(false)
  }

  // Handle question select
  const handleQuestionSelect = (id: string) => {
    setSelectedQuestionId(id)
    setShowProperties(true)
  }

  // Handle close properties
  const handleCloseProperties = () => {
    setShowProperties(false)
    setSelectedQuestionId(null)
  }

  return (
    <div className="form-builder">
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="form-builder-layout">
          {/* Question Palette - Left Sidebar */}
          <aside className="form-builder-palette">
            <QuestionPalette />
          </aside>

          {/* Form Canvas - Center */}
          <main className="form-builder-canvas">
            {/* Template Header */}
            <div className="card mb-3">
              <div className="card-body">
                <input
                  type="text"
                  className="form-control form-control-lg mb-2"
                  placeholder="Template Name"
                  value={template.name}
                  onChange={(e) => updateTemplate({ name: e.target.value })}
                />
                <textarea
                  className="form-control"
                  placeholder="Template Description (optional)"
                  rows={2}
                  value={template.description || ''}
                  onChange={(e) => updateTemplate({ description: e.target.value })}
                />
                <div className="mt-3 d-flex gap-2 align-items-center flex-wrap">
                  <select
                    className="form-select"
                    style={{ flex: 1, minWidth: '200px' }}
                    value={template.usage_type}
                    onChange={(e) => updateTemplate({ usage_type: e.target.value as any })}
                  >
                    <option value="custom">Custom</option>
                    <option value="application">Application Form</option>
                    <option value="initial_interest">Interest Form</option>
                    <option value="detailed_survey">Detailed Survey</option>
                    <option value="paper_submission">Paper Submission</option>
                  </select>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isLocked"
                      checked={template.is_locked}
                      onChange={(e) => updateTemplate({ is_locked: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="isLocked">
                      Lock Template
                    </label>
                  </div>
                  <button
                    className="btn btn-outline-primary ms-auto"
                    onClick={() => setShowPreview(true)}
                    disabled={questions.length === 0}
                  >
                    <i className="icofont-eye me-2"></i>
                    Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
              <FormCanvas
                questions={questions}
                selectedQuestionId={selectedQuestionId}
                onQuestionSelect={handleQuestionSelect}
                onQuestionDelete={deleteQuestion}
                onQuestionDuplicate={duplicateQuestion}
              />
            </SortableContext>
          </main>

          {/* Properties Panel - Right Sidebar */}
          {showProperties && selectedQuestion && (
            <aside className="form-builder-properties">
              <PropertiesPanel
                question={selectedQuestion}
                onUpdate={(updates) => updateQuestion(selectedQuestion.id, updates)}
                onClose={handleCloseProperties}
              />
            </aside>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="card shadow-lg" style={{ opacity: 0.8 }}>
              <div className="card-body">
                <i className="icofont-drag me-2"></i>
                Dragging...
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Save Bar */}
      {hasUnsavedChanges && (
        <div className="form-builder-save-bar">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-warning">
                <i className="icofont-warning me-2"></i>
                You have unsaved changes
              </span>
              <button className="btn btn-primary" onClick={handleSave}>
                <i className="icofont-save me-2"></i>
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <FormPreview
          template={template}
          questions={questions}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
