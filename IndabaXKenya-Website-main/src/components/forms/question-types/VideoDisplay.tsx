'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - VIDEO DISPLAY QUESTION TYPE
// ═══════════════════════════════════════════════════════════════════════
// Embed video in form (YouTube, Vimeo, etc.)
// Phase 3: Form Builder

import { Question } from '@/hooks/useFormBuilder'
import { useState, useRef } from 'react'

interface VideoDisplayProps {
  question: Question
  onUpdate?: (updates: Partial<Question>) => void
  mode: 'builder' | 'preview' | 'response'
}

export function VideoDisplay({ question, onUpdate, mode }: VideoDisplayProps) {
  const config = question.config || {}
  const url = config.url || ''
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Issue #4: Upload video file to Supabase Storage
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
        console.error('Video upload error:', result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setUploadError(errorMessage)
      console.error('Video upload error:', err)
    }
    setUploading(false)
  }

  // Convert YouTube/Vimeo URLs to embed format
  const getEmbedUrl = (videoUrl: string) => {
    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('youtu.be')
        ? videoUrl.split('youtu.be/')[1]?.split('?')[0]
        : videoUrl.split('v=')[1]?.split('&')[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }

    // Vimeo
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : ''
    }

    // If already an embed URL or direct video, return as-is
    return videoUrl
  }

  // Builder mode
  if (mode === 'builder') {
    const embedUrl = getEmbedUrl(url)

    return (
      <div className="question-type-config">
        <div className="mb-3">
          <label className="form-label">Video URL</label>
          <div className="input-group">
            <input
              type="url"
              className="form-control"
              value={url}
              placeholder="https://www.youtube.com/watch?v=..."
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
            accept="video/*"
            onChange={handleFileUpload}
          />
          <small className="text-muted">
            Supports YouTube, Vimeo, direct URLs, or upload a video file
          </small>
          {uploadError && (
            <div className="alert alert-danger py-2 mt-2 mb-0">
              <i className="icofont-warning me-1"></i>
              {uploadError}
            </div>
          )}
        </div>

        {embedUrl && (
          <div className="mb-3">
            <label className="form-label">Preview:</label>
            <div className="ratio ratio-16x9">
              <iframe
                src={embedUrl}
                title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Preview/Response mode
  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div className="question-type-preview">
        <div className="alert alert-secondary">
          <i className="icofont-play-alt-2 me-2"></i>
          No video URL provided
        </div>
      </div>
    )
  }

  return (
    <div className="question-type-preview">
      <div className="ratio ratio-16x9">
        <iframe
          src={embedUrl}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
