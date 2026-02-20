'use client'

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS CONTEXT
// ═══════════════════════════════════════════════════════════════════════
// Provides site-wide settings from database to all components

import React, { createContext, useContext, useMemo } from 'react'
import { useSettingsData } from '@/hooks/useApi'
import type { Setting } from '@/../../types/api'

export interface SiteSettings {
  // Site Info
  site_name?: string
  site_description?: string
  site_keywords?: string
  site_logo_url?: string
  site_maintenance_mode?: boolean

  // Contact Info
  contact_email?: string
  contact_phone?: string
  contact_address?: string

  // Social Links
  social_twitter?: string
  social_linkedin?: string
  social_facebook?: string
  social_instagram?: string
  social_youtube?: string
  social_github?: string

  // Features
  registration_popup_enabled?: boolean
  event_registration_enabled?: boolean
  event_registration_deadline?: string
  submission_deadline?: string // Call for Papers submission deadline
  current_event_year?: string
  newsletter_enabled?: boolean
  newsletter_provider?: string

  // Complex settings (JSONB objects)
  banner?: {
    eventTitle?: string
    eventSubtitle?: string
    eventDate?: string
    eventEndDate?: string
    eventLocation?: string
    showCountdown?: boolean
    showVideo?: boolean
    videoUrl?: string
    registrationUrl?: string
    submitPaperUrl?: string
  }
  popup?: {
    enabled?: boolean
    title?: string
    content?: string
    buttonText?: string
    buttonLink?: string
    delay?: number
  }
  site_info?: {
    title?: string
    description?: string
    address?: string
    contact_email?: string
    contact_phone?: string
  }
}

interface SettingsContextType {
  settings: SiteSettings
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  loading: true,
  error: null,
  refetch: async () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // React Query hook with automatic caching and deduplication
  const { data: settingsData, isLoading: loading, isError, refetch } = useSettingsData()

  // API already returns flat object - no transformation needed
  const settings = useMemo<SiteSettings>(() => {
    return (settingsData as SiteSettings) || {}
  }, [settingsData])

  const error = isError ? 'Failed to load site settings' : null

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refetch: async () => {
          await refetch()
        },
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// Helper hooks for specific settings
export function useSiteName() {
  const { settings } = useSettings()
  return settings.site_name || 'IndabaX Kenya'
}

export function useSocialLinks() {
  const { settings } = useSettings()
  return {
    twitter: settings.social_twitter,
    linkedin: settings.social_linkedin,
    facebook: settings.social_facebook,
    instagram: settings.social_instagram,
    youtube: settings.social_youtube,
    github: settings.social_github,
  }
}

export function useContactInfo() {
  const { settings } = useSettings()
  return {
    email: settings.contact_email,
    phone: settings.contact_phone,
    address: settings.contact_address,
  }
}
