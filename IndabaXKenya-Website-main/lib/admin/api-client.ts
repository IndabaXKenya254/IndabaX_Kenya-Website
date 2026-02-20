// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN API CLIENT
// ═══════════════════════════════════════════════════════════════════════
// Client-side API wrapper for admin operations
// Created: Admin UI Phase 1 - Foundation

/**
 * Base API call wrapper with error handling
 */
async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; count?: number }> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (response.ok && data.success) {
      return {
        success: true,
        data: data.data,
        count: data.count // ✅ Now returning count!
      }
    } else {
      return {
        success: false,
        error: data.error?.message || 'Request failed',
      }
    }
  } catch (error) {
    console.error('API call failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Upload file wrapper
 */
async function uploadFile(url: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    const data = await response.json()

    if (response.ok && data.success) {
      return { success: true, data: data.data }
    } else {
      return {
        success: false,
        error: data.error?.message || 'Upload failed',
      }
    }
  } catch (error) {
    console.error('Upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Admin API Client
 */
export const adminApi = {
  // ============================================================================
  // POSTS
  // ============================================================================
  posts: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/posts${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/posts/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/posts/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // EVENTS
  // ============================================================================
  events: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/events${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/events/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/events/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // SPEAKERS
  // ============================================================================
  speakers: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/speakers${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/speakers/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/speakers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/speakers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/speakers/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // SPONSORS
  // ============================================================================
  sponsors: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/sponsors${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/sponsors/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/sponsors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/sponsors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/sponsors/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // FAQS
  // ============================================================================
  faqs: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/faqs${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/faqs/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/faqs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/faqs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // GALLERY PHOTOS
  // ============================================================================
  photos: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/photos${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/photos/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/photos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/photos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/photos/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // APPLICATIONS
  // ============================================================================
  applications: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/applications${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/applications/${id}`),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // ============================================================================
  // SETTINGS
  // ============================================================================
  settings: {
    list: () => apiCall('/api/admin/settings'),

    get: (key: string) => apiCall(`/api/admin/settings/${key}`),

    update: (key: string, data: any) =>
      apiCall(`/api/admin/settings/${key}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // ============================================================================
  // SUBSCRIBERS
  // ============================================================================
  subscribers: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/subscribers${params ? '?' + new URLSearchParams(params) : ''}`),

    export: (format: 'csv' | 'json' = 'csv') =>
      apiCall(`/api/admin/subscribers/export?format=${format}`),
  },

  // ============================================================================
  // TAGS
  // ============================================================================
  tags: {
    events: {
      list: (params?: Record<string, string>) =>
        apiCall(`/api/admin/tags/events${params ? '?' + new URLSearchParams(params) : ''}`),

      get: (id: string) => apiCall(`/api/admin/tags/events/${id}`),

      create: (data: any) =>
        apiCall('/api/admin/tags/events', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: (id: string, data: any) =>
        apiCall(`/api/admin/tags/events/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),

      delete: (id: string) =>
        apiCall(`/api/admin/tags/events/${id}`, {
          method: 'DELETE',
        }),
    },

    posts: {
      list: (params?: Record<string, string>) =>
        apiCall(`/api/admin/tags/posts${params ? '?' + new URLSearchParams(params) : ''}`),

      get: (id: string) => apiCall(`/api/admin/tags/posts/${id}`),

      create: (data: any) =>
        apiCall('/api/admin/tags/posts', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: (id: string, data: any) =>
        apiCall(`/api/admin/tags/posts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),

      delete: (id: string) =>
        apiCall(`/api/admin/tags/posts/${id}`, {
          method: 'DELETE',
        }),
    },
  },

  // ============================================================================
  // EXPERTISE
  // ============================================================================
  expertise: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/expertise${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/expertise/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/expertise', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/expertise/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/expertise/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // ADMIN USERS
  // ============================================================================
  admins: {
    list: () => apiCall('/api/admin/admins'),

    invite: (data: { email: string; role: string }) =>
      apiCall('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/admins/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // SCHEDULE ITEMS
  // ============================================================================
  schedules: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/schedules${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/schedules/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/schedules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/schedules/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // PRICING TIERS
  // ============================================================================
  pricing: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/pricing${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/pricing/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/pricing', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/pricing/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/pricing/${id}`, {
        method: 'DELETE',
      }),

    reorder: (items: Array<{ id: string; display_order: number }>) =>
      apiCall('/api/admin/pricing/reorder', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },

  // ============================================================================
  // STATS (FUN FACTS)
  // ============================================================================
  stats: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/stats${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/stats/${id}`),

    create: (data: any) =>
      apiCall('/api/admin/stats', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiCall(`/api/admin/stats/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/stats/${id}`, {
        method: 'DELETE',
      }),

    reorder: (items: Array<{ id: string; display_order: number }>) =>
      apiCall('/api/admin/stats/reorder', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },

  // ============================================================================
  // CONTACT SUBMISSIONS
  // ============================================================================
  contactSubmissions: {
    list: (params?: Record<string, string>) =>
      apiCall(`/api/admin/contact-submissions${params ? '?' + new URLSearchParams(params) : ''}`),

    get: (id: string) => apiCall(`/api/admin/contact-submissions/${id}`),

    updateStatus: (id: string, status: 'new' | 'read' | 'resolved', notes?: string) =>
      apiCall(`/api/admin/contact-submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, admin_notes: notes }),
      }),

    delete: (id: string) =>
      apiCall(`/api/admin/contact-submissions/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================================
  // FILE UPLOADS
  // ============================================================================
  upload: {
    eventImage: (file: File) => uploadFile('/api/admin/upload/event-image', file),
    speakerPhoto: (file: File) => uploadFile('/api/admin/upload/speaker-photo', file),
    galleryPhoto: (file: File) => uploadFile('/api/admin/upload/gallery-photo', file),
    sponsorLogo: (file: File) => uploadFile('/api/admin/upload/sponsor-logo', file),
    postImage: (file: File) => uploadFile('/api/admin/upload/post-image', file),
    siteLogo: (file: File) => uploadFile('/api/admin/upload/site-logo', file),

    delete: (bucket: string, path: string) =>
      apiCall(`/api/admin/upload/${bucket}/${path}`, {
        method: 'DELETE',
      }),
  },
}
