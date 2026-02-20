// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - RICH TEXT EDITOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Quill.js-based rich text editor with image upload to Supabase Storage
// Created: For post content management with inline image support
// ═══════════════════════════════════════════════════════════════════════

"use client"

import { useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Dynamic import to prevent SSR issues with Quill
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill')
    const QuillWrapper = ({ forwardedRef, ...props }: any) => (
      <RQ ref={forwardedRef} {...props} />
    )
    QuillWrapper.displayName = 'QuillWrapper'
    return QuillWrapper
  },
  {
    ssr: false,
    loading: () => (
      <div className="quill-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading editor...</span>
        </div>
      </div>
    )
  }
)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing your content here...',
  disabled = false
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null)
  const [isUploading, setIsUploading] = useState(false)

  /**
   * Custom image handler for Quill toolbar
   * Uploads images to Supabase Storage via existing API endpoint
   */
  const imageHandler = async () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, or WebP)')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }

      setIsUploading(true)

      try {
        // Upload to Supabase via existing API
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/admin/upload/post-image', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        const result = await response.json()

        if (result.success && result.data) {
          // Insert image into editor at cursor position
          const editor = quillRef.current?.getEditor()
          if (editor) {
            const range = editor.getSelection(true)
            editor.insertEmbed(range.index, 'image', result.data.url)
            // Move cursor after the image
            editor.setSelection(range.index + 1)
          }
        } else {
          alert(result.error?.message || 'Failed to upload image. Please try again.')
        }
      } catch (error) {
        console.error('Image upload error:', error)
        alert('An error occurred while uploading the image. Please try again.')
      } finally {
        setIsUploading(false)
      }
    }
  }

  /**
   * Quill toolbar configuration
   * Customized for blog post editing with rich formatting options
   */
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        // Headers
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        // Font size
        [{ 'size': ['small', false, 'large', 'huge'] }],

        // Text formatting
        ['bold', 'italic', 'underline', 'strike'],

        // Colors
        [{ 'color': [] }, { 'background': [] }],

        // Lists
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],

        // Indentation
        [{ 'indent': '-1' }, { 'indent': '+1' }],

        // Alignment
        [{ 'align': [] }],

        // Blockquote and code block
        ['blockquote', 'code-block'],

        // Links, images, and videos
        ['link', 'image', 'video'],

        // Clear formatting
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), [])

  /**
   * Allowed formats in the editor
   */
  const formats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ]

  return (
    <div className="rich-text-editor-wrapper">
      {isUploading && (
        <div className="upload-indicator">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Uploading image...
        </div>
      )}

      <ReactQuill
        forwardedRef={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled || isUploading}
      />

      {/* Character count helper */}
      <div className="editor-helper-text">
        <small className="text-muted">
          <i className="icofont-info-circle"></i> Tip: Click the image icon in the toolbar to upload images directly into your content
        </small>
      </div>
    </div>
  )
}
