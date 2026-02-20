'use client'

import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import imageCompression from 'browser-image-compression'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Alert, FileUpload, Modal, Pagination, SearchFilter } from '@/components/admin/ui'
import { useAdminPhotos } from '@/hooks/useAdminApi'
import { adminApi } from '@/lib/admin/api-client'

// Image compression options - compress to under 4MB for Vercel's limit
const compressionOptions = {
  maxSizeMB: 3.5,           // Max file size in MB (under Vercel's 4.5MB limit)
  maxWidthOrHeight: 2400,   // Max dimension in pixels
  useWebWorker: true,       // Use web worker for better performance
  fileType: 'image/jpeg',   // Convert to JPEG for better compression
}

// Generate year options dynamically (from 2022 to current year + 1)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const startYear = 2022
  const years = []
  for (let year = currentYear + 1; year >= startYear; year--) {
    years.push(year.toString())
  }
  return years
}

export default function AdminGalleryPage() {
  const queryClient = useQueryClient()
  const [events, setEvents] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null })
  const [yearFilter, setYearFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear().toString())

  // Dynamic year options
  const yearOptions = generateYearOptions()
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadCategory, setUploadCategory] = useState('General')
  const [uploadEventId, setUploadEventId] = useState('')
  const [uploadEventName, setUploadEventName] = useState('')
  const [uploadIsFeatured, setUploadIsFeatured] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<{ file: File; preview: string; isFeatured: boolean }[]>([])
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const hasLoadedEventsRef = useRef(false)

  // Use React Query hook
  const { data: photos, isLoading: loading } = useAdminPhotos({
    search: searchTerm.trim() || undefined,
    year: yearFilter !== 'all' ? yearFilter : undefined,
    is_featured: featuredFilter !== 'all' ? (featuredFilter === 'true') : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  const totalItems = !photos || photos.length === 0 ? 0 : photos.length

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    const result = await adminApi.events.list({})
    if (result.success && result.data) {
      setEvents(result.data as any[])
    }
  }

  const handleEventChange = (eventId: string) => {
    setUploadEventId(eventId)
    if (eventId) {
      const selectedEvent = events.find((e) => e.id === eventId)
      if (selectedEvent) {
        setUploadEventName(selectedEvent.title)
      }
    } else {
      setUploadEventName('')
    }
  }

  const handleFilesSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Filter for images and videos
    const mediaFiles = fileArray.filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    if (mediaFiles.length === 0) {
      setAlert({ type: 'danger', message: 'No valid image or video files selected' })
      return
    }

    setSelectedFiles(mediaFiles)

    // Create previews for all files
    const previews: { file: File; preview: string; isFeatured: boolean }[] = []
    let loaded = 0

    mediaFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push({ file, preview: reader.result as string, isFeatured: uploadIsFeatured })
        loaded++

        if (loaded === mediaFiles.length) {
          setFilePreviews(previews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const toggleFileFeatured = (index: number) => {
    setFilePreviews(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, isFeatured: !item.isFeatured } : item
      )
    )
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setAlert({ type: 'danger', message: 'Please select files first' })
      return
    }

    // Issue #3 FIX: Removed debug logs for production
    setUploading(true)
    setAlert(null)

    let successCount = 0
    let failCount = 0

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const filePreview = filePreviews[i]

        try {
          // Compress image if it's too large (over 3.5MB) or is an image
          let fileToUpload = file
          if (file.type.startsWith('image/') && file.size > 3.5 * 1024 * 1024) {
            try {
              fileToUpload = await imageCompression(file, compressionOptions)
            } catch (compressionError) {
              // Continue with original file if compression fails
            }
          }

          // Upload file
          const formData = new FormData()
          formData.append('file', fileToUpload)

          const res = await fetch('/api/admin/upload/gallery-photo', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          })

          const result = await res.json()

          if (result.success && result.data) {
            // Create photo record with all metadata including individual featured status
            const photoData: any = {
              image_url: result.data.url,
              thumbnail_url: result.data.thumbnailUrl,
              caption: uploadCaption || file.name.replace(/\.[^/.]+$/, ''),
              year: uploadYear,
              category: uploadCategory,
              is_featured: filePreview.isFeatured,
              media_type: file.type.startsWith('video/') ? 'video' : 'image',
            }

            // Add event info if selected
            if (uploadEventId) {
              photoData.event_id = uploadEventId
              photoData.event_name = uploadEventName
            }

            const createResult = await adminApi.photos.create(photoData)

            if (createResult.success) {
              successCount++
            } else {
              failCount++
              console.error(`Failed to save photo ${file.name}:`, createResult.error)
            }
          } else {
            failCount++
            console.error(`Upload failed for ${file.name}:`, result.error)
          }
        } catch (error) {
          failCount++
          console.error(`Error uploading ${file.name}:`, error)
        }
      }

      // Show summary
      const featuredCount = filePreviews.filter(p => p.isFeatured).length
      if (successCount > 0 && failCount === 0) {
        setAlert({
          type: 'success',
          message: `Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}${featuredCount > 0 ? ` (${featuredCount} marked as featured)` : ''}!`
        })
      } else if (successCount > 0 && failCount > 0) {
        setAlert({
          type: 'warning',
          message: `Uploaded ${successCount} photo${successCount > 1 ? 's' : ''}, ${failCount} failed`
        })
      } else {
        setAlert({ type: 'danger', message: 'All uploads failed' })
      }

      // Reset form
      setUploadCaption('')
      setUploadCategory('General')
      setUploadEventId('')
      setUploadEventName('')
      setUploadIsFeatured(false)
      setSelectedFiles([])
      setFilePreviews([])
      // Force invalidate all photo queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'photos'] })
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred while uploading' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.id) return
    const result = await adminApi.photos.delete(deleteModal.id)
    if (result.success) {
      setAlert({ type: 'success', message: 'Photo deleted' })
      queryClient.invalidateQueries({ queryKey: ['admin', 'photos'] })
    } else setAlert({ type: 'danger', message: result.error })
  }

  const handleToggleFeatured = async (photoId: string, currentFeaturedStatus: boolean) => {
    const result = await adminApi.photos.update(photoId, { is_featured: !currentFeaturedStatus })
    if (result.success) {
      setAlert({
        type: 'success',
        message: !currentFeaturedStatus ? 'Photo marked as featured' : 'Photo unmarked as featured'
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'photos'] })
    } else {
      setAlert({ type: 'danger', message: result.error })
    }
  }

  const filteredPhotos = photos || []

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-12">
            <h2>Gallery</h2>
            <p className="text-muted">Manage event photos</p>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search photos by caption..."
          onSearchChange={setSearchTerm}
          currentItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
          filters={[
            {
              label: 'Year',
              key: 'year',
              options: [
                { label: 'All Years', value: 'all' },
                ...yearOptions.map(year => ({ label: year, value: year }))
              ],
              value: yearFilter,
              onChange: setYearFilter
            },
            {
              label: 'Featured',
              key: 'featured',
              options: [
                { label: 'All Photos', value: 'all' },
                { label: 'Featured Only', value: 'true' },
                { label: 'Not Featured', value: 'false' }
              ],
              value: featuredFilter,
              onChange: setFeaturedFilter
            }
          ]}
        />

        {/* Upload Section */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Upload Photo</h5>

            {/* Photo metadata form */}
            <div className="row mb-3">
              <div className="col-md-3">
                <label className="form-label">Year *</label>
                <select
                  className="form-select"
                  value={uploadYear}
                  onChange={(e) => setUploadYear(e.target.value)}
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="NOAI">NOAI (Olympiad)</option>
                  <option value="Keynotes">Keynotes</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Panels">Panels</option>
                  <option value="Networking">Networking</option>
                  <option value="Posters">Posters</option>
                  <option value="Speakers">Speakers</option>
                  <option value="Social">Social</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Awards">Awards</option>
                  <option value="Sponsors">Sponsors</option>
                  <option value="Talks">Talks</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Event (optional)</label>
                <select
                  className="form-select"
                  value={uploadEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                >
                  <option value="">No Event</option>
                  {(events || []).map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
                {uploadEventName && (
                  <small className="text-muted">Event: {uploadEventName}</small>
                )}
              </div>
              <div className="col-md-3">
                <label className="form-label">Caption (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Photo caption..."
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="uploadIsFeatured"
                    checked={uploadIsFeatured}
                    onChange={(e) => setUploadIsFeatured(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="uploadIsFeatured">
                    ⭐ Mark as Featured Photo
                  </label>
                </div>
              </div>
            </div>

            {/* File Selection Buttons */}
            <div className="mb-3">
              <input
                ref={fileInputRef}
                type="file"
                className="d-none"
                accept="image/*,video/mp4,video/quicktime,.heic,.heif,.mov"
                multiple
                onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
              />
              <input
                ref={folderInputRef}
                type="file"
                className="d-none"
                accept="image/*,video/mp4,video/quicktime,.heic,.heif,.mov"
                {...({ webkitdirectory: "", directory: "" } as any)}
                multiple
                onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
              />

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  📁 Select Multiple Photos
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={uploading}
                >
                  📂 Select Folder
                </button>
              </div>
              <small className="text-muted">
                Select images (JPEG, PNG, WebP, HEIC) or videos (MP4, MOV). Max 100MB per file.
              </small>
            </div>

            {/* File Previews */}
            {filePreviews.length > 0 && (
              <div className="mb-3">
                <label className="form-label">
                  Selected Photos ({filePreviews.length})
                </label>
                <div className="row g-2">
                  {filePreviews.map((item, index) => (
                    <div key={index} className="col-md-2">
                      <div className="card h-100">
                        <div style={{ position: 'relative' }}>
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            style={{ height: '120px', objectFit: 'cover', cursor: 'pointer' }}
                            className="card-img-top"
                            onClick={() => setExpandedImage(item.preview)}
                          />
                          {item.isFeatured && (
                            <span
                              className="badge bg-warning text-dark"
                              style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '0.7rem' }}
                            >
                              ⭐
                            </span>
                          )}
                        </div>
                        <div className="card-body p-2">
                          <p className="small mb-1 text-truncate" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-muted small mb-2" style={{ fontSize: '0.7rem' }}>
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <div className="d-flex gap-1">
                            <button
                              className={`btn btn-sm flex-grow-1 ${item.isFeatured ? 'btn-success' : 'btn-warning'}`}
                              onClick={() => toggleFileFeatured(index)}
                              disabled={uploading}
                              title={item.isFeatured ? 'Unmark as featured' : 'Mark as featured'}
                            >
                              {item.isFeatured ? '⭐' : '☆'}
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeFile(index)}
                              disabled={uploading}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Uploading {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}...
                    </>
                  ) : (
                    `📤 Upload ${selectedFiles.length} Photo${selectedFiles.length > 1 ? 's' : ''}`
                  )}
                </button>
                {!uploading && (
                  <button
                    className="btn btn-secondary ms-2"
                    onClick={() => {
                      setSelectedFiles([])
                      setFilePreviews([])
                      setUploadCaption('')
                      setUploadIsFeatured(false)
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" />
                <p className="mt-3 text-muted">Loading photos...</p>
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No photos found</p>
              </div>
            ) : (
              <div className="row g-3">
                {(filteredPhotos || []).map((photo: any) => (
                  <div key={photo.id} className="col-md-3">
                    <div className="card h-100">
                      <div style={{ position: 'relative' }}>
                        <img src={photo.image_url} className="card-img-top" alt={photo.caption} style={{ height: '200px', objectFit: 'cover' }} />
                        {photo.is_featured && (
                          <span
                            className="badge bg-warning text-dark"
                            style={{ position: 'absolute', top: '8px', left: '8px' }}
                          >
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-primary">{photo.year}</span>
                          {photo.category && (
                            <span className="badge bg-secondary">{photo.category}</span>
                          )}
                        </div>
                        {photo.caption && (
                          <p className="small mb-2" style={{ fontSize: '0.85rem' }}>{photo.caption}</p>
                        )}
                        <div className="d-flex gap-2">
                          <button
                            className={`btn btn-sm flex-grow-1 ${photo.is_featured ? 'btn-success' : 'btn-warning'}`}
                            onClick={() => handleToggleFeatured(photo.id, photo.is_featured)}
                            title={photo.is_featured ? 'Remove from featured' : 'Mark as featured'}
                          >
                            {photo.is_featured ? '⭐ Featured' : '☆ Feature'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteModal({ isOpen: true, id: photo.id })}
                            title="Delete photo"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage)}
                onPageChange={(page) => {
                  setCurrentPage(page)
                }}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        </div>

        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, id: null })}
          onConfirm={handleDelete}
          title="Delete Photo"
          message="Delete this photo? This action cannot be undone."
          variant="danger"
        />

        {/* Expanded Image Modal */}
        {expandedImage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setExpandedImage(null)}
          >
            <img
              src={expandedImage}
              alt="Expanded preview"
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setExpandedImage(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
