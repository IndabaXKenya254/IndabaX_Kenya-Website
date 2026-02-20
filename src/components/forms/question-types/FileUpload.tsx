'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FILE UPLOAD QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Issue #3 FIX: Uploads files to /api/upload and stores URLs (not File objects)
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'
import { useState } from 'react'

// Issue #3: Store uploaded file metadata (URL strings), not File objects
interface UploadedFile {
  url: string
  fileName: string
  originalName: string
  size: number
  type: string
}

interface FileUploadProps {
  question: Question
  value?: UploadedFile[] | File[]
  onChange?: (value: UploadedFile[]) => void
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function FileUpload({ question, value = [], onChange, onUpdate, mode }: FileUploadProps) {
  const config = question.config || {}
  const allowedTypes = config.allowedTypes || ['pdf', 'doc', 'docx']
  const maxSize = config.maxSize || 10485760 // 10MB
  const maxFiles = config.maxFiles || 1

  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Normalize value: handle both legacy File[] and new UploadedFile[]
  const uploadedFiles: UploadedFile[] = (value as any[]).filter(
    (f) => f && typeof f === 'object' && 'url' in f
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Issue #3 FIX: Upload file to server and store URL
  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)

    const newUploads: UploadedFile[] = [...uploadedFiles]

    for (const file of Array.from(files).slice(0, maxFiles - newUploads.length)) {
      // Client-side validation
      if (file.size > maxSize) {
        setUploadError(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`)
        continue
      }

      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext && !allowedTypes.includes(ext)) {
        setUploadError(`File type ".${ext}" is not allowed. Accepted: ${allowedTypes.join(', ')}`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'uploads')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (result.success && result.url) {
          newUploads.push({
            url: result.url,
            fileName: result.fileName || file.name,
            originalName: file.name,
            size: file.size,
            type: file.type,
          })
        } else {
          setUploadError(result.error || `Failed to upload "${file.name}"`)
        }
      } catch (err) {
        console.error('Upload error:', err)
        setUploadError(`Failed to upload "${file.name}". Please try again.`)
      }
    }

    onChange?.(newUploads)
    setUploading(false)
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    onChange?.(newFiles)
  }

  // Builder mode - show configuration options
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="mb-3">
          <label className="form-label">Allowed File Types</label>
          <div className="d-flex flex-wrap gap-2 mb-2">
            {['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'mov', 'zip', 'csv', 'xlsx'].map(
              (type) => (
                <div key={type} className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`type-${type}`}
                    checked={allowedTypes.includes(type)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...allowedTypes, type]
                        : allowedTypes.filter((t: string) => t !== type)
                      onUpdate?.({
                        config: { ...config, allowedTypes: newTypes },
                      })
                    }}
                  />
                  <label className="form-check-label" htmlFor={`type-${type}`}>
                    .{type}
                  </label>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Maximum File Size (MB)</label>
          <input
            type="number"
            className="form-control"
            min="1"
            max="100"
            value={maxSize / 1048576}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, maxSize: parseInt(e.target.value) * 1048576 },
              })
            }
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Maximum Number of Files</label>
          <input
            type="number"
            className="form-control"
            min="1"
            max="10"
            value={maxFiles}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, maxFiles: parseInt(e.target.value) },
              })
            }
          />
        </div>
      </div>
    )
  }

  // Preview/Response mode - show file upload interface
  return (
    <div className="question-type-preview">
      <div
        className={`file-upload-area ${dragOver ? 'drag-over' : ''} ${mode === 'preview' || uploading ? 'disabled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (mode !== 'preview') setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (mode !== 'preview' && !uploading) handleFileChange(e.dataTransfer.files)
        }}
      >
        <input
          type="file"
          id={`file-${question.id}`}
          className="d-none"
          accept={allowedTypes.map((t: string) => `.${t}`).join(',')}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileChange(e.target.files)}
          disabled={mode === 'preview' || uploading}
        />
        <label htmlFor={`file-${question.id}`} className="file-upload-label">
          {uploading ? (
            <>
              <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
              <p className="mb-1">Uploading...</p>
            </>
          ) : (
            <>
              <i className="icofont-upload-alt" style={{ fontSize: '2rem' }}></i>
              <p className="mb-1">
                {mode === 'preview' ? 'File upload area' : 'Drag and drop or click to upload'}
              </p>
            </>
          )}
          <small className="text-muted">
            Accepted: {allowedTypes.join(', ')} | Max size: {formatFileSize(maxSize)} | Max files: {maxFiles}
          </small>
        </label>
      </div>

      {uploadError && (
        <div className="alert alert-danger py-2 mt-2 small">
          <i className="icofont-warning-alt me-1"></i> {uploadError}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-3">
          <div className="list-group">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <i className="icofont-file-document me-2"></i>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <strong>{file.originalName || file.fileName}</strong>
                  </a>
                  {file.size > 0 && (
                    <small className="text-muted ms-2">({formatFileSize(file.size)})</small>
                  )}
                </div>
                {mode !== 'preview' && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <i className="icofont-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
