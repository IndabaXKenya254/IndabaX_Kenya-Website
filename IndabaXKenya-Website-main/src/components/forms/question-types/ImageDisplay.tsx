'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - IMAGE DISPLAY QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Issue #4 FIX: Added file upload option alongside URL input
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'
import { useState, useRef } from 'react'

interface ImageDisplayProps {
  question: Question
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function ImageDisplay({ question, onUpdate, mode }: ImageDisplayProps) {
  const config = question.config || {}
  const url = config.url || ''
  const altText = config.altText || ''
  const width = config.width || '100%'
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadError, setUploadError] = useState<string | null>(null)

  // Issue #4: Upload image file to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'uploads')

      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const result = await response.json()

      if (result.success && result.url) {
        onUpdate?.({ config: { ...config, url: result.url } })
      } else {
        setUploadError(result.error || 'Upload failed')
        console.error('Image upload error:', result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setUploadError(errorMessage)
      console.error('Image upload error:', err)
    }
    setUploading(false)
  }

  // Builder mode
  if (mode === 'builder') {
    return (
      <div className="question-type-config">
        <div className="mb-3">
          <label className="form-label">Image URL</label>
          <div className="input-group">
            <input
              type="url"
              className="form-control"
              value={url}
              placeholder="https://example.com/image.jpg"
              onChange={(e) =>
                onUpdate?.({
                  config: { ...config, url: e.target.value },
                })
              }
            />
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <><i className="icofont-upload-alt me-1"></i> Upload</>
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <small className="text-muted">Enter a URL or upload an image file</small>
          {uploadError && (
            <div className="alert alert-danger py-2 mt-2 mb-0">
              <i className="icofont-warning me-1"></i>
              {uploadError}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Alt Text (for accessibility)</label>
          <input
            type="text"
            className="form-control"
            value={altText}
            placeholder="Description of the image"
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, altText: e.target.value },
              })
            }
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Width</label>
          <select
            className="form-select"
            value={width}
            onChange={(e) =>
              onUpdate?.({
                config: { ...config, width: e.target.value },
              })
            }
          >
            <option value="100%">Full Width</option>
            <option value="75%">75%</option>
            <option value="50%">50%</option>
            <option value="25%">25%</option>
          </select>
        </div>

        {url && (
          <div className="mb-3">
            <label className="form-label">Preview:</label>
            <img src={url} alt={altText} style={{ width, maxWidth: '100%' }} className="img-fluid rounded" />
          </div>
        )}
      </div>
    )
  }

  // Preview/Response mode
  if (!url) {
    return (
      <div className="question-type-preview">
        <div className="alert alert-secondary">
          <i className="icofont-image me-2"></i>
          No image URL provided
        </div>
      </div>
    )
  }

  return (
    <div className="question-type-preview text-center">
      <img src={url} alt={altText} style={{ width, maxWidth: '100%' }} className="img-fluid rounded" />
    </div>
  )
}
