'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - QUILL EDITOR COMPONENT (PHASE 7)
// ═══════════════════════════════════════════════════════════════════════
// Reusable rich text editor component using ReactQuill

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface QuillEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
  disabled?: boolean
}

export function QuillEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  height = '300px',
  disabled = false
}: QuillEditorProps) {
  const [mounted, setMounted] = useState(false)

  // Wait for component to mount (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  }

  // Quill formats configuration
  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'color',
    'background',
    'align'
  ]

  // Don't render until mounted (client-side)
  if (!mounted) {
    return (
      <div
        className="border rounded p-3 bg-light"
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span className="text-muted">Loading editor...</span>
      </div>
    )
  }

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{ height }}
      />

      <style jsx global>{`
        .quill-editor-wrapper .ql-container {
          min-height: ${height};
          font-family: inherit;
          font-size: 14px;
        }

        .quill-editor-wrapper .ql-editor {
          min-height: calc(${height} - 42px);
        }

        .quill-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.25rem;
          border-top-right-radius: 0.25rem;
          background-color: #f8f9fa;
        }

        .quill-editor-wrapper .ql-container {
          border-bottom-left-radius: 0.25rem;
          border-bottom-right-radius: 0.25rem;
        }

        .quill-editor-wrapper .ql-editor.ql-blank::before {
          color: #6c757d;
          font-style: normal;
        }
      `}</style>
    </div>
  )
}
