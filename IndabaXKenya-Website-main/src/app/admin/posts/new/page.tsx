'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CREATE POST PAGE
// ═══════════════════════════════════════════════════════════════════════
// Form to create new blog posts
// Created: Admin UI Phase 2 - Content Management

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { FileUpload } from '@/components/admin/ui'
import RichTextEditor from '@/components/admin/RichTextEditor'
import PostPreviewModal from '@/components/admin/PostPreviewModal'
import { TagSelector } from '@/components/admin/selectors'
import { adminApi } from '@/lib/admin/api-client'
import { showSuccess, showError, showLoading, closeAlert, showToast, showValidationError } from '@/lib/sweetalert'

export default function CreatePostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAuthorImage, setUploadingAuthorImage] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'news',
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured_image_url: '',
    is_featured: false,
    tag_ids: [] as string[],
    author_name: '',
    author_image: '',
    // Sauti Yetu (external link) fields
    post_type: 'normal' as 'normal' | 'sauti_yetu',
    external_url: '',
    og_image: '',
    source_name: '',
  })

  const [fetchingOg, setFetchingOg] = useState(false)

  // Fetch Open Graph metadata from external URL
  const handleFetchOg = async () => {
    if (!formData.external_url.trim()) {
      showError('Error', 'Please enter an external URL first')
      return
    }

    setFetchingOg(true)
    showLoading('Fetching article preview...')

    try {
      const response = await fetch('/api/admin/fetch-og', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: formData.external_url }),
      })

      const result = await response.json()
      closeAlert()

      if (result.success && result.data) {
        const { title, description, image, siteName } = result.data

        setFormData((prev) => ({
          ...prev,
          title: title || prev.title,
          content: description || prev.content,
          og_image: image || '',
          source_name: siteName || '',
          featured_image_url: image || prev.featured_image_url,
        }))

        showToast('Article preview fetched successfully!', 'success')
      } else {
        showError('Fetch Failed', result.error?.message || 'Could not fetch article preview. You can enter details manually.')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'Failed to fetch article preview. Please enter details manually.')
    } finally {
      setFetchingOg(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))
  }

  const handleFileSelect = async (file: File) => {
    setUploadingImage(true)
    showLoading('Uploading image...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload/post-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const result = await response.json()

      closeAlert()

      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          featured_image_url: result.data.url,
        }))
        showToast('Image uploaded successfully!', 'success')
      } else {
        showError('Upload Failed', result.error?.message || 'Failed to upload image')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'An unexpected error occurred while uploading the image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAuthorImageSelect = async (file: File) => {
    setUploadingAuthorImage(true)
    showLoading('Uploading author image...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload/post-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const result = await response.json()

      closeAlert()

      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          author_image: result.data.url,
        }))
        showToast('Author image uploaded successfully!', 'success')
      } else {
        showError('Upload Failed', result.error?.message || 'Failed to upload author image')
      }
    } catch (error) {
      closeAlert()
      showError('Error', 'An unexpected error occurred while uploading the author image')
    } finally {
      setUploadingAuthorImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const errors = []
    if (!formData.title.trim()) errors.push('Title is required')
    if (!formData.content.trim()) errors.push(formData.post_type === 'sauti_yetu' ? 'Description is required' : 'Content is required')
    if (formData.post_type === 'sauti_yetu' && !formData.external_url.trim()) {
      errors.push('External URL is required for Sauti Yetu posts')
    }

    if (errors.length > 0) {
      showValidationError(errors)
      return
    }

    setLoading(true)
    showLoading('Creating post...')

    try {
      const result = await adminApi.posts.create(formData)

      closeAlert()

      if (result.success) {
        await showSuccess(
          'Post Created!',
          'Your post has been created successfully. Redirecting...',
          2000
        )
        router.push('/admin/posts')
      } else {
        setLoading(false)
        showError('Creation Failed', result.error || 'Failed to create post')
      }
    } catch (error) {
      closeAlert()
      setLoading(false)
      showError('Error', 'An unexpected error occurred while creating the post')
    }
  }

  // Handler for rich text editor content changes
  const handleContentChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      content: value,
    }))
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Create Post</h2>
            <p className="text-muted">Add a new blog post or announcement</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/admin/posts')}
            >
              ← Back to Posts
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Left Column */}
                <div className="col-md-8">
                  {/* Post Type Selector */}
                  <div className="mb-4">
                    <label className="form-label">Post Type</label>
                    <div className="btn-group w-100" role="group">
                      <input
                        type="radio"
                        className="btn-check"
                        name="post_type"
                        id="post_type_normal"
                        value="normal"
                        checked={formData.post_type === 'normal'}
                        onChange={handleChange}
                      />
                      <label className="btn btn-outline-primary" htmlFor="post_type_normal">
                        <i className="bi bi-file-text me-2"></i>
                        Normal Post
                      </label>
                      <input
                        type="radio"
                        className="btn-check"
                        name="post_type"
                        id="post_type_sauti_yetu"
                        value="sauti_yetu"
                        checked={formData.post_type === 'sauti_yetu'}
                        onChange={handleChange}
                      />
                      <label className="btn btn-outline-primary" htmlFor="post_type_sauti_yetu">
                        <i className="bi bi-link-45deg me-2"></i>
                        Sauti Yetu (External Link)
                      </label>
                    </div>
                    <small className="text-muted d-block mt-1">
                      {formData.post_type === 'normal'
                        ? 'Create a full blog post with rich content'
                        : 'Link to an external article - readers will be redirected to the source'}
                    </small>
                  </div>

                  {/* Sauti Yetu: External URL Section */}
                  {formData.post_type === 'sauti_yetu' && (
                    <div className="mb-4 p-3 bg-light rounded border">
                      <h6 className="mb-3">
                        <i className="bi bi-globe me-2"></i>
                        External Article Link
                      </h6>
                      <div className="input-group mb-2">
                        <input
                          type="url"
                          className="form-control"
                          id="external_url"
                          name="external_url"
                          value={formData.external_url}
                          onChange={handleChange}
                          placeholder="https://example.com/article"
                          required={formData.post_type === 'sauti_yetu'}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleFetchOg}
                          disabled={fetchingOg || !formData.external_url.trim()}
                        >
                          {fetchingOg ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Fetching...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-download me-2"></i>
                              Fetch Preview
                            </>
                          )}
                        </button>
                      </div>
                      <small className="text-muted">
                        Enter the article URL and click &quot;Fetch Preview&quot; to auto-fill title, description, and image
                      </small>

                      {/* Source Name */}
                      {formData.source_name && (
                        <div className="mt-3">
                          <label htmlFor="source_name" className="form-label small">Source</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            id="source_name"
                            name="source_name"
                            value={formData.source_name}
                            onChange={handleChange}
                            placeholder="e.g., Deep Learning Indaba"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder={formData.post_type === 'sauti_yetu' ? 'Article title (auto-filled or enter manually)' : 'Enter post title'}
                    />
                  </div>

                  {/* Content - Conditional based on post type */}
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      {formData.post_type === 'sauti_yetu' ? 'Description' : 'Content'} <span className="text-danger">*</span>
                    </label>
                    {formData.post_type === 'sauti_yetu' ? (
                      <>
                        <textarea
                          className="form-control"
                          id="content"
                          name="content"
                          value={formData.content}
                          onChange={handleChange}
                          required
                          rows={4}
                          placeholder="Brief description of the article (auto-filled or enter manually)"
                        />
                        <small className="text-muted">
                          This description will be shown on the card preview. Keep it concise (2-3 sentences).
                        </small>
                      </>
                    ) : (
                      <RichTextEditor
                        value={formData.content}
                        onChange={handleContentChange}
                        placeholder="Write your post content here... Use the toolbar to format text and add images."
                        disabled={loading}
                      />
                    )}
                  </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="col-md-4">
                  {/* Status */}
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">Status</label>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">Category</label>
                    <select
                      className="form-select"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="news">News</option>
                      <option value="announcement">Announcement</option>
                      <option value="event">Event</option>
                      <option value="blog">Blog</option>
                    </select>
                  </div>

                  {/* Featured Post Toggle */}
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="is_featured"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="is_featured">
                        <strong>Featured Post</strong>
                        <small className="d-block text-muted">
                          Highlight this post
                        </small>
                      </label>
                    </div>
                  </div>

                  {/* Tag Selector */}
                  <div className="mb-3">
                    <TagSelector
                      type="post"
                      selectedIds={formData.tag_ids}
                      onChange={(tag_ids) => setFormData(prev => ({ ...prev, tag_ids }))}
                      disabled={loading}
                    />
                  </div>

                  {/* Featured Image */}
                  <div className="mb-3">
                    {formData.post_type === 'sauti_yetu' && formData.og_image ? (
                      <div>
                        <label className="form-label">
                          <i className="bi bi-image me-2"></i>
                          Article Image (from external source)
                        </label>
                        <div className="position-relative">
                          <img
                            src={formData.og_image}
                            alt="Article preview"
                            className="img-fluid rounded border"
                            style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                            onClick={() => setFormData(prev => ({ ...prev, og_image: '', featured_image_url: '' }))}
                            title="Remove image"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                        <small className="text-muted d-block mt-2">
                          Image fetched from the external article. You can also upload a custom image below.
                        </small>
                        <div className="mt-2">
                          <FileUpload
                            onFileSelect={handleFileSelect}
                            accept="image/*"
                            maxSize={5 * 1024 * 1024}
                            preview={true}
                            currentUrl={formData.featured_image_url !== formData.og_image ? formData.featured_image_url : ''}
                            label="Upload Custom Image (Optional)"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <FileUpload
                          onFileSelect={handleFileSelect}
                          accept="image/*"
                          maxSize={5 * 1024 * 1024}
                          preview={true}
                          currentUrl={formData.featured_image_url}
                          label={formData.post_type === 'sauti_yetu' ? 'Article Image' : 'Featured Image'}
                        />
                        {formData.post_type === 'sauti_yetu' && (
                          <small className="text-muted d-block mt-1">
                            Image will be fetched from the external URL if available, or upload manually.
                          </small>
                        )}
                      </>
                    )}
                    {uploadingImage && (
                      <div className="mt-2">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Uploading...</span>
                        </div>
                        <span className="text-muted small">Uploading image...</span>
                      </div>
                    )}
                  </div>

                  {/* Author Information - Only for normal posts */}
                  {formData.post_type === 'normal' && (
                  <div className="mb-3">
                    <div className="card bg-light">
                      <div className="card-body p-3">
                        <h6 className="card-title mb-3">Author Information (Optional)</h6>
                        <p className="small text-muted mb-3">
                          If not provided, your account name and initials avatar will be used automatically.
                        </p>

                        {/* Author Name */}
                        <div className="mb-3">
                          <label htmlFor="author_name" className="form-label small">
                            Author Name
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            id="author_name"
                            name="author_name"
                            value={formData.author_name}
                            onChange={handleChange}
                            placeholder="e.g. John Doe (leave empty for auto-fill)"
                          />
                        </div>

                        {/* Author Image */}
                        <div className="mb-0">
                          <label className="form-label small">Author Image</label>
                          <FileUpload
                            onFileSelect={handleAuthorImageSelect}
                            accept="image/*"
                            maxSize={2 * 1024 * 1024}
                            preview={true}
                            currentUrl={formData.author_image}
                            label="Upload Author Image"
                          />
                          {uploadingAuthorImage && (
                            <div className="mt-2">
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Uploading...</span>
                              </div>
                              <span className="text-muted small">Uploading...</span>
                            </div>
                          )}
                          <small className="text-muted d-block mt-1">
                            Leave empty to use Gmail-style initials avatar
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Action Buttons */}
                  <div className="d-grid gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-info text-white"
                      onClick={() => setShowPreview(true)}
                      disabled={loading || uploadingImage || uploadingAuthorImage}
                    >
                      <i className="icofont-eye me-2"></i>
                      Preview Post
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading || uploadingImage || uploadingAuthorImage}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <span className="me-2">✓</span>
                          Create Post
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => router.push('/admin/posts')}
                      disabled={loading}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Preview Modal */}
        <PostPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          postData={formData}
        />
      </div>
    </DashboardLayout>
  )
}
