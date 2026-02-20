'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FILE UPLOAD COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Reusable file upload with drag-and-drop and preview
// Created: Admin UI Phase 2 - Content Management

import { useState, useRef, ChangeEvent, DragEvent } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  preview?: boolean
  currentUrl?: string
  label?: string
  disabled?: boolean
}

export function FileUpload({
  onFileSelect,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  preview = true,
  currentUrl,
  label = 'Upload File',
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    setError(null)

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
      setError(`File size exceeds ${maxSizeMB}MB limit`)
      return false
    }

    // Check file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      setError(`Invalid file type. Expected: ${accept}`)
      return false
    }

    return true
  }

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file)

      // Generate preview for images
      if (preview && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="file-upload-wrapper">
      <label className="form-label">{label}</label>

      <div
        className={`file-upload-area ${dragActive ? 'dragover' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={disabled ? undefined : handleDrag}
        onDragOver={disabled ? undefined : handleDrag}
        onDragLeave={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
        onClick={handleClick}
        style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
        />

        {previewUrl && preview ? (
          <div className="file-preview">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <p className="text-muted small mt-2">Click or drag to replace</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-3" style={{ fontSize: '3rem' }}>📁</div>
            <p className="mb-2">Drag and drop your file here</p>
            <p className="text-muted small">or click to browse</p>
            <p className="text-muted small">Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger mt-2 mb-0" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
