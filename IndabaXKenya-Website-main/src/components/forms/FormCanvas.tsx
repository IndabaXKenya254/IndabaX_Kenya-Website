'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Drop zone and questions list
// Phase 3: Form Builder

import { useDroppable } from '@dnd-kit/core'
import { Question } from '@/hooks/useFormBuilder'
import { DraggableQuestion } from './DraggableQuestion'

interface FormCanvasProps {
  questions: Question[]
  selectedQuestionId: string | null
  onQuestionSelect: (id: string) => void
  onQuestionDelete: (id: string) => void
  onQuestionDuplicate: (id: string) => void
}

export function FormCanvas({
  questions,
  selectedQuestionId,
  onQuestionSelect,
  onQuestionDelete,
  onQuestionDuplicate,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  })

  return (
    <div
      ref={setNodeRef}
      className={`form-canvas ${isOver ? 'drop-over' : ''}`}
    >
      {questions.length === 0 ? (
        <div className="form-canvas-empty">
          <div className="text-center py-5">
            <i className="icofont-drag" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
            <p className="mt-3 text-muted mb-2">No questions yet</p>
            <small>Drag question types from the left to get started</small>
          </div>
        </div>
      ) : (
        <div className="form-canvas-questions">
          {questions.map((question) => (
            <DraggableQuestion
              key={question.id}
              question={question}
              isSelected={question.id === selectedQuestionId}
              onSelect={onQuestionSelect}
              onDelete={onQuestionDelete}
              onDuplicate={onQuestionDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
